"use client";

import { Media } from "@once-ui-system/core";
import type { Gallery } from "@/types";

interface GalleryViewProps {
  images: Gallery["images"];
  useRegularImg?: boolean; // For dynamic content like uploaded images
}

export default function GalleryView({ images, useRegularImg = false }: GalleryViewProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-8">
      <div className="columns-1 md:columns-2 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="break-inside-avoid mb-4"
            style={{ ...( { WebkitColumnBreakInside: "avoid", breakInside: "avoid" } as any) }}
          >
            {useRegularImg ? (
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-auto rounded-xl cursor-pointer hover:shadow-lg transition-shadow duration-300"
                loading={index < 6 ? "eager" : "lazy"}
                onClick={() => {
                  // Simple lightbox implementation
                  const modal = document.createElement('div');
                  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4';
                  modal.innerHTML = `
                    <div class="max-w-[90vw] max-h-[90vh] relative">
                      <button class="absolute top-2 right-2 z-10 bg-white/90 text-black rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold" onclick="this.parentElement.parentElement.remove()">×</button>
                      <img src="${image.src}" alt="${image.alt}" class="max-w-full max-h-full object-contain rounded-lg" />
                    </div>
                  `;
                  modal.onclick = (e) => {
                    if (e.target === modal) modal.remove();
                  };
                  document.body.appendChild(modal);
                }}
              />
            ) : (
              <Media
                enlarge
                priority={index < 6}
                sizes="(max-width: 768px) 100vw, 50vw"
                radius="l"
                aspectRatio={image.orientation === "horizontal" ? "16 / 9" : "3 / 4"}
                src={image.src}
                alt={image.alt}
                className="w-full h-auto hover:shadow-lg transition-shadow duration-300"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
