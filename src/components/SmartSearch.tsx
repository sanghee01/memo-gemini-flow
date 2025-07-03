import React, { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Memo, SearchResult } from "@/types/memo";
import { performEnhancedSearch } from "@/services/enhancedSearchService";

interface SmartSearchProps {
  memos: Memo[];
  onSearchResults: (results: SearchResult[]) => void;
  onClearSearch: () => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  memos,
  onSearchResults,
  onClearSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const performSmartSearch = async (query: string) => {
    if (!query.trim()) {
      onClearSearch();
      return;
    }

    setIsSearching(true);

    try {
      const results = await performEnhancedSearch(query, memos);
      onSearchResults(results);
    } catch (error) {
      console.error("검색 오류:", error);
      onSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    performSmartSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    onClearSearch();
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="AI 스마트 검색 (예: 사용자 경험, 마케팅 아이디어...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10"
        />
      </div>
      <Button
        onClick={handleSearch}
        disabled={isSearching}
        className="flex items-center space-x-1"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isSearching ? "검색 중..." : "검색"}</span>
      </Button>
      {searchQuery && (
        <Button variant="outline" onClick={handleClear}>
          초기화
        </Button>
      )}
    </div>
  );
};
