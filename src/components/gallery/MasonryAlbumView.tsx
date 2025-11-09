"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface PublicMediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  filename: string;
}

interface MasonryAlbumViewProps {
  media: PublicMediaItem[];
}

export default function MasonryAlbumView({ media }: MasonryAlbumViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback((index: number) => setOpenIndex(index), []);
  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + media.length) % media.length)), [media.length]);
  const next = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % media.length)), [media.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openIndex === null) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }

    if (openIndex !== null) {
      document.addEventListener("keydown", onKey);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => closeButtonRef.current?.focus(), 0);
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prevOverflow;
      };
    }
    return;
  }, [openIndex, close, prev, next]);

  return (
    <>
      <div className="w-full py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div 
            className="columns-1 sm:columns-2 md:columns-3"
            style={{ columnGap: '1rem' }}
          >
            {media.map((item, i) => (
              <div
                key={item.id}
                className="break-inside-avoid mb-4"
                style={{ ...( { WebkitColumnBreakInside: "avoid", breakInside: "avoid" } as any) }}
              >
                {item.type === "video" ? (
                  <div
                    className="w-full bg-neutral-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => open(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" ? open(i) : undefined)}
                  >
                    <div className="w-full aspect-video flex items-center justify-center bg-neutral-200">
                      <span className="text-2xl">🎥</span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-auto block rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => open(i)}
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Media ${openIndex + 1} of ${media.length}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div className="max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
            <button
              ref={closeButtonRef}
              onClick={close}
              aria-label="Close media"
              className="absolute top-2 right-2 z-50 rounded-md bg-white/90 text-black p-2 focus:outline-none focus:ring"
            >
              ✕
            </button>

            <button onClick={prev} aria-label="Previous media" className="absolute left-2 z-40 rounded-md bg-white/80 p-2 focus:outline-none focus:ring">‹</button>

            <div className="overflow-auto max-h-[90vh]">
              {media[openIndex].type === "video" ? (
                <video src={media[openIndex].url} controls className="max-w-full max-h-[80vh] block mx-auto rounded" />
              ) : (
                <img src={media[openIndex].url} alt={media[openIndex].filename} className="max-w-full max-h-[80vh] w-auto h-auto block mx-auto rounded" />
              )}
            </div>

            <button onClick={next} aria-label="Next media" className="absolute right-2 z-40 rounded-md bg-white/80 p-2 focus:outline-none focus:ring">›</button>
          </div>
        </div>
      )}
    </>
  );
}
