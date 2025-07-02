import React, { useState, useEffect } from "react";
import { MemoList } from "@/components/MemoList";
import { MemoEditor } from "@/components/MemoEditor";
import { MemoViewer } from "@/components/MemoViewer";
import { MemoGallery } from "@/components/MemoGallery";
import { Header } from "@/components/Header";
import { SmartSearch } from "@/components/SmartSearch";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { MemoSortFilter } from "@/components/MemoSortFilter";
import { NotificationBell } from "@/components/NotificationBell";
import { Memo, ViewMode, SearchResult, SortBy, FilterBy } from "@/types/memo";
import { organizeContentWithGemini } from "@/services/geminiService";
import { NotificationService } from "@/services/notificationService";
import { toast } from "@/components/ui/use-toast";

const DEVELOPER_API_KEY = "***REMOVED***";

const Index = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [lockedMemoToView, setLockedMemoToView] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();

  // 로컬 스토리지에서 메모 불러오기
  useEffect(() => {
    const savedMemos = localStorage.getItem("sangmemo-memos");
    if (savedMemos) {
      try {
        const parsedMemos = JSON.parse(savedMemos).map((memo: any) => ({
          ...memo,
          createdAt: new Date(memo.createdAt),
          updatedAt: new Date(memo.updatedAt),
          lastViewedAt: memo.lastViewedAt
            ? new Date(memo.lastViewedAt)
            : undefined,
          reminderDate: memo.reminderDate
            ? new Date(memo.reminderDate)
            : undefined,
          tags: memo.tags || [],
        }));
        setMemos(parsedMemos);
      } catch (error) {
        console.error("메모 로딩 오류:", error);
      }
    }
  }, []);

  // 메모 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (memos.length > 0) {
      localStorage.setItem("sangmemo-memos", JSON.stringify(memos));
    }
  }, [memos]);

  // 알림 체크 (1분마다)
  useEffect(() => {
    const checkNotifications = () => {
      notificationService.checkForgottenMemos(memos);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // 1분마다

    return () => clearInterval(interval);
  }, [memos]);

  // 메모 정렬 및 필터링
  const getSortedAndFilteredMemos = () => {
    let filteredMemos = isSearching ? searchResults.map((r) => r.memo) : memos;

    // 필터링
    if (filterBy === "category" && selectedCategory) {
      filteredMemos = filteredMemos.filter(
        (memo) => memo.category === selectedCategory
      );
    }

    // 정렬
    return filteredMemos.sort((a, b) => {
      switch (sortBy) {
        case "importance":
          const importanceOrder = { high: 3, medium: 2, low: 1 };
          return (
            importanceOrder[b.importance || "medium"] -
            importanceOrder[a.importance || "medium"]
          );
        case "createdAt":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "updatedAt":
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });
  };

  // 모든 카테고리 목록 생성
  const getAllCategories = () => {
    const categories = new Set<string>();
    memos.forEach((memo) => {
      if (memo.category) {
        categories.add(memo.category);
      }
    });
    return Array.from(categories).sort();
  };

  const handleCreateMemo = () => {
    const newMemo: Memo = {
      id: Date.now().toString(),
      title: "",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isOrganized: false,
      importance: "medium",
      color: "",
      isLocked: false,
      tags: [],
      viewCount: 0,
    };
    setMemos([newMemo, ...memos]);
    setSelectedMemo(newMemo);
    setIsEditing(true);
    setIsViewing(false);
  };

  const handleSaveMemo = (memo: Memo) => {
    const updatedMemos = memos.map((m) => (m.id === memo.id ? memo : m));
    setMemos(updatedMemos);
    setSelectedMemo(memo);
    setIsEditing(false);
    setIsViewing(true);
  };

  const handleDeleteMemo = (id: string) => {
    setMemos(memos.filter((m) => m.id !== id));
    if (selectedMemo?.id === id) {
      setSelectedMemo(null);
      setIsEditing(false);
      setIsViewing(false);
    }
  };

  const handleSelectMemo = (memo: Memo) => {
    if (memo.isLocked && memo.password) {
      setLockedMemoToView(memo.id);
      setSelectedMemo(memo);
      setIsViewing(true);
      setIsEditing(false);
      return;
    }

    // 조회수 및 마지막 조회 시간 업데이트
    const updatedMemo = {
      ...memo,
      viewCount: (memo.viewCount || 0) + 1,
      lastViewedAt: new Date(),
    };

    const updatedMemos = memos.map((m) => (m.id === memo.id ? updatedMemo : m));
    setMemos(updatedMemos);
    setSelectedMemo(updatedMemo);
    setIsEditing(false);
    setIsViewing(true);
    setLockedMemoToView(null);
  };

  const handleUnlockMemo = () => {
    if (!selectedMemo) return;

    const inputPassword = prompt("메모 비밀번호를 입력하세요:");
    if (inputPassword === selectedMemo.password) {
      setLockedMemoToView(null);
      // 조회수 업데이트
      const updatedMemo = {
        ...selectedMemo,
        viewCount: (selectedMemo.viewCount || 0) + 1,
        lastViewedAt: new Date(),
      };
      const updatedMemos = memos.map((m) =>
        m.id === selectedMemo.id ? updatedMemo : m
      );
      setMemos(updatedMemos);
      setSelectedMemo(updatedMemo);
    } else {
      toast({
        title: "접근 거부",
        description: "비밀번호가 올바르지 않습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setIsEditing(true);
    setIsViewing(false);
    setLockedMemoToView(null);
  };

  const handleOrganizeMemo = async (memo: Memo) => {
    if (!memo.content.trim()) {
      toast({
        title: "내용 없음",
        description: "정리할 메모 내용이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsOrganizing(true);

    try {
      const organizedContent = await organizeContentWithGemini(
        memo.content,
        DEVELOPER_API_KEY
      );

      const organizedMemo: Memo = {
        ...memo,
        content: organizedContent,
        isOrganized: true,
        updatedAt: new Date(),
      };

      const updatedMemos = memos.map((m) =>
        m.id === memo.id ? organizedMemo : m
      );
      setMemos(updatedMemos);
      setSelectedMemo(organizedMemo);

      toast({
        title: "정리 완료",
        description: "AI가 메모를 성공적으로 정리했습니다.",
      });
    } catch (error) {
      console.error("메모 정리 오류:", error);
      toast({
        title: "정리 실패",
        description:
          error instanceof Error
            ? error.message
            : "메모 정리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleSortChange = (sort: SortBy) => {
    setSortBy(sort);
  };

  const handleFilterChange = (filter: FilterBy, category?: string) => {
    setFilterBy(filter);
    setSelectedCategory(category);
  };

  const handleNotificationClick = (memoId: string) => {
    const memo = memos.find((m) => m.id === memoId);
    if (memo) {
      handleSelectMemo(memo);
    }
  };

  const displayMemos = getSortedAndFilteredMemos();
  const categories = getAllCategories();

  // 브라우저 알림 권한 요청
  useEffect(() => {
    notificationService.requestNotificationPermission();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header onCreateMemo={handleCreateMemo} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Memo List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">내 메모</h2>
                <div className="flex items-center space-x-2">
                  <NotificationBell
                    onNotificationClick={handleNotificationClick}
                  />
                  <ViewModeToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                </div>
              </div>

              <SmartSearch
                memos={memos}
                onSearchResults={handleSearchResults}
                onClearSearch={handleClearSearch}
              />

              <div className="mb-4">
                <MemoSortFilter
                  sortBy={sortBy}
                  filterBy={filterBy}
                  selectedCategory={selectedCategory}
                  categories={categories}
                  onSortChange={handleSortChange}
                  onFilterChange={handleFilterChange}
                />
              </div>

              {isSearching && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    검색 결과: {searchResults.length}개의 메모를 찾았습니다.
                  </p>
                </div>
              )}
            </div>

            {viewMode === "list" ? (
              <MemoList
                memos={displayMemos}
                selectedMemo={selectedMemo}
                onSelectMemo={handleSelectMemo}
                onEditMemo={handleEditMemo}
                onDeleteMemo={handleDeleteMemo}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <MemoGallery
                  memos={displayMemos}
                  selectedMemo={selectedMemo}
                  onSelectMemo={handleSelectMemo}
                  onEditMemo={handleEditMemo}
                  onDeleteMemo={handleDeleteMemo}
                />
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {isEditing && selectedMemo ? (
              <MemoEditor
                memo={selectedMemo}
                availableCategories={getAllCategories()}
                onSave={handleSaveMemo}
                onCancel={() => setIsEditing(false)}
                onOrganize={handleOrganizeMemo}
                isOrganizing={isOrganizing}
              />
            ) : isViewing && selectedMemo ? (
              <MemoViewer
                memo={selectedMemo}
                onEdit={() => handleEditMemo(selectedMemo)}
                onOrganize={() => handleOrganizeMemo(selectedMemo)}
                isOrganizing={isOrganizing}
                onUnlock={
                  lockedMemoToView === selectedMemo.id
                    ? handleUnlockMemo
                    : undefined
                }
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">📝</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    메모를 선택하거나 새로 만들어보세요
                  </h2>
                  <p className="text-gray-600 mb-8">
                    AI가 여러분의 자유로운 메모를 관심사별로 정리해드립니다
                  </p>
                  <button
                    onClick={handleCreateMemo}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
