import React, { useState } from "react";
import { Edit3, Sparkles, Download, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Memo } from "@/types/memo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { toast } from "@/components/ui/use-toast";
import { MarkdownImage } from "./MarkdownImage";
import { MemoLockDialog } from "./MemoLockDialog";

interface MemoViewerProps {
  memo: Memo;
  onEdit: () => void;
  onOrganize: () => void;
  isOrganizing?: boolean;
  onMemoUpdate?: (updatedMemo: Memo) => void;
}

export const MemoViewer: React.FC<MemoViewerProps> = ({
  memo,
  onEdit,
  onOrganize,
  isOrganizing = false,
  onMemoUpdate,
}) => {
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!memo.isLocked);
  const handleDownload = () => {
    const markdownContent = `# ${memo.title || "제목 없음"}\n\n${memo.content}`;
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${memo.title || "메모"}_${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 커스텀 마크다운 렌더링 함수
  const renderContentWithImages = (content: string) => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;

    const matches = Array.from(content.matchAll(imageRegex));

    // 마크다운 컴포넌트 스타일 정의
    const markdownComponents = {
      ul: ({ children }: { children: React.ReactNode }) => (
        <ul className="list-disc pl-6 space-y-1 my-4">{children}</ul>
      ),
      ol: ({ children }: { children: React.ReactNode }) => (
        <ol className="list-decimal pl-6 space-y-1 my-4">{children}</ol>
      ),
      li: ({ children }: { children: React.ReactNode }) => (
        <li className="text-gray-700 leading-relaxed">{children}</li>
      ),
      h1: ({ children }: { children: React.ReactNode }) => (
        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">
          {children}
        </h1>
      ),
      h2: ({ children }: { children: React.ReactNode }) => (
        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
          {children}
        </h2>
      ),
      h3: ({ children }: { children: React.ReactNode }) => (
        <h3 className="text-xl font-medium text-gray-800 mt-5 mb-2">
          {children}
        </h3>
      ),
      h4: ({ children }: { children: React.ReactNode }) => (
        <h4 className="text-lg font-medium text-gray-800 mt-4 mb-2">
          {children}
        </h4>
      ),
      h5: ({ children }: { children: React.ReactNode }) => (
        <h5 className="text-base font-medium text-gray-800 mt-3 mb-2">
          {children}
        </h5>
      ),
      h6: ({ children }: { children: React.ReactNode }) => (
        <h6 className="text-sm font-medium text-gray-800 mt-3 mb-2">
          {children}
        </h6>
      ),
      p: ({ children }: { children: React.ReactNode }) => (
        <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
      ),
      blockquote: ({ children }: { children: React.ReactNode }) => (
        <blockquote className="border-l-4 border-blue-400 pl-4 my-4 text-gray-600 italic bg-blue-50 py-2 rounded-r">
          {children}
        </blockquote>
      ),
      code: ({ children }: { children: React.ReactNode }) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
          {children}
        </code>
      ),
      pre: ({ children }: { children: React.ReactNode }) => (
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4 border">
          {children}
        </pre>
      ),
      strong: ({ children }: { children: React.ReactNode }) => (
        <strong className="font-bold text-gray-900">{children}</strong>
      ),
      em: ({ children }: { children: React.ReactNode }) => (
        <em className="italic text-gray-800">{children}</em>
      ),
    };

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];

      // 이미지 앞의 텍스트 추가
      if (match.index && match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(
            <ReactMarkdown
              key={`text-${lastIndex}`}
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {textBefore}
            </ReactMarkdown>
          );
        }
      }

      // 이미지 컴포넌트 추가
      const [, alt, src] = match;
      console.log("Direct image rendering:", {
        alt,
        srcLength: src.length,
        srcPreview: src.substring(0, 50),
        isBase64: src.startsWith("data:image"),
      });

      parts.push(
        <MarkdownImage key={`img-${match.index}`} src={src} alt={alt} />
      );

      lastIndex = (match.index || 0) + match[0].length;
    }

    // 남은 텍스트 추가
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push(
          <ReactMarkdown
            key={`text-${lastIndex}`}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {remainingText}
          </ReactMarkdown>
        );
      }
    }

    // 이미지가 없으면 기본 ReactMarkdown 사용
    if (parts.length === 0) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      );
    }

    return <div>{parts}</div>;
  };

  const handleUnlock = (inputPassword: string) => {
    if (inputPassword === memo.password) {
      setIsUnlocked(true);
      if (onMemoUpdate) {
        onMemoUpdate({
          ...memo,
          isLocked: false,
          password: undefined,
        });
      }
      toast({
        title: "잠금 해제 성공",
        description: "메모 잠금이 해제되었습니다.",
      });
      return true;
    }
    toast({
      title: "잠금 해제 실패",
      description: "비밀번호가 올바르지 않습니다.",
      variant: "destructive",
    });
    return false;
  };

  // 잠긴 메모인 경우 제목만 표시
  if (memo.isLocked && !isUnlocked) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {memo.title || "제목 없음"}
            </h2>
            <p className="text-gray-600 mb-6">
              이 메모는 잠겨있습니다. 내용을 보려면 잠금을 해제하세요.
            </p>
            <Button onClick={() => setShowUnlockDialog(true)} className="mr-2">
              잠금 해제
            </Button>
            <Button variant="outline" onClick={onEdit}>
              편집
            </Button>
          </div>
        </div>

        <MemoLockDialog
          open={showUnlockDialog}
          onOpenChange={setShowUnlockDialog}
          isLocked={true}
          onLock={() => {}} // 사용하지 않음
          onUnlock={handleUnlock}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {memo.title || "제목 없음"}
          </h1>

          {/* 태그 표시 */}
          {memo.tags && memo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {memo.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  #{tag}
                </span>
              )) || []}
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>생성: {memo.createdAt.toLocaleString("ko-KR")}</span>
            <span>•</span>
            <span>수정: {memo.updatedAt.toLocaleString("ko-KR")}</span>
            {memo.isOrganized && (
              <>
                <span>•</span>
                <span className="text-green-600 font-medium">✨ AI 정리됨</span>
              </>
            )}
            {memo.category && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">
                  📁 {memo.category}
                </span>
              </>
            )}
            {memo.reminderDate && (
              <>
                <span>•</span>
                <span className="text-orange-600 font-medium">
                  🔔 {memo.reminderDate.toLocaleString("ko-KR")}
                </span>
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
            {isOrganizing ? "정리 중..." : "AI 정리"}
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
          <>
            {(() => {
              console.log("=== MemoViewer Debug ===");
              console.log("memo.content length:", memo.content.length);
              console.log(
                "memo.content preview:",
                memo.content.substring(0, 300)
              );
              console.log("Contains ![:", memo.content.includes("!["));
              console.log(
                "Contains data:image:",
                memo.content.includes("data:image")
              );

              // 이미지 마크다운 패턴 찾기
              const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
              const matches = memo.content.matchAll(imageRegex);
              let matchCount = 0;
              for (const match of matches) {
                matchCount++;
                console.log(`Image ${matchCount}:`, {
                  fullMatch: match[0].substring(0, 100) + "...",
                  alt: match[1],
                  srcLength: match[2].length,
                  srcPreview: match[2].substring(0, 50) + "...",
                });
              }

              return null;
            })()}
            <div className="prose prose-slate max-w-none">
              {renderContentWithImages(memo.content)}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p>메모 내용이 없습니다.</p>
            <p className="text-sm mt-2">
              편집 버튼을 클릭하여 내용을 추가해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
