
import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Memo, SearchResult } from '@/types/memo';

interface SmartSearchProps {
  memos: Memo[];
  onSearchResults: (results: SearchResult[]) => void;
  onClearSearch: () => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  memos,
  onSearchResults,
  onClearSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const performSmartSearch = async (query: string) => {
    if (!query.trim()) {
      onClearSearch();
      return;
    }

    setIsSearching(true);
    
    // 기본적인 키워드 매칭과 유사도 검색을 구현
    const results: SearchResult[] = [];
    const queryWords = query.toLowerCase().split(' ');
    
    memos.forEach(memo => {
      const content = (memo.title + ' ' + memo.content).toLowerCase();
      const tags = memo.tags?.join(' ').toLowerCase() || '';
      const searchableText = content + ' ' + tags;
      
      let relevanceScore = 0;
      const matchedKeywords: string[] = [];
      
      // 정확한 일치
      queryWords.forEach(word => {
        if (searchableText.includes(word)) {
          relevanceScore += 10;
          matchedKeywords.push(word);
        }
      });
      
      // 부분 일치
      queryWords.forEach(word => {
        const partialMatches = searchableText.split(' ').filter(w => 
          w.includes(word) && !matchedKeywords.includes(word)
        );
        relevanceScore += partialMatches.length * 5;
        matchedKeywords.push(...partialMatches);
      });
      
      // 태그 매칭에 가중치 부여
      if (memo.tags) {
        memo.tags.forEach(tag => {
          if (queryWords.some(word => tag.toLowerCase().includes(word))) {
            relevanceScore += 15;
          }
        });
      }
      
      if (relevanceScore > 0) {
        results.push({
          memo,
          relevanceScore,
          matchedKeywords: [...new Set(matchedKeywords)]
        });
      }
    });
    
    // 관련도 순으로 정렬
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    setIsSearching(false);
    onSearchResults(results.slice(0, 10)); // 상위 10개만 반환
  };

  const handleSearch = () => {
    performSmartSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    onClearSearch();
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="스마트 검색 (예: 사용자 경험, 마케팅 전략...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10"
        />
      </div>
      <Button 
        onClick={handleSearch} 
        disabled={isSearching}
        className="flex items-center space-x-1"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isSearching ? '검색 중...' : '검색'}</span>
      </Button>
      {searchQuery && (
        <Button variant="outline" onClick={handleClear}>
          초기화
        </Button>
      )}
    </div>
  );
};
