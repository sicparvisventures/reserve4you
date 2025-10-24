import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService, replaceTemplateVariables, getEmailSettings } from '@/lib/email/email-service';

/**
 * Process pending emails
 * This should be called periodically (e.g., via cron or on page load)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get pending emails
    const { data: pendingEmails, error: pendingError } = await supabase.rpc('get_pending_emails', {
      p_limit: 10,
    });

    if (pendingError) {
      console.error('Error fetching pending emails:', pendingError);
      return NextResponse.json({ error: 'Failed to fetch pending emails' }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No pending emails' });
    }

    const results = [];

    for (const email of pendingEmails) {
      try {
        // Get email settings for this tenant
        const settings = await getEmailSettings(email.tenant_id);
        
        if (!settings) {
          console.error(`No email settings for tenant ${email.tenant_id}`);
          // Mark as failed
          await supabase
            .from('email_delivery_log')
            .update({
              status: 'failed',
              failed_at: new Date().toISOString(),
              error_message: 'Email settings not configured',
            })
            .eq('id', email.id);
          continue;
        }

        // Replace variables in template
        const variables = email.metadata || {};
        const subject = replaceTemplateVariables(email.template.subject, variables);
        const html = replaceTemplateVariables(email.template.html_content, variables);
        const text = email.template.text_content
          ? replaceTemplateVariables(email.template.text_content, variables)
          : undefined;

        // Add tracking pixel to HTML
        const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3007'}/api/email/track/${email.id}" width="1" height="1" alt="" />`;
        const htmlWithTracking = html + trackingPixel;

        // Send email
        const emailService = new EmailService(settings);
        const result = await emailService.sendEmail({
          to: email.recipient_email,
          toName: email.recipient_name,
          subject,
          html: htmlWithTracking,
          text,
        });

        if (result.success) {
          // Mark as sent
          await supabase.rpc('mark_email_sent', {
            p_log_id: email.id,
            p_provider_message_id: result.messageId || '',
          });

          results.push({
            id: email.id,
            status: 'sent',
            recipient: email.recipient_email,
          });
        } else {
          // Mark as failed
          await supabase
            .from('email_delivery_log')
            .update({
              status: 'failed',
              failed_at: new Date().toISOString(),
              error_message: result.error,
              retry_count: supabase.raw('retry_count + 1'),
            })
            .eq('id', email.id);

          results.push({
            id: email.id,
            status: 'failed',
            recipient: email.recipient_email,
            error: result.error,
          });
        }
      } catch (error: any) {
        console.error('Error processing email:', error);
        results.push({
          id: email.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Email processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET as well for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}

