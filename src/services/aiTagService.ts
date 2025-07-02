import { organizeContentWithGemini } from "./geminiService";

const DEVELOPER_API_KEY = "***REMOVED***";

export const generateTagsWithGemini = async (
  content: string,
  apiKey: string
): Promise<string[]> => {
  // apiKey가 비어있으면 기본 개발자 API 키 사용
  const effectiveApiKey = apiKey.trim() || DEVELOPER_API_KEY;

  const prompt = `
다음 메모 내용을 분석하여 관련된 태그/키워드를 추출해주세요.

요구사항:
1. 메모의 핵심 주제와 관련된 태그를 추출
2. 최대 5개까지만 추출
3. 한국어로 추출
4. 각 태그는 2-6글자 사이
5. 쉼표로 구분하여 나열
6. 태그만 반환하고 다른 설명은 하지 마세요

메모 내용:
${content}

태그 (쉼표로 구분):
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveApiKey}`,
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
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return [];
    }

    const tagsText = data.candidates[0].content.parts[0].text;
    const tags = tagsText
      .split(/[,\n]/) // 쉼표와 줄바꿈으로 분리
      .map((tag: string) => tag.trim().replace(/^#/, "")) // 앞의 # 제거
      .filter(
        (tag: string) =>
          tag.length > 0 && tag.length <= 10 && !/^\d+$/.test(tag)
      ) // 숫자만 있는 태그 제외
      .slice(0, 5);

    console.log("생성된 태그:", tags); // 디버깅용 로그
    return tags;
  } catch (error) {
    console.error("태그 생성 오류:", error);
    return [];
  }
};
