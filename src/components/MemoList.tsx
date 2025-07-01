
import React from 'react';
import { Edit3, Trash2, Clock, Sparkles } from 'lucide-react';
import { Memo } from '@/types/memo';

interface MemoListProps {
  memos: Memo[];
  selectedMemo: Memo | null;
  onSelectMemo: (memo: Memo) => void;
  onEditMemo: (memo: Memo) => void;
  onDeleteMemo: (id: string) => void;
}

export const MemoList: React.FC<MemoListProps> = ({
  memos,
  selectedMemo,
  onSelectMemo,
  onEditMemo,
  onDeleteMemo,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPreview = (content: string) => {
    const plainContent = content.replace(/[#*`\-]/g, '').trim();
    return plainContent.slice(0, 100) + (plainContent.length > 100 ? '...' : '');
  };

  const getTitle = (memo: Memo) => {
    if (memo.title) return memo.title;
    const firstLine = memo.content.split('\n')[0];
    return firstLine.slice(0, 30) + (firstLine.length > 30 ? '...' : '') || '제목 없음';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">내 메모</h2>
        <span className="text-sm text-gray-500">{memos.length}개</span>
      </div>

      {memos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500 mb-4">아직 메모가 없습니다</p>
          <p className="text-sm text-gray-400">새 메모를 작성해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedMemo?.id === memo.id
                  ? 'border-blue-300 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectMemo(memo)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-800 flex-1">
                  {getTitle(memo)}
                </h3>
                {memo.isOrganized && (
                  <Sparkles className="w-4 h-4 text-purple-500 ml-2 flex-shrink-0" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {getPreview(memo.content)}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(memo.updatedAt)}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMemo(memo);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMemo(memo.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
