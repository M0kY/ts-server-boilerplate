export enum MailTemplateType {
  ACCOUNT_ACTIVATION = 'activation',
  PASSWORD_RESET = 'passwordReset',
}

export interface SendMailInput {
  (receiver: string, templateType: MailTemplateType, data?: any): Promise<void>;
}
