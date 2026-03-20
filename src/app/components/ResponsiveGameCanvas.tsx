import React, { useEffect, useMemo, useRef, useState } from "react";

type ResponsiveGameCanvasProps = {
  designWidth: number;
  designHeight: number;
  className?: string;
  children: (params: {
    canvasStyle: React.CSSProperties;
    scale: number;
    designWidth: number;
    designHeight: number;
    viewportWidth: number;
    viewportHeight: number;
  }) => React.ReactNode;
};

export default function ResponsiveGameCanvas({
  designWidth,
  designHeight,
  className = "",
  children,
}: ResponsiveGameCanvasProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: designWidth,
    height: designHeight,
  });

  useEffect(() => {
    const updateViewportSize = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      setViewportSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateViewportSize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateViewportSize())
        : null;

    if (rootRef.current && resizeObserver) {
      resizeObserver.observe(rootRef.current);
    }

    window.addEventListener("resize", updateViewportSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  const canvasStyle = useMemo(() => {
    const scale = Math.min(
      viewportSize.width / designWidth,
      viewportSize.height / designHeight
    );
    const scaledWidth = designWidth * scale;
    const scaledHeight = designHeight * scale;
    const offsetX = (viewportSize.width - scaledWidth) / 2;
    const offsetY = (viewportSize.height - scaledHeight) / 2;

    return {
      transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
      transformOrigin: "top left",
      width: designWidth,
      height: designHeight,
    } satisfies React.CSSProperties;
  }, [designHeight, designWidth, viewportSize.height, viewportSize.width]);

  const scale = Math.min(
    viewportSize.width / designWidth,
    viewportSize.height / designHeight
  );

  return (
    <div ref={rootRef} className={className}>
      {children({
        canvasStyle,
        scale,
        designWidth,
        designHeight,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
      })}
    </div>
  );
}
