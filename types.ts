
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
  isAction?: boolean;
  sources?: { title: string; uri: string }[];
}

export interface ToolAction {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

export interface User {
  username: string;
  email: string;
  joinedAt: number;
  avatarColor: string;
}

export interface AISettings {
  persona: 'Professional' | 'Creative' | 'Concise';
  customInstruction: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}
