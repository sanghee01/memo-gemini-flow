
import { Memo } from '@/types/memo';

export interface NotificationItem {
  id: string;
  memoId: string;
  type: 'forgotten_memo' | 'reminder';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  scheduledFor?: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationItem[] = [];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];
  private reminderInterval?: NodeJS.Timeout;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.startReminderCheck();
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

  private startReminderCheck() {
    // 1분마다 알림 체크
    this.reminderInterval = setInterval(() => {
      this.checkReminders();
    }, 60000);
  }

  private checkReminders() {
    const now = new Date();
    
    // 로컬 스토리지에서 메모 불러오기
    const savedMemos = localStorage.getItem('sangmemo-memos');
    if (!savedMemos) return;
    
    try {
      const memos: Memo[] = JSON.parse(savedMemos).map((memo: any) => ({
        ...memo,
        createdAt: new Date(memo.createdAt),
        updatedAt: new Date(memo.updatedAt),
        lastViewedAt: memo.lastViewedAt ? new Date(memo.lastViewedAt) : undefined,
        reminderDate: memo.reminderDate ? new Date(memo.reminderDate) : undefined
      }));

      memos.forEach(memo => {
        if (memo.reminderDate && memo.reminderDate <= now) {
          // 이미 알림이 생성되었는지 확인
          const existingNotification = this.notifications.find(
            n => n.memoId === memo.id && n.type === 'reminder'
          );

          if (!existingNotification) {
            const notification: NotificationItem = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              memoId: memo.id,
              type: 'reminder',
              title: '메모 알림',
              message: `"${memo.title || '제목 없음'}" 메모를 확인해보세요.`,
              createdAt: now,
              isRead: false,
              scheduledFor: memo.reminderDate
            };
            
            this.notifications.push(notification);
            
            // 브라우저 알림 표시
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('SangMemo 알림', {
                body: notification.message,
                icon: '/favicon.ico'
              });
            }
          }
        }
      });
      
      this.notifyListeners();
    } catch (error) {
      console.error('알림 체크 오류:', error);
    }
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

  // 브라우저 알림 권한 요청
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  destroy() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
  }
}
