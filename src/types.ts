export enum InvitationStatus {
  NOT_INVITED = 'Not Invited',
  INVITED = 'Invited',
  CONFIRMED = 'Confirmed',
  NOT_COMING = 'Not Coming'
}

export interface Guest {
  id: string;
  name: string;
  phone?: string;
  category: string;
  notes?: string;
  status: InvitationStatus;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface WeddingSettings {
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  whatsappTemplate: string;
  greetingMessage: string;
  invitationTone: string;
  telegramBotToken?: string;
  telegramEnabled: boolean;
}

export type View = 'dashboard' | 'guests' | 'add' | 'categories' | 'settings' | 'invite';
