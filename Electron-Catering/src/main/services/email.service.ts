import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export class EmailService {
  private buildTransport(config: SmtpConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
  }

  async testConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.host || !config.user) {
      return { success: false, error: 'SMTP host and username are required' };
    }
    try {
      const transport = this.buildTransport(config);
      await transport.verify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'SMTP connection failed' };
    }
  }

  async sendMail(
    config: SmtpConfig,
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; content: Buffer }[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!config.host || !config.user) {
      return { success: false, error: 'SMTP is not configured. Set it up in Settings first.' };
    }
    if (!to) {
      return { success: false, error: 'Recipient email address is missing.' };
    }
    try {
      const transport = this.buildTransport(config);
      await transport.sendMail({
        from: config.user,
        to,
        subject,
        html,
        attachments,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send email' };
    }
  }
}
