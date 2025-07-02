
import { Memo, SearchResult } from '@/types/memo';

const DEVELOPER_API_KEY = '***REMOVED***';

export const performEnhancedSearch = async (query: string, memos: Memo[]): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  // 1단계: 정확한 키워드 매칭 (최우선)
  const exactMatches: SearchResult[] = [];
  const contextualMatches: SearchResult[] = [];

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(' ').filter(w => w.length > 1);

  memos.forEach(memo => {
    const searchableText = (memo.title + ' ' + memo.content + ' ' + (memo.tags?.join(' ') || '')).toLowerCase();
    
    let exactScore = 0;
    let contextualScore = 0;
    const matchedKeywords: string[] = [];

    // 정확한 문구 매칭
    if (searchableText.includes(queryLower)) {
      exactScore += 100;
      matchedKeywords.push(query);
    }

    // 개별 단어 매칭
    queryWords.forEach(word => {
      if (searchableText.includes(word)) {
        exactScore += 20;
        matchedKeywords.push(word);
      }
    });

    // 태그 매칭 가중치
    if (memo.tags) {
      memo.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower) || queryWords.some(w => tag.toLowerCase().includes(w))) {
          exactScore += 30;
        }
      });
    }

    if (exactScore > 0) {
      exactMatches.push({
        memo,
        relevanceScore: exactScore,
        matchedKeywords: [...new Set(matchedKeywords)]
      });
    } else {
      // 문맥적 유사성은 별도로 처리
      contextualScore = calculateContextualSimilarity(query, memo);
      if (contextualScore > 0) {
        contextualMatches.push({
          memo,
          relevanceScore: contextualScore,
          matchedKeywords: []
        });
      }
    }
  });

  // 2단계: AI 기반 문맥적 검색 (정확한 매칭이 부족할 때)
  let aiMatches: SearchResult[] = [];
  if (exactMatches.length < 3) {
    try {
      aiMatches = await performAiContextualSearch(query, memos);
    } catch (error) {
      console.error('AI 검색 오류:', error);
    }
  }

  // 결과 병합 및 정렬
  const allResults = [
    ...exactMatches.sort((a, b) => b.relevanceScore - a.relevanceScore),
    ...aiMatches.filter(ai => !exactMatches.some(exact => exact.memo.id === ai.memo.id)),
    ...contextualMatches.filter(ctx => 
      !exactMatches.some(exact => exact.memo.id === ctx.memo.id) &&
      !aiMatches.some(ai => ai.memo.id === ctx.memo.id)
    ).sort((a, b) => b.relevanceScore - a.relevanceScore)
  ];

  return allResults.slice(0, 10);
};

const calculateContextualSimilarity = (query: string, memo: Memo): number => {
  const queryWords = query.toLowerCase().split(' ');
  const memoText = (memo.title + ' ' + memo.content).toLowerCase();
  
  let score = 0;
  queryWords.forEach(word => {
    // 부분적 매칭
    const partialMatches = memoText.split(' ').filter(w => w.includes(word) && w !== word);
    score += partialMatches.length * 5;
    
    // 유사 어근 검색 (간단한 한국어 어근)
    if (word.length > 2) {
      const stem = word.slice(0, -1);
      if (memoText.includes(stem)) {
        score += 3;
      }
    }
  });
  
  return score;
};

const performAiContextualSearch = async (query: string, memos: Memo[]): Promise<SearchResult[]> => {
  const prompt = `
다음 검색어에 대해 제공된 메모들 중에서 의미적으로 관련된 메모를 찾아주세요.

검색어: "${query}"

메모 목록:
${memos.map((memo, index) => `
${index + 1}. ID: ${memo.id}
제목: ${memo.title || '제목 없음'}
내용: ${memo.content.slice(0, 200)}...
태그: ${memo.tags?.join(', ') || '없음'}
`).join('\n')}

요구사항:
1. 검색어와 의미적으로 관련된 메모 ID들을 찾아주세요
2. 관련도가 높은 순서로 최대 5개까지만 선택해주세요
3. 각 메모에 대해 관련도 점수(1-100)를 매겨주세요
4. 결과는 다음 형식으로만 반환해주세요:
ID:점수,ID:점수,ID:점수

예시: memo1:85,memo3:72,memo7:65
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${DEVELOPER_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 결과 파싱
    const results: SearchResult[] = [];
    const matches = resultText.match(/\w+:\d+/g) || [];
    
    matches.forEach(match => {
      const [id, scoreStr] = match.split(':');
      const score = parseInt(scoreStr);
      const memo = memos.find(m => m.id === id);
      
      if (memo && score > 30) {
        results.push({
          memo,
          relevanceScore: score,
          matchedKeywords: ['AI 매칭']
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error('AI 문맥 검색 오류:', error);
    return [];
  }
};
