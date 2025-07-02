
import React from 'react';
import { Edit3, Sparkles, Download, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Memo } from '@/types/memo';
import ReactMarkdown from 'react-markdown';
import { toast } from '@/components/ui/use-toast';

interface MemoViewerProps {
  memo: Memo;
  onEdit: () => void;
  onOrganize: () => void;
  isOrganizing?: boolean;
  onUnlock?: () => void;
}

export const MemoViewer: React.FC<MemoViewerProps> = ({ 
  memo, 
  onEdit, 
  onOrganize, 
  isOrganizing = false,
  onUnlock 
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

  // 잠긴 메모인 경우 제목만 표시
  if (memo.isLocked && onUnlock) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {memo.title || '제목 없음'}
            </h2>
            <p className="text-gray-600 mb-6">
              이 메모는 잠겨있습니다. 내용을 보려면 잠금을 해제하세요.
            </p>
            <Button onClick={onUnlock} className="mr-2">
              잠금 해제
            </Button>
            <Button variant="outline" onClick={onEdit}>
              편집
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            {memo.category && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">📁 {memo.category}</span>
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
                  <ul className="list-disc list-inside space-y-2 my-4 ml-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 my-4 ml-4">{children}</ol>
                ),
                li: ({ children, ordered }) => {
                  // 중첩 리스트 처리
                  const content = React.Children.toArray(children);
                  const hasNestedList = content.some(child => 
                    React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')
                  );
                  
                  return (
                    <li className={`text-gray-700 leading-relaxed ${hasNestedList ? 'mb-2' : ''}`}>
                      <div className="inline-block">
                        {content.map((child, index) => {
                          if (React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')) {
                            return (
                              <div key={index} className="ml-6 mt-2">
                                {child}
                              </div>
                            );
                          }
                          return child;
                        })}
                      </div>
                    </li>
                  );
                },
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
                  <blockquote className="border-l-4 border-blue-400 pl-4 my-4 text-gray-600 italic bg-blue-50 py-2 rounded-r">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4 border">
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
