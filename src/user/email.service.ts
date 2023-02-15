import { Injectable, Logger } from '@nestjs/common';
import { ENV } from '../app.config';

import Mailgun from 'mailgun.js';
import * as formData from 'form-data';

const {
  EMAIL_PROVIDER_DOMAIN,
  EMAIL_PROVIDER_API_KEY,
  // EMAIL_PROVIDER_API_URL,
} = ENV;

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: EMAIL_PROVIDER_API_KEY,
  // url: EMAIL_PROVIDER_API_URL,
  url: 'https://api.eu.mailgun.net',
});

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendTest() {
    const data = {
      // from: 'Mailgun Sandbox <postmaster@sandbox22532ddb216849edb01e16fcd6f1f75d.mailgun.org>',
      from: 'Wcn-info <postmaster@wcn-info.publicvm.com>',
      to: 'watchchain.test@gmail.com',
      // to: 'visepak@gmail.com',
      subject: 'Please confirm your email',
      // text: 'Testing some Mailgun awesomness!',
      template: 'confirm',
      ['t:variables']: `{"confirmationCode": ${'123457'}}`,
    };
    return await this.send(data);
  }

  private async send(data): Promise<{ success: boolean }> {
    try {
      const result = await mg.messages.create(EMAIL_PROVIDER_DOMAIN, data);
      if (!!result && result.status === 200) {
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      this.logger.error(e);
      return { success: false };
    }
  }

  async sendConfirmationToAddEmail({
    email,
    confirmationCode,
  }: {
    email: string;
    confirmationCode: number;
  }) {
    const data = {
      from: 'Wcn-info <postmaster@wcn-info.publicvm.com>',
      to: email,
      subject: 'Please confirm your email',
      template: 'confirm',
      ['t:variables']: `{"confirmationCode": ${confirmationCode}}`,
    };
    const { success } = await this.send(data);
    return { success: !!success };
  }

  async sendEmailMessage(email, text, subject) {
    const data = {
      from: `WatchChain <postmaster@${EMAIL_PROVIDER_DOMAIN}>`,
      to: email,
      subject,
      text,
    };
    const { success } = await this.send(data);
    console.log({ success: !!success });
  }
}
