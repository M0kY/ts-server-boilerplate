export enum MailTemplateType {
  ACCOUNT_ACTIVATION = 'activation',
}

export interface SendMailInput {
  (receiver: string, templateType: MailTemplateType, data?: any): Promise<void>;
}
