
export interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isOrganized: boolean;
  tags?: string[];
  importance?: 'low' | 'medium' | 'high';
  color?: string;
  isLocked?: boolean;
  password?: string;
  viewCount?: number;
  lastViewedAt?: Date;
  images?: string[];
}

export type ViewMode = 'list' | 'gallery';

export interface SearchResult {
  memo: Memo;
  relevanceScore: number;
  matchedKeywords: string[];
}
