import { useState } from "react";

interface ImageWithFallbackProps {
  alt: string;
  className?: string;
  fallbackLabel: string;
  height: number;
  loading?: "eager" | "lazy";
  src: string;
  width: number;
}

export function ImageWithFallback({
  alt,
  className = "",
  fallbackLabel,
  height,
  loading = "lazy",
  src,
  width,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={`${fallbackLabel}图片暂不可用`}
        className={`image-with-fallback image-fallback ${className}`}
        role="img"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <span>{fallbackLabel}</span>
        <small>图片暂不可用</small>
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={`image-with-fallback ${className}`}
      decoding="async"
      height={height}
      loading={loading}
      onError={() => setFailed(true)}
      src={src}
      width={width}
    />
  );
}
