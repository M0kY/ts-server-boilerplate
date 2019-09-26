import nodemailer from 'nodemailer';
import { MAILER_SMTP_HOST, MAILER_USER, MAILER_PASSWORD, MAILER_PORT, MAILER_NAME } from '../config/envConfig';
import { SendMailInput } from '../types/Mailer';
import { ERROR_WHILE_SENDING_EMAIL, getErrorByKey, CustomError } from '../constants/errorCodes';
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

// TODO improve input params scheme, receive email sent as receiver and in data object
export const sendMail: SendMailInput = async (receiver, templateType, data) => {
  const mailTemplate = require(`./templates/${templateType}`);
  const subject = mailTemplate.subject;
  const html = await mailTemplate.html(data.id);

  await transporter
    .sendMail({
      from: `${MAILER_NAME} <${MAILER_USER}>`,
      to: receiver,
      subject,
      html,
    })
    .catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_SENDING_EMAIL));
    });
};
