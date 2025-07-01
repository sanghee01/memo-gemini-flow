
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const organizeContentWithGemini = async (content: string, apiKey: string): Promise<string> => {
  const prompt = `
다음 메모 내용을 분석하여 키워드 기반으로 정리해주세요:

요구사항:
1. 핵심 키워드들을 추출하고 이를 기반으로 내용을 응집시켜 정리
2. 개조식으로 작성하되, 계층적 구조를 명확히 표현
3. 메인 항목은 "- " (대시 + 공백)으로 시작
4. 하위 항목은 "    - " (공백 4개 + 대시 + 공백)으로 들여쓰기
5. 더 깊은 하위 항목은 "        - " (공백 8개 + 대시 + 공백)으로 들여쓰기
6. 가독성을 극대화한 마크다운 형식으로 출력
7. 한국어로 정리

예시 형식:
- 주요 주제 1:
    - 세부 내용 1
    - 세부 내용 2
        - 더 자세한 내용
- 주요 주제 2:
    - 세부 내용 3
    - 세부 내용 4

메모 내용:
${content}

위 형식으로 정리된 내용을 출력해주세요.
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('API 응답에서 결과를 찾을 수 없습니다.');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    throw new Error('메모 정리 중 오류가 발생했습니다. API 키를 확인해주세요.');
  }
};
