
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
  reminderDate?: Date;
  category?: string;
}

export type ViewMode = 'list' | 'gallery';
export type SortBy = 'updatedAt' | 'createdAt' | 'importance' | 'title';
export type FilterBy = 'all' | 'category' | 'importance';

export interface SearchResult {
  memo: Memo;
  relevanceScore: number;
  matchedKeywords: string[];
}
