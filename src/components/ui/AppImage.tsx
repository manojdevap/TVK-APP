import Image from "next/image";

type AppImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
};

/** Renders local (/…) or remote (http…) images */
export function AppImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  sizes,
}: AppImageProps) {
  const isRemote = src.startsWith("http");

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
        unoptimized={isRemote}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 64}
      height={height ?? 64}
      className={className}
      unoptimized={isRemote}
    />
  );
}
