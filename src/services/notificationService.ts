
import { Memo } from '@/types/memo';

export interface NotificationItem {
  id: string;
  memoId: string;
  type: 'forgotten_memo';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationItem[] = [];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  addListener(callback: (notifications: NotificationItem[]) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (notifications: NotificationItem[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  checkForgottenMemos(memos: Memo[]) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    memos.forEach(memo => {
      const lastViewed = memo.lastViewedAt || memo.updatedAt;
      
      // 7일 이상 조회되지 않은 메모 중 중요한 메모나 AI 정리된 메모
      if (lastViewed < sevenDaysAgo && 
          (memo.importance === 'high' || memo.isOrganized) &&
          !this.notifications.some(n => n.memoId === memo.id && n.type === 'forgotten_memo')) {
        
        const notification: NotificationItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          memoId: memo.id,
          type: 'forgotten_memo',
          title: '잊은 메모가 있나요?',
          message: `"${memo.title || '제목 없음'}" 메모를 오랫동안 보지 않으셨네요.`,
          createdAt: now,
          isRead: false
        };
        
        this.notifications.push(notification);
      }
    });
    
    this.notifyListeners();
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifyListeners();
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getAllNotifications(): NotificationItem[] {
    return [...this.notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
