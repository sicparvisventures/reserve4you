/**
 * Send Booking Invitation Email API
 * POST: Send email when someone is invited to a booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService, getEmailSettings } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, toName, subject, html, bookingId, friendId, tenantId } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Get tenant ID from booking if not provided
    let finalTenantId = tenantId;
    if (!finalTenantId && bookingId) {
      const supabase = await createClient();
      const { data: booking } = await supabase
        .from('bookings')
        .select('location:locations(tenant_id)')
        .eq('id', bookingId)
        .single();
      
      if (booking && (booking as any).location) {
        finalTenantId = (booking as any).location.tenant_id;
      }
    }

    // Get email settings for tenant (or use default)
    let emailSettings = null;
    if (finalTenantId) {
      emailSettings = await getEmailSettings(finalTenantId);
    }

    // If no tenant-specific settings, use default system settings
    if (!emailSettings) {
      // Use default email settings from environment
      emailSettings = {
        provider: (process.env.EMAIL_PROVIDER as 'resend' | 'smtp') || 'smtp',
        from_email: process.env.EMAIL_FROM || 'noreply@reserve4you.com',
        from_name: process.env.EMAIL_FROM_NAME || 'Reserve4You',
        reply_to_email: process.env.EMAIL_REPLY_TO || 'support@reserve4you.com',
        resend_api_key: process.env.RESEND_API_KEY,
        smtp_host: process.env.SMTP_HOST,
        smtp_port: parseInt(process.env.SMTP_PORT || '587'),
        smtp_secure: process.env.SMTP_SECURE === 'true',
        smtp_username: process.env.SMTP_USERNAME,
        smtp_password: process.env.SMTP_PASSWORD,
      };
    }

    // Send email
    const emailService = new EmailService(emailSettings);
    const result = await emailService.sendEmail({
      to,
      toName,
      subject,
      html,
      replyTo: emailSettings.reply_to_email,
    });

    if (!result.success) {
      console.error('Failed to send booking invitation email:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Error in POST /api/email/send-booking-invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}


