
import React from 'react';
import { Edit3, Sparkles, Download } from 'lucide-react';
import { Memo } from '@/types/memo';

interface MemoViewerProps {
  memo: Memo;
  onEdit: () => void;
  onOrganize: () => void;
}

export const MemoViewer: React.FC<MemoViewerProps> = ({
  memo,
  onEdit,
  onOrganize,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleDownloadMarkdown = () => {
    const title = memo.title || '제목 없음';
    const markdownContent = `# ${title}\n\n${memo.content}\n\n---\n생성일: ${formatDate(memo.createdAt)}\n수정일: ${formatDate(memo.updatedAt)}`;
    
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = (content: string) => {
    if (!content.trim()) {
      return <p className="text-gray-500 italic">내용이 없습니다.</p>;
    }

    // Simple markdown-like rendering for organized content
    if (memo.isOrganized) {
      return (
        <div 
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{
            __html: content
              .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-800 mb-4 mt-6 first:mt-0">$1</h1>')
              .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-700 mb-3 mt-5">$1</h2>')
              .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-gray-600 mb-2 mt-4">$1</h3>')
              .replace(/^\- (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
              .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/---/g, '<hr class="my-6 border-gray-200">')
              .replace(/\n\n/g, '</p><p class="mb-4">')
              .replace(/^(?!<[h|l|p])/gm, '<p class="mb-4">')
              .replace(/(<li.*<\/li>)/s, '<ul class="list-disc mb-4">$1</ul>')
          }}
        />
      );
    }

    // Regular content rendering
    return (
      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
        {content}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-xl font-bold text-gray-800">
              {memo.title || '제목 없는 메모'}
            </h1>
            {memo.isOrganized && (
              <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>AI 정리됨</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            생성: {formatDate(memo.createdAt)} • 수정: {formatDate(memo.updatedAt)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            <span>MD 다운로드</span>
          </button>
          
          {!memo.isOrganized && (
            <button
              onClick={onOrganize}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI 정리하기</span>
            </button>
          )}
          
          <button
            onClick={onEdit}
            className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-all duration-200"
          >
            <Edit3 className="w-4 h-4" />
            <span>편집</span>
          </button>
        </div>
      </div>

      <div className="prose prose-gray max-w-none">
        {renderContent(memo.content)}
      </div>

      {!memo.isOrganized && memo.content.trim() && (
        <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-purple-800 mb-1">
                AI 정리 기능을 사용해보세요!
              </h3>
              <p className="text-sm text-purple-700">
                이 메모의 내용을 관심사별로 분류하고 가독성 있게 정리해드립니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
