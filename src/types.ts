export interface Chapter {
  num: number;
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  pages: number;
  chapters: Chapter[];
}

export interface CustomDocument {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  bookCitations?: string[];
  codeExamples?: { language: string; code: string; title: string }[];
  diagrams?: { title: string; type: string; flow: string[] }[];
}

export interface ToolOption {
  id: string;
  name: string;
  provider: string;
  badge: string;
  iconName: string;
  imageSupport: string; // How it handles images/schemas from books
  codeSupport: string;  // How it handles code examples
  difficulty: 'Facile (Sans Code)' | 'Intermédiaire' | 'Avancé (Développeur)';
  cost: string;
  description: string;
  pros: string[];
  cons: string[];
  stepsToBuild: string[];
  recommendedFor: string;
}
