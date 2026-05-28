export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  folder?: string; // Virtual folder path
}

export interface PluginSettings {
  wordCount: boolean;
  dailyNotes: boolean;
  outline: boolean;
  visualDiagram: boolean;
  emojiPicker: boolean;
}

export interface ThemeSettings {
  name: string;
  isDark: boolean;
  background: string;
  text: string;
  sidebarBg: string;
  sidebarText: string;
  accent: string;
  accentHover: string;
  border: string;
  cardBg: string;
  editorBg: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  isCurrent: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  type: 'concept' | 'action' | 'resource';
}

export interface DiagramEdge {
  source: string;
  target: string;
  label?: string;
}
