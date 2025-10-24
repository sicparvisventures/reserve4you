import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService, replaceTemplateVariables } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      bookingId,
      consumerId,
      recipientEmail,
      recipientName,
      templateType,
      variables,
    } = body;

    const supabase = await createClient();

    // Get email settings
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Email settings not configured' },
        { status: 400 }
      );
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Replace variables
    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.html_content, variables);
    const text = template.text_content
      ? replaceTemplateVariables(template.text_content, variables)
      : undefined;

    // Queue email first
    const { data: logId, error: queueError } = await supabase.rpc('queue_email', {
      p_tenant_id: tenantId,
      p_booking_id: bookingId || null,
      p_consumer_id: consumerId || null,
      p_recipient_email: recipientEmail,
      p_recipient_name: recipientName,
      p_template_type: templateType,
      p_variables: variables,
    });

    if (queueError) {
      console.error('Error queuing email:', queueError);
      return NextResponse.json({ error: 'Failed to queue email' }, { status: 500 });
    }

    // Send email
    const emailService = new EmailService(settings);
    const result = await emailService.sendEmail({
      to: recipientEmail,
      toName: recipientName,
      subject,
      html,
      text,
    });

    if (!result.success) {
      // Mark as failed
      await supabase
        .from('email_delivery_log')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: result.error,
        })
        .eq('id', logId);

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Mark as sent
    await supabase.rpc('mark_email_sent', {
      p_log_id: logId,
      p_provider_message_id: result.messageId || '',
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      logId,
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

