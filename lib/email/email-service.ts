/**
 * Email Service - Reserve4You
 * Supports Resend and SMTP (Combell) with fallback
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { createClient } from '@/lib/supabase/server';

interface EmailSettings {
  provider: 'resend' | 'smtp';
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  resend_api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_username?: string;
  smtp_password?: string;
}

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export class EmailService {
  private settings: EmailSettings;
  private resendClient?: Resend;
  private smtpTransporter?: nodemailer.Transporter;

  constructor(settings: EmailSettings) {
    this.settings = settings;

    // Initialize Resend if API key provided
    if (settings.provider === 'resend' && settings.resend_api_key) {
      this.resendClient = new Resend(settings.resend_api_key);
    }

    // Initialize SMTP if credentials provided
    if (settings.provider === 'smtp' && settings.smtp_host) {
      this.smtpTransporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port || 587,
        secure: settings.smtp_secure || false,
        auth: {
          user: settings.smtp_username!,
          pass: settings.smtp_password!,
        },
      });
    }
  }

  async sendEmail(params: SendEmailParams): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const { to, toName, subject, html, text, replyTo } = params;

    try {
      // Try Resend first
      if (this.settings.provider === 'resend' && this.resendClient) {
        const result = await this.sendViaResend({
          to,
          toName,
          subject,
          html,
          text,
          replyTo,
        });
        return result;
      }

      // Fallback to SMTP
      if (this.settings.provider === 'smtp' && this.smtpTransporter) {
        const result = await this.sendViaSMTP({
          to,
          toName,
          subject,
          html,
          text,
          replyTo,
        });
        return result;
      }

      return {
        success: false,
        error: 'No email provider configured',
      };
    } catch (error: any) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private async sendViaResend(params: SendEmailParams): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.resendClient) {
      return { success: false, error: 'Resend not initialized' };
    }

    try {
      const result = await this.resendClient.emails.send({
        from: `${this.settings.from_name} <${this.settings.from_email}>`,
        to: params.toName ? `${params.toName} <${params.to}>` : params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || this.settings.reply_to_email,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendViaSMTP(params: SendEmailParams): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.smtpTransporter) {
      return { success: false, error: 'SMTP not initialized' };
    }

    try {
      const info = await this.smtpTransporter.sendMail({
        from: `"${this.settings.from_name}" <${this.settings.from_email}>`,
        to: params.toName ? `"${params.toName}" <${params.to}>` : params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || this.settings.reply_to_email,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (this.settings.provider === 'smtp' && this.smtpTransporter) {
      try {
        await this.smtpTransporter.verify();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    if (this.settings.provider === 'resend' && this.resendClient) {
      // Resend doesn't have a verify method, so we just check if it's initialized
      return { success: true };
    }

    return { success: false, error: 'No provider configured' };
  }
}

/**
 * Replace template variables in content
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  return result;
}

/**
 * Get email settings for a tenant
 */
export async function getEmailSettings(tenantId: string): Promise<EmailSettings | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as EmailSettings;
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(
  tenantId: string,
  bookingId: string,
  bookingData: {
    customer_name: string;
    customer_email: string;
    booking_date: string;
    booking_time: string;
    number_of_guests: number;
    location_name: string;
    location_address?: string;
    location_phone?: string;
  }
) {
  const supabase = await createClient();
  
  // Get email settings
  const settings = await getEmailSettings(tenantId);
  if (!settings) {
    throw new Error('Email settings not configured');
  }

  // Get template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('template_type', 'booking_confirmation')
    .eq('is_active', true)
    .single();

  if (!template) {
    throw new Error('Template not found');
  }

  // Replace variables
  const variables = {
    guest_name: bookingData.customer_name,
    date: bookingData.booking_date,
    time: bookingData.booking_time,
    party_size: bookingData.number_of_guests.toString(),
    location_name: bookingData.location_name,
    location_address: bookingData.location_address || '',
    location_phone: bookingData.location_phone || '',
  };

  const subject = replaceTemplateVariables(template.subject, variables);
  const html = replaceTemplateVariables(template.html_content, variables);
  const text = template.text_content
    ? replaceTemplateVariables(template.text_content, variables)
    : undefined;

  // Send email
  const emailService = new EmailService(settings);
  const result = await emailService.sendEmail({
    to: bookingData.customer_email,
    toName: bookingData.customer_name,
    subject,
    html,
    text,
  });

  // Log delivery
  if (result.success) {
    await supabase.rpc('mark_email_sent', {
      p_log_id: bookingId, // You'd get this from queue_email
      p_provider_message_id: result.messageId || '',
    });
  }

  return result;
}

