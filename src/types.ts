export interface Letter {
  id: string;
  subject?: string;
  message: string;
  mood?: string;
  createdAt: string; // ISO string
  isRead: boolean;
}

export type LetterMood = 
  | '❤️ ভালোবাসা'
  | '🥺 মিস করি'
  | '😊 আনন্দ'
  | '😔 অভিমান'
  | '🤍 কৃতজ্ঞতা'
  | '😶 না বলা কথা'
  | '✨ অন্য কিছু';

export const MOOD_OPTIONS: LetterMood[] = [
  '❤️ ভালোবাসা',
  '🥺 মিস করি',
  '😊 আনন্দ',
  '😔 অভিমান',
  '🤍 কৃতজ্ঞতা',
  '😶 না বলা কথা',
  '✨ অন্য কিছু',
];

export interface AdminStats {
  total: number;
  unread: number;
  read: number;
  today: number;
  moodCounts: Record<string, number>;
}

export type FilterStatus = 'all' | 'unread' | 'read' | 'today';
export type SortOrder = 'newest' | 'oldest';

export interface SubmitLetterPayload {
  message: string;
  subject?: string;
  mood?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}
