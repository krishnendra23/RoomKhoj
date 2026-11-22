import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X, Image as ImageIcon } from 'lucide-react';
import { optimizeImageUrl } from '../../utils/formatters';

export default function ImageGallery({ photos = [], title = 'Property' }) {
  const safePhotos =
    photos.length > 0
      ? photos
      : [
          {
            url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
            publicId: 'fallback',
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = () => setActiveIndex((i) => (i === 0 ? safePhotos.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === safePhotos.length - 1 ? 0 : i + 1));

  const current = safePhotos[activeIndex] || safePhotos[0];

  return (
    <div className="space-y-3">
      {/* Main Photo Stage */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs group">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.publicId || activeIndex}
            src={optimizeImageUrl(current.url, 1280)}
            alt={`${title} — photo ${activeIndex + 1}`}
            initial={{ opacity: 0.4, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.4 }}
            transition={{ duration: 0.22 }}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          />
        </AnimatePresence>

        {/* Controls */}
        {safePhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0F172A] shadow-md flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0F172A] shadow-md flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter & Fullscreen Button */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F172A]/80 text-white text-xs font-medium backdrop-blur-xs">
            <ImageIcon className="w-3.5 h-3.5" />
            {activeIndex + 1} / {safePhotos.length}
          </span>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 hover:bg-white text-[#0F172A] text-xs font-semibold shadow-xs transition-colors"
          >
            <Expand className="w-3.5 h-3.5" />
            View Full
          </button>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {safePhotos.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {safePhotos.map((photo, idx) => (
            <button
              key={photo.publicId || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                idx === activeIndex
                  ? 'border-[#2563EB] ring-2 ring-[#2563EB]/25'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={optimizeImageUrl(photo.url, 240)}
                alt={`${title} thumbnail ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0F172A]/95 flex flex-col items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close fullscreen gallery"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
            <div
              className="relative max-w-5xl w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={optimizeImageUrl(current.url, 1600)}
                alt={`${title} fullscreen ${activeIndex + 1}`}
                className="max-h-[82vh] w-auto rounded-xl object-contain"
              />
              {safePhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-2 sm:left-4 w-11 h-11 rounded-full bg-white/90 text-[#0F172A] flex items-center justify-center shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-2 sm:right-4 w-11 h-11 rounded-full bg-white/90 text-[#0F172A] flex items-center justify-center shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Photo {activeIndex + 1} of {safePhotos.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
