import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const password = process.env.SMTP_PASSWORD;
    const port = Number(process.env.SMTP_PORT ?? '587');
    const secure = process.env.SMTP_SECURE === 'true';

    this.from =
      process.env.EMAIL_FROM?.trim() || 'Trimly <no-reply@trimly.app>';

    if (host && user && password) {
      this.transporter = nodemailer.createTransport({
        auth: { pass: password, user },
        host,
        port,
        secure,
      });
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be configured in production.',
      );
    }

    this.transporter = null;
    this.logger.warn(
      'SMTP yapılandırılmadı. Doğrulama kodları yalnız geliştirme terminaline yazılacak.',
    );
  }

  get usesDevelopmentPreview() {
    return this.transporter === null;
  }

  async sendEmailVerificationCode(email: string, code: string) {
    if (!this.transporter) {
      this.logger.log(`[DEV EMAIL] ${email} doğrulama kodu: ${code}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      subject: 'Trimly e-posta doğrulama kodun',
      text: `Trimly e-posta doğrulama kodun: ${code}. Bu kod 10 dakika geçerlidir.`,
      to: email,
    });
  }
}
