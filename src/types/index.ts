export interface Consultant {
  id: string;
  name: string;
  avatar: string;
  experience: string;
  specialties: string[];
  expertise: string;
  connections: string;
}

export interface Message {
  id: string;
  type: 'user' | 'consultant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

export interface TalentCard {
  id: string;
  name: string;
  company: string;
  skills: string[];
  introduction: string;
  avatar: string;
}

export interface ConversationHistory {
  id: string;
  consultantId: string;
  consultantName: string;
  date: Date;
  messages: Message[];
  recommendedTalents: TalentCard[];
}

// WebRTC related exports
export * from './webrtc';