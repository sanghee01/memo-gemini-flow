import React, { useState, useEffect } from "react";
import { Memo, SearchResult } from "@/types/memo";
import { Header } from "@/components/Header";
import { MemoEditor } from "@/components/MemoEditor";
import { MemoList } from "@/components/MemoList";
import { MemoViewer } from "@/components/MemoViewer";
import { MemoSortFilter } from "@/components/MemoSortFilter";
import { MemoGallery } from "@/components/MemoGallery";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { SmartSearch } from "@/components/SmartSearch";
import { organizeContentWithGemini } from "@/services/geminiService";
import { NotificationService } from "@/services/notificationService";
import { toast } from "@/components/ui/use-toast";
import { useGemini } from "@/contexts/GeminiContext";

type ViewMode = "list" | "gallery";
type SortBy = "newest" | "oldest" | "alphabetical" | "color" | "importance";

const Index = () => {
  const { apiKey } = useGemini();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load memos from localStorage on component mount
  useEffect(() => {
    const savedMemos = localStorage.getItem("memos");
    if (savedMemos) {
      try {
        const parsedMemos = JSON.parse(savedMemos);
        if (Array.isArray(parsedMemos)) {
          setMemos(parsedMemos);
        }
      } catch (error) {
        console.error("메모 로드 실패:", error);
      }
    }
  }, []);

  // Save memos to localStorage whenever memos change
  useEffect(() => {
    if (memos.length > 0) {
      localStorage.setItem("memos", JSON.stringify(memos));
    }
  }, [memos]);

  // 알림 서비스 초기화 및 잊힌 메모 체크
  useEffect(() => {
    const notificationService = NotificationService.getInstance();

    // 브라우저 알림 권한 요청
    notificationService.requestNotificationPermission();

    // 잊힌 메모 체크 (7일 이상 보지 않은 중요한 메모)
    if (memos.length > 0) {
      notificationService.checkForgottenMemos(memos);
    }
  }, [memos]);

  const handleSaveMemo = (memo: Memo) => {
    setMemos((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === memo.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = memo;
        return updated;
      } else {
        return [memo, ...prev];
      }
    });
    setIsEditing(false);
    setEditingMemo(null);
  };

  const handleDeleteMemo = (id: string) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== id));
    if (selectedMemo?.id === id) {
      setSelectedMemo(null);
    }
  };

  const handleSelectMemo = (memo: Memo) => {
    setSelectedMemo(memo);
  };

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo);
    setIsEditing(true);
  };

  const handleNewMemo = () => {
    setEditingMemo(null);
    setIsEditing(true);
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
    setEditingMemo(null);
    // 편집 취소 시 기존 선택된 메모가 있다면 다시 표시
    // selectedMemo는 그대로 유지됨
  };

  const handleCloseViewer = () => {
    setSelectedMemo(null);
  };

  // AI 정리 함수 (기존 메모용)
  const handleAiOrganize = async (memoId: string) => {
    if (!apiKey) {
      alert("API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const memo = memos.find((m) => m.id === memoId);
      if (!memo) return;

      const organizedContent = await organizeContentWithGemini(
        memo.content,
        apiKey
      );

      if (organizedContent) {
        const updatedMemo = {
          ...memo,
          content: organizedContent,
          updatedAt: new Date(),
        };

        setMemos((prev) =>
          prev.map((m) => (m.id === memoId ? updatedMemo : m))
        );

        // 현재 보고 있는 메모라면 업데이트
        if (selectedMemo?.id === memoId) {
          setSelectedMemo(updatedMemo);
        }
      }
    } catch (error) {
      console.error("AI 정리 실패:", error);
      alert("AI 정리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 결과 처리 함수
  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setIsSearching(!!results.length);
    if (results.length > 0) {
      setSearchQuery("searching"); // 검색 중임을 표시
    }
  };

  // 검색 초기화 함수
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // 메모들로부터 카테고리 목록 추출
  const availableCategories = React.useMemo(() => {
    const categories = memos
      .map((memo) => memo.category)
      .filter((category): category is string => Boolean(category));
    return [...new Set(categories)];
  }, [memos]);

  const filteredAndSortedMemos = React.useMemo(() => {
    let filtered =
      isSearching && searchQuery && searchResults
        ? searchResults.map((result) => result.memo)
        : memos || [];

    // 필터링
    if (filterBy !== "all") {
      switch (filterBy) {
        case "high": {
          filtered = filtered.filter((memo) => memo.importance === "high");
          break;
        }
        case "medium": {
          filtered = filtered.filter((memo) => memo.importance === "medium");
          break;
        }
        case "low": {
          filtered = filtered.filter((memo) => memo.importance === "low");
          break;
        }
        case "locked": {
          filtered = filtered.filter((memo) => memo.isLocked);
          break;
        }
        default: {
          // 카테고리별 필터링
          filtered = filtered.filter((memo) => memo.category === filterBy);
          break;
        }
      }
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest": {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
          const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
          return timeB - timeA;
        }
        case "oldest": {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
          const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
          return timeA - timeB;
        }
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "color":
          return (a.color || "").localeCompare(b.color || "");
        case "importance": {
          const importanceOrder = { high: 3, medium: 2, low: 1 };
          const aOrder = importanceOrder[a.importance || "low"];
          const bOrder = importanceOrder[b.importance || "low"];
          return bOrder - aOrder;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [memos, sortBy, filterBy, searchResults, isSearching, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header onNewMemo={handleNewMemo} isLoading={isLoading} />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <SmartSearch
            memos={memos}
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메모 목록/갤러리 */}
          <div className="lg:w-96 xl:w-[28rem] flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <MemoSortFilter
                sortBy={sortBy}
                filterBy={filterBy}
                onSortChange={setSortBy}
                onFilterChange={setFilterBy}
                categories={availableCategories}
              />
              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {viewMode === "list" ? (
              <MemoList
                memos={filteredAndSortedMemos}
                selectedMemo={selectedMemo}
                onSelectMemo={handleSelectMemo}
                onEditMemo={handleEditMemo}
                onDeleteMemo={handleDeleteMemo}
              />
            ) : (
              <MemoGallery
                memos={filteredAndSortedMemos}
                selectedMemo={selectedMemo}
                onSelectMemo={handleSelectMemo}
                onEditMemo={handleEditMemo}
                onDeleteMemo={handleDeleteMemo}
              />
            )}
          </div>

          {/* 메모 에디터/뷰어 */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <MemoEditor
                memo={
                  editingMemo || {
                    id: crypto.randomUUID(),
                    title: "",
                    content: "",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isOrganized: false,
                    importance: "medium",
                    tags: [],
                  }
                }
                availableCategories={availableCategories}
                onSave={handleSaveMemo}
                onCancel={handleCloseEditor}
              />
            ) : selectedMemo ? (
              <MemoViewer
                memo={selectedMemo}
                onEdit={() => handleEditMemo(selectedMemo)}
                onOrganize={() => handleAiOrganize(selectedMemo.id)}
                isOrganizing={isLoading}
                onMemoUpdate={(updatedMemo) => {
                  setMemos((prev) =>
                    prev.map((m) => (m.id === updatedMemo.id ? updatedMemo : m))
                  );
                  setSelectedMemo(updatedMemo);
                }}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12">
                <div className="text-center">
                  <div className="text-6xl mb-6">📝</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    메모를 선택하거나 새로 작성해보세요
                  </h2>
                  <p className="text-gray-600 mb-8">
                    왼쪽에서 메모를 선택하여 내용을 확인하거나,
                    <br />
                    상단의 "새 메모" 버튼을 클릭하여 새로운 메모를 작성할 수
                    있습니다.
                  </p>
                  <button
                    onClick={handleNewMemo}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    새 메모 작성하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
