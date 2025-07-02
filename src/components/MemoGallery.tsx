import React from "react";
import {
  Edit3,
  Trash2,
  Clock,
  Sparkles,
  Lock,
  Star,
  AlertCircle,
  Circle,
} from "lucide-react";
import { Memo } from "@/types/memo";
import { Button } from "@/components/ui/button";

interface MemoGalleryProps {
  memos: Memo[];
  selectedMemo: Memo | null;
  onSelectMemo: (memo: Memo) => void;
  onEditMemo: (memo: Memo) => void;
  onDeleteMemo: (id: string) => void;
}

export const MemoGallery: React.FC<MemoGalleryProps> = ({
  memos,
  selectedMemo,
  onSelectMemo,
  onEditMemo,
  onDeleteMemo,
}) => {
  const formatDate = (date: Date | string | undefined) => {
    try {
      if (!date) {
        return "날짜 없음";
      }

      const dateObj = date instanceof Date ? date : new Date(date);

      // 유효하지 않은 날짜인지 확인
      if (isNaN(dateObj.getTime())) {
        return "유효하지 않은 날짜";
      }

      return new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch (error) {
      console.error("날짜 형식 변환 오류:", error, "input:", date);
      return "날짜 오류";
    }
  };

  const getPreview = (content: string) => {
    const plainContent = content.replace(/[#*`-]/g, "").trim();
    return plainContent.slice(0, 80) + (plainContent.length > 80 ? "..." : "");
  };

  const getTitle = (memo: Memo) => {
    if (memo.title) return memo.title;
    const firstLine = memo.content.split("\n")[0];
    return (
      firstLine.slice(0, 20) + (firstLine.length > 20 ? "..." : "") ||
      "제목 없음"
    );
  };

  const getColorClass = (color?: string) => {
    const colorMap = {
      red: "bg-red-50 border-red-200",
      orange: "bg-orange-50 border-orange-200",
      yellow: "bg-yellow-50 border-yellow-200",
      green: "bg-green-50 border-green-200",
      blue: "bg-blue-50 border-blue-200",
      purple: "bg-purple-50 border-purple-200",
    };
    return color
      ? colorMap[color as keyof typeof colorMap] || "bg-white border-gray-200"
      : "bg-white border-gray-200";
  };

  const getImportanceIcon = (importance?: string) => {
    switch (importance) {
      case "high":
        return <Star className="w-4 h-4 text-red-500" />;
      case "medium":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getFirstImage = (content: string) => {
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = content.match(imageRegex);
    return match ? match[1] : null;
  };

  if (memos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-gray-500 mb-4">아직 메모가 없습니다</p>
        <p className="text-sm text-gray-400">새 메모를 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {memos.map((memo) => {
        const firstImage = getFirstImage(memo.content);

        return (
          <div
            key={memo.id}
            className={`rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedMemo?.id === memo.id
                ? "border-blue-300 shadow-md"
                : "border-gray-200 hover:border-gray-300"
            } ${getColorClass(memo.color)}`}
            onClick={() => onSelectMemo(memo)}
          >
            {/* 이미지 섹션 */}
            {firstImage && (
              <div className="h-32 overflow-hidden rounded-t-lg">
                <img
                  src={firstImage}
                  alt="메모 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 콘텐츠 섹션 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-800 flex-1 line-clamp-1">
                  {getTitle(memo)}
                </h3>
                <div className="flex items-center space-x-1 ml-2">
                  {getImportanceIcon(memo.importance)}
                  {memo.isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                  {memo.isOrganized && (
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {getPreview(memo.content)}
              </p>

              {/* 태그 */}
              {memo.tags && memo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {memo.tags?.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                    >
                      #{tag}
                    </span>
                  )) || []}
                  {memo.tags && memo.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      +{memo.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(memo.updatedAt)}
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMemo(memo);
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMemo(memo.id);
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
