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
  suggestedBy?: string; // e.g. "Dad", "Mother", "Groom"
  primaryCaller?: string; // Who is responsible for calling this guest
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Collaborator {
  id: string;
  email: string;
  role: string;
  name: string;
  addedAt: number;
}

export interface WeddingSettings {
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  whatsappTemplate: string;
  greetingMessage: string;
  invitationTone: string;
}

export interface ActivityLog {
  id: string;
  guestId?: string;
  guestName?: string;
  action: string;
  details: string;
  timestamp: number;
}

export type View = 'dashboard' | 'guests' | 'add' | 'categories' | 'settings' | 'invite' | 'logs' | 'onboarding';
