import { organizeContentWithGemini } from "./geminiService";

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

export const generateTagsWithGemini = async (
  content: string,
  apiKey: string
): Promise<string[]> => {
  const effectiveApiKey = apiKey || getApiKey();

  if (!effectiveApiKey) {
    console.error("API 키가 설정되지 않았습니다.");
    return [];
  }

  const prompt = `다음 메모 내용을 분석하여 핵심 키워드를 3-5개 추출해주세요. 
키워드는 한국어로, 쉼표로 구분하여 나열해주세요.

메모 내용:
${content}

응답 형식: 키워드1, 키워드2, 키워드3`;

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
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 키워드 추출 및 정리
    const keywords = generatedText
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .slice(0, 5); // 최대 5개로 제한

    return keywords;
  } catch (error) {
    console.error("태그 생성 중 오류:", error);
    return [];
  }
};
