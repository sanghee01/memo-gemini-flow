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
다음 메모 내용을 분석하여 **체계적이고 구조화된 마크다운 형식**으로 정리해주세요:

**필수 요구사항:**

1. **헤더 구조 생성**:
   - 주요 주제는 ## (h2) 헤더로 만들기
   - 세부 주제는 ### (h3) 헤더로 만들기  
   - 더 세분화된 내용은 #### (h4) 헤더 사용

2. **불릿 포인트 적극 활용**:
   - 관련 내용들을 - (하이픈) 또는 * (별표)로 리스트화
   - 중요한 포인트들을 명확한 불릿으로 정리
   - 하위 항목은 들여쓰기 사용 (  - 또는   *)

3. **구조화 원칙**:
   - 비슷한 주제끼리 그룹핑하여 헤더 아래 배치
   - 각 헤더 아래에는 반드시 불릿 포인트들로 내용 정리
   - 핵심 키워드를 **볼드 처리**

4. **마크다운 형식 엄수**:
   - {{IMAGE_PLACEHOLDER_N}} 플레이스홀더는 절대 수정 금지
   - 헤더 후 줄바꿈, 불릿 포인트 간 적절한 간격 유지
   - 마크다운 문법 정확히 사용

**출력 형식 예시:**
\`\`\`
## 주요 주제 1
- **핵심 포인트 1**: 상세 설명
- **핵심 포인트 2**: 상세 설명
  - 세부 사항 1
  - 세부 사항 2

### 세부 주제 1-1
- 관련 내용 1
- 관련 내용 2

## 주요 주제 2
- **중요 사항**: 설명
- **추가 정보**: 설명
\`\`\`

**중요**: 반드시 헤더(##, ###)와 불릿 포인트(-, *)를 적극적으로 사용하여 구조화하세요!

**정리할 메모 내용:**
${contentWithoutImages}

위 형식을 따라 체계적으로 정리해주세요.
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
