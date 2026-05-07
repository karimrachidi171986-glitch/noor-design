import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Product } from '../constants';
import ProductGallery from './ProductGallery';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
  key?: React.Key;
}

export default function ProductCard({ product, onEdit, onDelete, isAdmin }: ProductCardProps) {
  const whatsappNumber = "212725963350";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Bonjour Noor Design, je souhaite commander la pièce suivante :\n\nProduit : ${product.name}\nPrix : ${product.price}\n\nMerci de me donner plus d'informations.`
  )}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 flex flex-col relative"
    >
      {/* Admin Actions Overlay */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30 flex gap-2 animate-in fade-in slide-in-from-right duration-500">
          <button
            onClick={() => onEdit(product)}
            className="p-2 bg-white/90 backdrop-blur-sm text-noor-bronze rounded-full hover:bg-noor-gold hover:text-white transition-all shadow-sm"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative aspect-[4/5] overflow-hidden bg-noor-sand/20">
        <ProductGallery 
          images={product.images || [product.imageUrl]} 
          isAdmin={isAdmin}
          onAddImage={() => onEdit(product)}
        />
        
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[8px] font-bold tracking-widest uppercase text-noor-gold rounded-full">
            {product.category === 'panel' ? 'Tableau 3D' : 'Tableau Géométrique'}
          </span>
        </div>
      </div>

      <div className="p-8 space-y-6 flex-1 flex flex-col justify-between italic">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-serif text-noor-bronze leading-tight group-hover:text-noor-gold transition-colors duration-300">
              {product.name}
            </h3>
            <ArrowRight className="w-4 h-4 text-noor-gold/30 group-hover:text-noor-gold transition-colors mt-1" />
          </div>
          <p className="text-xs text-noor-bronze/40 font-light leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-6 border-t border-noor-bronze/5 space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] text-noor-gold font-bold tracking-widest uppercase mb-1">Prix Estimé</span>
              <span className="text-xl font-serif text-noor-bronze">{product.price}</span>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-600/20"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Commander via WhatsApp</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
