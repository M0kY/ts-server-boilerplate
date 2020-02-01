import nodemailer from 'nodemailer';
import { MAILER_SMTP_HOST, MAILER_USER, MAILER_PASSWORD, MAILER_PORT, MAILER_NAME } from '../config/envConfig';
import { ERROR_WHILE_SENDING_EMAIL, getErrorByKey, CustomError, ERROR_USER_NOT_FOUND } from '../constants/errorCodes';
import { logger } from '../utils/logger';
import activationMailTemplate from './templates/activationTemplate';
import passwordResetTemplate from './templates/passwordResetTemplate';
import { IMailTemplate, MailReceiver } from '../types/Mailer';

class Mailer {
  private readonly transporter = nodemailer.createTransport({
    host: MAILER_SMTP_HOST,
    port: MAILER_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: MAILER_USER,
      pass: MAILER_PASSWORD,
    },
  });

  private async send(receiver: MailReceiver, mailTemplate: IMailTemplate) {
    if (typeof receiver === 'undefined') {
      logger.error(`Invalid undefined user provided to mailer`, { label: 'MAILER' });
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    const template = await mailTemplate(receiver.id!);
    const subject = template.subject;
    const html = template.html;

    await this.transporter
      .sendMail({
        from: `${MAILER_NAME} <${MAILER_USER}>`,
        to: receiver.email,
        subject,
        html,
      })
      .catch((error: Error) => {
        logger.error(error);
        throw new CustomError(getErrorByKey(ERROR_WHILE_SENDING_EMAIL));
      });
    logger.info(`Successfully sent "${subject}" email.`, { label: 'MAILER' });
  }

  public sendActivationMail(receiver: MailReceiver) {
    this.send(receiver, activationMailTemplate);
  }

  public sendPasswordResetMail(receiver: MailReceiver) {
    this.send(receiver, passwordResetTemplate);
  }
}

export const Mail = new Mailer();
