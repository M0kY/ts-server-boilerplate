import nodemailer from 'nodemailer';
import { MAILER_SMTP_HOST, MAILER_USER, MAILER_PASSWORD, MAILER_PORT, MAILER_NAME } from '../config/envConfig';
import { SendMailInput } from '../types/Mailer';
import { ERROR_WHILE_SENDING_EMAIL, getErrorByKey, CustomError, ERROR_USER_NOT_FOUND } from '../constants/errorCodes';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: MAILER_SMTP_HOST,
  port: MAILER_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: MAILER_USER,
    pass: MAILER_PASSWORD,
  },
});

export const sendMail: SendMailInput = async (receiver, templateType) => {
  if (typeof receiver === 'undefined') {
    logger.error(`Invalid undefined user provided to mailer`, { label: 'MAILER' });
    throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
  }

  const mailTemplate = require(`./templates/${templateType}`);
  const subject = mailTemplate.subject;
  const html = await mailTemplate.html(receiver.id);

  await transporter
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
};
