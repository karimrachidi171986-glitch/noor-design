import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { PRODUCTS, Product } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash } from 'lucide-react';

interface ProductGridProps {
  isAdmin?: boolean;
}

export default function ProductGrid({ isAdmin }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('noor-products');
    return saved ? JSON.parse(saved) : PRODUCTS;
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'panel' | 'art'>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Persist products to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('noor-products', JSON.stringify(products));
  }, [products]);

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `p${Date.now()}`,
      name: 'Nouvelle Création',
      price: 'DH / m²',
      category: 'panel',
      imageUrl: 'https://images.unsplash.com/photo-1544450610-ad597caaf270?auto=format&fit=crop&q=80&w=800',
      images: ['https://images.unsplash.com/photo-1544450610-ad597caaf270?auto=format&fit=crop&q=80&w=800'],
      instagramUrl: 'https://www.instagram.com/noor3dart/',
      description: 'Description de la texture et des détails...',
    };
    setEditingProduct(newProduct);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      if (products.find(p => p.id === editingProduct.id)) {
        setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
      } else {
        setProducts([editingProduct, ...products]);
      }
      setEditingProduct(null);
    }
  };

  const handleAddGalleryImage = () => {
    if (editingProduct) {
      const newImages = [...(editingProduct.images || [editingProduct.imageUrl]), ''];
      setEditingProduct({ ...editingProduct, images: newImages });
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    if (editingProduct && editingProduct.images) {
      const newImages = editingProduct.images.filter((_, i) => i !== index);
      setEditingProduct({ ...editingProduct, images: newImages });
    }
  };

  const handleGalleryImageChange = (index: number, value: string) => {
    if (editingProduct && editingProduct.images) {
      const newImages = [...editingProduct.images];
      newImages[index] = value;
      setEditingProduct({ ...editingProduct, images: newImages });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setUploadError("Le fichier doit être une image (JPEG, PNG, WEBP, etc.).");
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("L'image est trop volumineuse (max 5 Mo).");
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleGalleryImageChange(index, reader.result as string);
    };
    reader.onerror = () => {
      setUploadError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  const sections = [
    { id: 'panel', label: 'Tableaux 3D', products: products.filter(p => p.category === 'panel') },
    { id: 'art', label: 'Tableaux Géométriques', products: products.filter(p => p.category === 'art') }
  ];

  const filters: { id: 'all' | 'panel' | 'art'; label: string }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'panel', label: 'Tableaux 3D' },
    { id: 'art', label: 'Tableaux Géométriques' },
  ];

  const visibleSections = activeFilter === 'all' 
    ? sections 
    : sections.filter(s => s.id === activeFilter);

  return (
    <section id="catalogue" className="pt-16 pb-32 px-6 max-w-7xl mx-auto">
      <header className="mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <span className="text-[10px] font-bold tracking-[0.6em] text-noor-gold uppercase">
            Curated Collection
          </span>
          <h2 className="text-6xl md:text-8xl font-serif text-noor-bronze leading-tight">
            Le <span className="italic">Catalogue</span>
          </h2>
          <div className="w-24 h-px bg-noor-gold/30 mx-auto mt-8" />
        </motion.div>
      </header>

      {/* Filter & Add Product Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-wrap justify-center gap-4">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-8 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 border ${
                activeFilter === filter.id
                  ? 'bg-noor-gold text-white border-noor-gold shadow-lg shadow-noor-gold/20'
                  : 'bg-white text-noor-bronze border-noor-bronze/10 hover:border-noor-gold hover:text-noor-gold shadow-sm'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-8 py-2.5 bg-noor-bronze text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-noor-gold transition-all shadow-xl shadow-noor-bronze/10"
          >
            <Plus className="w-4 h-4" />
            Nouveau Produit
          </button>
        )}
      </div>

      <div className="space-y-24">
        {visibleSections.map((section) => (
          <div key={section.id} className="space-y-12">
            <div className="flex items-center gap-6">
              <h3 className="text-2xl font-serif text-noor-bronze italic pr-6 bg-white shrink-0">
                {section.label}
              </h3>
              <div className="h-px bg-noor-bronze/10 w-full" />
            </div>
            
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {section.products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onDelete={handleDelete}
                    onEdit={setEditingProduct}
                    isAdmin={isAdmin}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-noor-bronze/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-6 right-6 text-noor-bronze/40 hover:text-noor-bronze"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-serif text-noor-bronze mb-8 italic">Modifier le produit</h3>
              
              {uploadError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {uploadError}
                </motion.div>
              )}
              
              <form onSubmit={handleEditSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-2">Nom du produit</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze font-serif italic"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-2">Prix</label>
                    <input
                      type="text"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze font-serif italic"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-2">Catégorie</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value as 'panel' | 'art'})}
                      className="w-full px-4 py-3 rounded-xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze font-serif italic bg-white"
                    >
                      <option value="panel">Tableau 3D</option>
                      <option value="art">Tableau Géométrique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-2">Lien Instagram</label>
                    <input
                      type="url"
                      value={editingProduct.instagramUrl}
                      onChange={(e) => setEditingProduct({...editingProduct, instagramUrl: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-2">Description</label>
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze text-sm font-serif italic h-24 resize-none"
                    placeholder="Décrivez la texture, les dimensions, etc."
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold">Gallerie d'images</label>
                    <button
                      type="button"
                      onClick={handleAddGalleryImage}
                      className="flex items-center gap-2 px-3 py-1 bg-noor-gold/10 text-noor-gold rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-noor-gold hover:text-white transition-all underline decoration-noor-gold/30 underline-offset-4"
                    >
                      <Plus className="w-3 h-3" />
                      Ajouter une image
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {(editingProduct.images || [editingProduct.imageUrl]).map((img, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 border border-noor-bronze/10 rounded-xl bg-noor-sand/5 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-noor-sand/10 border border-noor-bronze/5 shrink-0">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={img}
                              onChange={(e) => handleGalleryImageChange(idx, e.target.value)}
                              placeholder="URL de l'image"
                              className="w-full px-3 py-1.5 rounded-lg border border-noor-bronze/10 focus:border-noor-gold outline-none text-[10px] text-noor-bronze bg-white"
                            />
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, idx)}
                              className="w-full text-[8px] text-noor-bronze/60 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[8px] file:font-bold file:bg-noor-gold/10 file:text-noor-gold hover:file:bg-noor-gold hover:file:text-white transition-all cursor-pointer"
                            />
                          </div>
                          {(editingProduct.images?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="p-2 text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-noor-bronze text-white rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-noor-gold transition-all duration-300 shadow-xl shadow-noor-bronze/10"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-24 text-center"
      >
        <a 
          href="https://www.instagram.com/noor3dart/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 border border-noor-bronze text-noor-bronze rounded-full text-xs font-bold tracking-widest uppercase hover:bg-noor-bronze hover:text-white transition-all duration-500"
        >
          Voir plus sur Instagram
        </a>
      </motion.div>
    </section>
  );
}
