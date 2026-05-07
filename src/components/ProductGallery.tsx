import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  isAdmin?: boolean;
  onAddImage?: () => void;
}

export default function ProductGallery({ images, isAdmin, onAddImage }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    <div className="relative group/gallery h-full w-full bg-noor-sand/10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={images[currentIndex]}
          src={images[currentIndex]}
          alt={`Product view ${currentIndex + 1}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>

      {/* Navigation Controls */}
      {images.length > 1 && (
        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-500">
          <button
            onClick={prev}
            className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-noor-bronze transition-all shadow-sm border border-white/30"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={next}
            className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-noor-bronze transition-all shadow-sm border border-white/30"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-full bg-white/10 backdrop-blur-[2px]">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`w-1 h-1 rounded-full transition-all duration-500 ${
                idx === currentIndex ? 'bg-white w-3' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Admin Add Image Button Overlay */}
      {isAdmin && onAddImage && (
        <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-500">
          <button
            onClick={(e) => { e.stopPropagation(); onAddImage(); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-noor-gold text-white rounded-full text-[8px] font-bold tracking-widest uppercase hover:bg-noor-bronze transition-all shadow-lg shadow-noor-gold/20"
          >
            <Plus className="w-3 h-3" />
            Ajouter une image
          </button>
        </div>
      )}
    </div>
  );
}
