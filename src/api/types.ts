export interface MemberDto {
  id: string;
  username: string;
  displayName?: string;
}

export interface ChatDto {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP' | string;
  members: MemberDto[];
  createdAt?: string;
}

export interface MessageDto {
  id: string;
  chatId: string;
  authorId: string;
  content: string;
  type: 'TEXT' | 'MEDIA' | string;
  mediaUrl?: string;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  chatId: string;
  userId: string;
  publicKey: string;
  createdAt?: string;
}

export interface TypingEvent {
  chatId: string;
  isTyping: boolean;
  userId?: string;
}
