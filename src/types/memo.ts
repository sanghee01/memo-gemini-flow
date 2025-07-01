
export interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isOrganized: boolean;
  tags?: string[];
}
