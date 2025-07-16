export interface Article {
  id: string;
  title: string;
  content: string;
  categories: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  categories: string[];
  excerpt: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleHistory {
  id: string;
  articleId: string;
  title: string;
  content: string;
  version: number;
  changeType: 'created' | 'updated' | 'deleted';
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  backendPort: number;
  maxRecentFiles: number;
  editorSettings: {
    wordWrap: boolean;
    fontSize: number;
    tabSize: number;
    showLineNumbers: boolean;
  };
}

export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  openFile: () => Promise<{ content: string; filePath: string } | null>;
  saveFile: (content: string) => Promise<string | null>;
  createArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Article>;
  getArticle: (id: string) => Promise<Article | null>;
  updateArticle: (id: string, article: Partial<Article>) => Promise<Article>;
  deleteArticle: (id: string) => Promise<boolean>;
  searchArticles: (query: string) => Promise<SearchResult[]>;
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
  onMenuAction: (callback: (action: string) => void) => void;
  removeAllListeners: (channel: string) => void;
  startBackendServer: () => Promise<{ success: boolean; message: string }>;
  stopBackendServer: () => Promise<{ success: boolean; message: string }>;
  getBackendStatus: () => Promise<{ running: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}