import { Memo, SearchResult } from "@/types/memo";

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

export const performEnhancedSearch = async (
  query: string,
  memos: Memo[]
): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((word) => word.length > 0);

  // 각 메모에 대해 검색 수행
  for (const memo of memos) {
    const contentLower = memo.content.toLowerCase();
    const titleLower = memo.title.toLowerCase();
    const tagsLower = memo.tags?.map((tag) => tag.toLowerCase()) || [];

    // 정확한 매칭 점수 계산
    let exactScore = 0;
    const matchedKeywords: string[] = [];

    // 제목에서의 매칭 (가중치 3)
    if (titleLower.includes(queryLower)) {
      exactScore += 3;
      matchedKeywords.push("제목");
    }

    // 태그에서의 매칭 (가중치 2)
    for (const tag of tagsLower) {
      if (tag.includes(queryLower)) {
        exactScore += 2;
        matchedKeywords.push(`태그: ${tag}`);
      }
    }

    // 내용에서의 매칭 (가중치 1)
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        exactScore += 1;
        matchedKeywords.push(word);
      }
    }

    // 정확한 매칭이 있는 경우
    if (exactScore > 0) {
      results.push({
        memo,
        relevanceScore: exactScore,
        matchedTerms: [...new Set(matchedKeywords)],
        searchType: "exact",
      });
    } else {
      // 의미적 유사성 검사 (단어 일부 매칭)
      let contextualScore = 0;
      for (const word of queryWords) {
        if (
          contentLower
            .split("")
            .some((_, i) => contentLower.slice(i, i + word.length) === word)
        ) {
          contextualScore += 0.5;
        }
      }

      if (contextualScore > 0) {
        results.push({
          memo,
          relevanceScore: contextualScore,
          matchedTerms: [],
          searchType: "semantic",
        });
      }
    }
  }

  // AI 기반 검색도 시도 (API 키가 있는 경우)
  try {
    const aiResults = await performAIEnhancedSearch(query, memos);
    results.push(...aiResults);
  } catch (error) {
    console.log("AI 검색 실패, 기본 검색 결과만 반환:", error);
  }

  // 중복 제거 및 점수순 정렬
  const uniqueResults = results.reduce((acc, result) => {
    const existing = acc.find((r) => r.memo.id === result.memo.id);
    if (!existing || existing.relevanceScore < result.relevanceScore) {
      return [...acc.filter((r) => r.memo.id !== result.memo.id), result];
    }
    return acc;
  }, [] as SearchResult[]);

  return uniqueResults
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10); // 상위 10개만 반환
};

const performAIEnhancedSearch = async (
  query: string,
  memos: Memo[]
): Promise<SearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  const prompt = `
다음 검색어에 가장 관련성이 높은 메모들을 찾아주세요.
검색어: "${query}"

메모 목록:
${memos
  .map(
    (memo, index) =>
      `${index + 1}. 제목: ${memo.title}\n내용: ${memo.content.slice(
        0,
        200
      )}...`
  )
  .join("\n\n")}

각 메모에 대해 0-1 사이의 관련성 점수를 매겨주세요. 응답 형식:
메모번호: 점수
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 응답에서 점수 추출
    const results: SearchResult[] = [];
    const lines = responseText.split("\n");

    for (const line of lines) {
      const match = line.match(/(\d+):\s*([\d.]+)/);
      if (match) {
        const memoIndex = parseInt(match[1]) - 1;
        const score = parseFloat(match[2]);

        if (memoIndex >= 0 && memoIndex < memos.length && score > 0.3) {
          results.push({
            memo: memos[memoIndex],
            relevanceScore: score,
            matchedTerms: ["AI 매칭"],
            searchType: "ai_enhanced",
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("AI 검색 오류:", error);
    return [];
  }
};

const calculateContextualSimilarity = (query: string, memo: Memo): number => {
  const queryWords = query.toLowerCase().split(" ");
  const memoText = (memo.title + " " + memo.content).toLowerCase();

  let score = 0;
  queryWords.forEach((word) => {
    // 부분적 매칭
    const partialMatches = memoText
      .split(" ")
      .filter((w) => w.includes(word) && w !== word);
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

export const enhancedSemanticSearch = async (
  memos: Memo[],
  searchQuery: string,
  threshold: number = 0.5
): Promise<SearchResult[]> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("API 키가 설정되지 않았습니다. 기본 검색으로 전환합니다.");
    return performBasicSearch(memos, searchQuery);
  }

  try {
    // 검색어를 더 포괄적으로 확장
    const expandedQuery = await expandSearchQuery(searchQuery, apiKey);

    // 각 메모에 대해 관련성 점수 계산
    const searchResults: SearchResult[] = [];

    for (const memo of memos) {
      const relevanceScore = await calculateRelevanceScore(
        memo,
        searchQuery,
        expandedQuery,
        apiKey
      );

      if (relevanceScore >= threshold) {
        searchResults.push({
          memo,
          relevanceScore,
          matchedTerms: extractMatchedTerms(memo, [
            searchQuery,
            ...expandedQuery,
          ]),
          searchType: "ai_enhanced",
        });
      }
    }

    // 관련성 점수순으로 정렬
    return searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error("AI 향상 검색 실패, 기본 검색으로 전환:", error);
    return performBasicSearch(memos, searchQuery);
  }
};

const expandSearchQuery = async (
  query: string,
  apiKey: string
): Promise<string[]> => {
  const prompt = `다음 검색어와 관련된 유사어, 동의어, 관련 개념어를 한국어로 3-5개 제시해주세요.
검색어: ${query}

응답 형식: 단어1, 단어2, 단어3 (쉼표로 구분)`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const expandedTerms = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return expandedTerms
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0)
      .slice(0, 5);
  } catch (error) {
    console.error("검색어 확장 실패:", error);
    return [];
  }
};

const calculateRelevanceScore = async (
  memo: Memo,
  query: string,
  expandedQuery: string[],
  apiKey: string
): Promise<number> => {
  // Implementation of calculateRelevanceScore function
  // This function should return a relevance score based on the memo and the expanded query
  // You can use any method to calculate this score, such as cosine similarity, TF-IDF, etc.
  // For now, we'll use a simple implementation
  return 0; // Placeholder return, actual implementation needed
};

const extractMatchedTerms = (memo: Memo, terms: string[]): string[] => {
  // Implementation of extractMatchedTerms function
  // This function should return an array of matched terms from the memo
  // For now, we'll use a simple implementation
  return []; // Placeholder return, actual implementation needed
};

const performBasicSearch = (memos: Memo[], query: string): SearchResult[] => {
  // Implementation of performBasicSearch function
  // This function should return an array of SearchResult objects based on the basic search
  // For now, we'll use a simple implementation
  return []; // Placeholder return, actual implementation needed
};
