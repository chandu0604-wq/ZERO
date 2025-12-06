export enum NovaState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  EXECUTING = 'EXECUTING',
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'tool_call' | 'tool_result';
  toolName?: string;
  toolArgs?: any;
}

export interface AppConfig {
  userName: string;
  voiceEnabled: boolean;
  cameraEnabled: boolean;
}

// Tool Definition Types
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any) => Promise<string>;
}
