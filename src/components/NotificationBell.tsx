
import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationService, NotificationItem } from '@/services/notificationService';

interface NotificationBellProps {
  onNotificationClick: (memoId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    const handleNotificationsUpdate = (updatedNotifications: NotificationItem[]) => {
      setNotifications(updatedNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    };

    notificationService.addListener(handleNotificationsUpdate);
    setNotifications(notificationService.getAllNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    return () => {
      notificationService.removeListener(handleNotificationsUpdate);
    };
  }, []);

  const handleNotificationClick = (notification: NotificationItem) => {
    notificationService.markAsRead(notification.id);
    onNotificationClick(notification.memoId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">알림</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-500">{unreadCount}개의 새 알림</span>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              새로운 알림이 없습니다.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-800">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt.toLocaleString('ko-KR')}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
