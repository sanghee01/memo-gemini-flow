interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ImageInfo {
  placeholder: string;
  markdown: string;
  position: number;
  alt: string;
}

export const organizeContentWithGemini = async (
  content: string,
  apiKey: string
): Promise<string> => {
  // 1. 이미지 추출 및 플레이스홀더로 대체 (더 정확한 정규식 사용)
  const imageRegex =
    /!\[([^\]]*)\]\((data:image\/[^;\s]+;base64,[A-Za-z0-9+/=]+)\)/g;
  const images: ImageInfo[] = [];
  const imageIndex = 0;
  let contentWithoutImages = content;

  // 이미지 정보 수집
  const matches = Array.from(content.matchAll(imageRegex));

  // 뒤에서부터 처리하여 인덱스 변화 문제 방지
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const placeholder = `{{IMAGE_PLACEHOLDER_${i + 1}}}`;
    const imageInfo: ImageInfo = {
      placeholder,
      markdown: match[0],
      position: match.index || 0,
      alt: match[1] || `이미지${i + 1}`,
    };
    images.unshift(imageInfo); // 앞쪽에 추가하여 순서 유지

    // 이미지 마크다운을 플레이스홀더로 대체
    contentWithoutImages =
      contentWithoutImages.substring(0, match.index) +
      placeholder +
      contentWithoutImages.substring((match.index || 0) + match[0].length);
  }

  console.log(`추출된 이미지 개수: ${images.length}`);
  console.log(
    "플레이스홀더로 대체된 콘텐츠:",
    contentWithoutImages.substring(0, 200)
  );

  const prompt = `
다음 메모 내용을 분석하여 키워드 기반으로 정리해주세요:

요구사항:
1. 핵심 키워드들을 추출하고 이를 기반으로 내용을 응집시켜 정리
2. 개조식으로 작성 (불릿 포인트 사용)
3. 내용의 계층에 따라 적절한 들여쓰기 적용
4. **반드시 올바른 마크다운 문법을 사용하여 출력**
5. 한국어로 정리
6. {{IMAGE_PLACEHOLDER_N}} 형태의 플레이스홀더는 **절대 수정하지 말고** 그대로 유지하되, 관련 내용 근처에 배치
7. 마크다운 헤더(#), 리스트(-,*), 코드블록(\`\`\`) 등의 문법을 정확히 사용
8. 플레이스홀더 앞뒤로 적절한 줄바꿈 유지

메모 내용:
${contentWithoutImages}

**중요**: 응답은 반드시 유효한 마크다운 형식이어야 하며, 플레이스홀더는 절대 변경하지 마세요.

정리된 형식으로 출력해주세요.
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
          generationConfig: {
            temperature: 0.5, // 더 일관성 있는 결과를 위해 낮춤
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("API 응답에서 결과를 찾을 수 없습니다.");
    }

    let organizedContent = data.candidates[0].content.parts[0].text;

    // 2. 플레이스홀더를 실제 이미지 마크다운으로 복원
    images.forEach((imageInfo, index) => {
      const placeholderRegex = new RegExp(
        `\\{\\{IMAGE_PLACEHOLDER_${index + 1}\\}\\}`,
        "g"
      );
      organizedContent = organizedContent.replace(
        placeholderRegex,
        `\n${imageInfo.markdown}\n`
      );
    });

    // 3. 마크다운 정리 (중복 줄바꿈 제거 등)
    organizedContent = organizedContent
      .replace(/\n{3,}/g, "\n\n") // 3개 이상의 연속 줄바꿈을 2개로 줄임
      .replace(/^\n+/, "") // 시작 부분의 줄바꿈 제거
      .replace(/\n+$/, "\n"); // 끝 부분의 줄바꿈 정리

    console.log("이미지 복원 후 콘텐츠 길이:", organizedContent.length);
    console.log(
      "복원된 이미지 개수:",
      (organizedContent.match(/!\[.*?\]\(data:image/g) || []).length
    );

    // 4. 마크다운 검증
    if (!validateMarkdown(organizedContent)) {
      console.warn("마크다운 검증 실패, 원본 반환");
      return content;
    }

    return organizedContent;
  } catch (error) {
    console.error("Gemini API 호출 오류:", error);
    throw new Error("메모 정리 중 오류가 발생했습니다. API 키를 확인해주세요.");
  }
};

// 간단한 마크다운 검증 함수
const validateMarkdown = (content: string): boolean => {
  try {
    // 기본적인 마크다운 문법 검증
    const lines = content.split("\n");
    let isValid = true;

    lines.forEach((line, index) => {
      // 헤더 검증
      if (line.startsWith("#")) {
        if (!/^#{1,6}\s/.test(line) && line.trim() !== "#") {
          console.warn(`잘못된 헤더 문법 (줄 ${index + 1}): ${line}`);
          isValid = false;
        }
      }

      // 리스트 검증
      if (line.match(/^\s*[-*+]\s/)) {
        if (!/^\s*[-*+]\s.+/.test(line)) {
          console.warn(`잘못된 리스트 문법 (줄 ${index + 1}): ${line}`);
          isValid = false;
        }
      }
    });

    // 이미지 문법 검증
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g);
    if (imageMatches) {
      imageMatches.forEach((match) => {
        if (!/!\[[^\]]*\]\([^)]+\)/.test(match)) {
          console.warn(`잘못된 이미지 문법: ${match}`);
          isValid = false;
        }
      });
    }

    return isValid;
  } catch (error) {
    console.error("마크다운 검증 오류:", error);
    return false;
  }
};
