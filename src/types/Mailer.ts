import { User } from '../modules/entity/User';

export enum MailTemplateType {
  ACCOUNT_ACTIVATION = 'activation',
  PASSWORD_RESET = 'passwordReset',
}

export interface SendMailInput {
  (receiver: Partial<User>, templateType: MailTemplateType): Promise<void>;
}
