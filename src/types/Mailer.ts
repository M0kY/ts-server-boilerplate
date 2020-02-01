import { User } from '../modules/entity/User';

export type MailReceiver = Partial<User>;

export interface IMailTemplate {
  (userId: number): Promise<{ subject: string; html: string }>;
}

export interface SendMailInput {
  (receiver: MailReceiver, templateType: IMailTemplate): Promise<void>;
}
