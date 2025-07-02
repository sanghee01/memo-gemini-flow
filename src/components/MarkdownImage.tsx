import React, { useState } from "react";

interface MarkdownImageProps {
  src?: string;
  alt?: string;
}

export const MarkdownImage: React.FC<MarkdownImageProps> = ({ src, alt }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  console.log("MarkdownImage - src:", src?.substring(0, 50) + "..."); // Base64 일부만 로그

  if (!src) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 my-4 text-center">
        <div className="text-gray-500">
          <span className="text-2xl">🖼️</span>
          <p className="mt-2 text-sm">이미지 소스가 없습니다</p>
        </div>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-lg p-4 my-4 text-center">
        <div className="text-red-500">
          <span className="text-2xl">❌</span>
          <p className="mt-2 text-sm">이미지를 불러올 수 없습니다</p>
          <p className="text-xs text-red-400">{alt}</p>
          <details className="mt-2 text-xs text-left">
            <summary className="cursor-pointer">디버그 정보</summary>
            <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
              {src.substring(0, 100)}...
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      {isLoading && (
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
          <div className="animate-pulse">이미지 로딩 중...</div>
        </div>
      )}
      <img
        src={src}
        alt={alt || "업로드된 이미지"}
        className="max-w-full h-auto rounded-lg shadow-md"
        style={{
          maxHeight: "400px",
          objectFit: "contain",
          display: isLoading ? "none" : "block",
        }}
        onError={(e) => {
          console.error("이미지 로드 실패:", e);
          console.error("src 타입:", typeof src);
          console.error("src 시작:", src?.substring(0, 50));
          setImageError(true);
          setIsLoading(false);
        }}
        onLoad={() => {
          console.log("이미지 로드 성공");
          setIsLoading(false);
        }}
      />
    </div>
  );
};
