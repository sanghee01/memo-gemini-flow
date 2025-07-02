import React, { useState, useEffect } from "react";
import { Memo } from "@/types/memo";
import { Header } from "@/components/Header";
import { MemoEditor } from "@/components/MemoEditor";
import { MemoList } from "@/components/MemoList";
import { MemoViewer } from "@/components/MemoViewer";
import { MemoSortFilter } from "@/components/MemoSortFilter";
import { MemoGallery } from "@/components/MemoGallery";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { SmartSearch } from "@/components/SmartSearch";
import { organizeContentWithGemini } from "@/services/geminiService";
import {
  enhancedSemanticSearch,
  SearchResult,
} from "@/services/enhancedSearchService";
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

  // 알림 확인 및 처리
  useEffect(() => {
    const checkNotifications = () => {
      const notifications = NotificationService.checkReminders(memos);
      notifications.forEach((notification) => {
        toast({
          title: "리마인더 알림",
          description: notification.message,
        });
      });
    };

    // 페이지 로드 시 한 번 확인
    checkNotifications();

    // 1분마다 알림 확인
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
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
  };

  const handleCloseViewer = () => {
    setSelectedMemo(null);
  };

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
          updatedAt: new Date().toISOString(),
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await enhancedSemanticSearch(memos, query);
      setSearchResults(results);
    } catch (error) {
      console.error("검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredAndSortedMemos = React.useMemo(() => {
    let filtered =
      isSearching && searchQuery
        ? searchResults.map((result) => result.memo)
        : memos;

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
        case "newest":
          return (
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.updatedAt || a.createdAt).getTime() -
            new Date(b.updatedAt || b.createdAt).getTime()
          );
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
            onSearch={handleSearch}
            isSearching={isSearching}
            placeholder="메모 검색 (AI 기반 스마트 검색)"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메모 목록/갤러리 */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <MemoSortFilter
                sortBy={sortBy}
                filterBy={filterBy}
                onSortChange={setSortBy}
                onFilterChange={setFilterBy}
                memos={memos}
              />
              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {viewMode === "list" ? (
              <MemoList
                memos={filteredAndSortedMemos}
                onSelectMemo={handleSelectMemo}
                onEditMemo={handleEditMemo}
                onDeleteMemo={handleDeleteMemo}
                selectedMemoId={selectedMemo?.id}
                searchResults={isSearching ? searchResults : undefined}
              />
            ) : (
              <MemoGallery
                memos={filteredAndSortedMemos}
                onSelectMemo={handleSelectMemo}
                onEditMemo={handleEditMemo}
                onDeleteMemo={handleDeleteMemo}
                selectedMemoId={selectedMemo?.id}
              />
            )}
          </div>

          {/* 메모 뷰어 */}
          {selectedMemo && (
            <div className="lg:w-1/2">
              <MemoViewer
                memo={selectedMemo}
                onClose={handleCloseViewer}
                onEdit={() => handleEditMemo(selectedMemo)}
                onDelete={() => handleDeleteMemo(selectedMemo.id)}
                onAiOrganize={() => handleAiOrganize(selectedMemo.id)}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* 메모 에디터 모달 */}
      {isEditing && (
        <MemoEditor
          memo={editingMemo}
          onSave={handleSaveMemo}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
};

export default Index;
