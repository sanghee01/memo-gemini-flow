
import React from 'react';
import { Edit3, Sparkles, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Memo } from '@/types/memo';
import ReactMarkdown from 'react-markdown';

interface MemoViewerProps {
  memo: Memo;
  onEdit: () => void;
  onOrganize: () => void;
  isOrganizing?: boolean;
}

export const MemoViewer: React.FC<MemoViewerProps> = ({ 
  memo, 
  onEdit, 
  onOrganize, 
  isOrganizing = false 
}) => {
  const handleDownload = () => {
    const markdownContent = `# ${memo.title || '제목 없음'}\n\n${memo.content}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${memo.title || '메모'}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {memo.title || '제목 없음'}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>생성: {memo.createdAt.toLocaleString('ko-KR')}</span>
            <span>•</span>
            <span>수정: {memo.updatedAt.toLocaleString('ko-KR')}</span>
            {memo.isOrganized && (
              <>
                <span>•</span>
                <span className="text-green-600 font-medium">✨ AI 정리됨</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            다운로드
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOrganize}
            disabled={isOrganizing}
          >
            {isOrganizing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isOrganizing ? '정리 중...' : 'AI 정리'}
          </Button>
          <Button onClick={onEdit} size="sm">
            <Edit3 className="w-4 h-4 mr-2" />
            편집
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {memo.content ? (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                img: ({ src, alt }) => (
                  <img 
                    src={src} 
                    alt={alt} 
                    className="max-w-full h-auto rounded-lg shadow-md my-4"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 my-4">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 leading-relaxed">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-gray-800 mt-5 mb-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-400 pl-4 my-4 text-gray-600 italic">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                    {children}
                  </pre>
                )
              }}
            >
              {memo.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p>메모 내용이 없습니다.</p>
            <p className="text-sm mt-2">편집 버튼을 클릭하여 내용을 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
