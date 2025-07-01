
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
2. 개조식으로 작성 (불릿 포인트 사용)
3. 내용의 계층에 따라 적절한 들여쓰기 적용
4. 가독성을 극대화한 마크다운 형식으로 출력
5. 한국어로 정리

메모 내용:
${content}

정리된 형식으로 출력해주세요.
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
