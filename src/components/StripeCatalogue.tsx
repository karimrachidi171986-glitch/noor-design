import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Loader2, CreditCard, ShieldCheck, Upload, Trash, Plus, X, FileCheck } from 'lucide-react';
import { Product, PRODUCTS } from '../constants';

import { getAuthToken } from '../lib/auth';
import DOMPurify from 'isomorphic-dompurify';

const sanitize = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

import PayPalButton from './PayPalButton';
import { supabase } from '../lib/supabase';

interface StripeCatalogueProps {
  isAdmin?: boolean;
}

// Helper Component for Cards
interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onBuy: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  loadingId: string | null;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isAdmin, 
  onBuy, 
  onEdit, 
  onDelete, 
  loadingId 
}) => {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isCMILoading, setIsCMILoading] = useState(false);

  const handlePayPalSuccess = (details: any) => {
    console.log('Payment Successful:', details);
    alert('✅ Paiement réussi');
    
    localStorage.setItem('last_purchase', JSON.stringify({
      name: product.name,
      category: product.category,
      downloadUrl: (product.category === 'stl' && product.name.toLowerCase().includes('aurora')) ? '/files/aurora.stl' : (product.stlFilePath || '')
    }));

    setTimeout(() => {
      window.location.href = `/success?order_id=${details.id}&name=${encodeURIComponent(product.name)}&category=${product.category}`;
    }, 1500);
  };

  const handleStripeCheckout = async () => {
    setIsStripeLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          stlFilePath: product.stlFilePath,
          category: product.category
        }),
      });

      const session = await response.json();
      if (session.url) {
        // Redirect to Stripe Checkout
        window.location.href = session.url;
      } else {
        throw new Error(session.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Stripe Error:', error);
      alert('❌ Erreur de paiement Stripe');
    } finally {
      setIsStripeLoading(false);
    }
  };

  const handleCMICheckout = async () => {
    setIsCMILoading(true);
    try {
      const response = await fetch('/api/cmi/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountStr,
          productName: product.name,
          productId: product.id
        }),
      });

      const data = await response.json();
      if (data.url && data.params) {
        // Store purchase info for success page locally as backup
        localStorage.setItem('last_purchase', JSON.stringify({
          name: product.name,
          category: product.category,
          downloadUrl: product.stlFilePath || ''
        }));

        // CMI requires a form POST redirect
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.url;
        
        Object.entries(data.params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        throw new Error(data.error || 'Failed to initiate CMI payment');
      }
    } catch (error) {
      console.error('CMI Error:', error);
      alert('❌ Erreur de paiement CMI');
    } finally {
      setIsCMILoading(false);
    }
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal Error:', error);
    alert('❌ Erreur de paiement');
  };

  const amountStr = product.price.replace(/[^0-9.]/g, '') || "20.00";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-white rounded-[2.5rem] overflow-hidden border border-noor-bronze/5 hover:shadow-2xl hover:shadow-noor-bronze/5 transition-all duration-700 relative"
    >
      {isAdmin && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button 
            onClick={() => onEdit(product)}
            className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-noor-bronze hover:text-noor-gold transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-noor-bronze hover:text-red-500 transition-colors"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="aspect-square overflow-hidden relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif text-noor-bronze">{product.name}</h3>
            <div className="flex flex-wrap items-center gap-2">
               <span className="text-[10px] font-bold tracking-widest text-noor-gold uppercase">
                {product.category === 'stl' ? 'Fichier STL' : 'Tableau Physique'}
               </span>
               {product.dimensions && (
                 <span className="text-[10px] text-noor-bronze/40 font-medium italic">
                  ({product.dimensions})
                 </span>
               )}
               {product.stlFilePath && <FileCheck className="w-3 h-3 text-green-500" title="Fichier lié" />}
            </div>
          </div>
          <span className="text-xl font-bold text-noor-bronze">{product.price}</span>
        </div>

        <p className="text-noor-bronze/60 text-sm font-light leading-relaxed line-clamp-3">
          {product.description}
        </p>

        {!showPaymentOptions ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPaymentOptions(true)}
            className="w-full flex items-center justify-center gap-3 py-5 bg-noor-bronze text-white rounded-2xl text-xs font-bold tracking-widest uppercase shadow-lg shadow-noor-bronze/10 hover:bg-noor-gold transition-colors relative overflow-hidden"
          >
            <ShoppingCart className="w-4 h-4" />
            {product.category === 'stl' ? 'Acheter STL' : 'Acheter l’Oeuvre'}
          </motion.button>
        ) : (
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStripeCheckout}
              disabled={isStripeLoading || isCMILoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#635bff] text-white rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {isStripeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Payer par Carte (Stripe)
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCMICheckout}
              disabled={isStripeLoading || isCMILoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {isCMILoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Carte Marocaine (CMI)
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[8px] uppercase tracking-tighter"><span className="px-2 bg-white text-gray-300 font-bold">Ou via PayPal</span></div>
            </div>

            <PayPalButton 
              amount={amountStr}
              itemName={product.name}
              onSuccess={handlePayPalSuccess}
              onError={handlePayPalError}
              onCancel={() => setShowPaymentOptions(false)}
            />
            
            <button 
              onClick={() => setShowPaymentOptions(false)}
              className="w-full text-[10px] font-bold text-noor-bronze/40 uppercase tracking-widest hover:text-noor-bronze transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-2 h-2" /> Retour
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-4 text-[9px] text-noor-bronze/30 font-medium tracking-tighter uppercase">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Paiement Sécurisé SSL</span>
          <span>•</span>
          <span>Visa / Mastercard / PayPal</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductCatalogue({ isAdmin }: StripeCatalogueProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map Supabase snake_case to Product camelCase
        const mappedProducts: Product[] = data.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category as any,
          imageUrl: p.image_url,
          dimensions: p.dimensions,
          instagramUrl: p.instagram_url,
          description: p.description,
          stripePriceId: p.stripe_price_id,
          stlFilePath: p.stl_file_path
        }));
        setProducts(mappedProducts);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      // Fallback to initial constants if Supabase is empty or failing
      const saved = localStorage.getItem('noor-stripe-products');
      const initial = saved ? JSON.parse(saved) : PRODUCTS.filter(p => p.category === 'stl' || p.category === 'tableau');
      setProducts(initial);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uploadMessage) {
      const timer = setTimeout(() => setUploadMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadMessage]);

  const handleBuyNow = (product: Product) => {
    const numericPrice = product.price.replace(/[^0-9.]/g, '');
    const businessEmail = product.stripePriceId || 'karimrachidi171986@gmail.com'; 
    const origin = window.location.origin;
    
    // Exact PayPal Business parameters requested
    const paypalParams = {
      cmd: '_xclick',
      business: businessEmail,
      item_name: product.name,
      amount: numericPrice,
      currency_code: 'EUR',
      return: `${origin}/success.html`,
      cancel_return: `${origin}/cancel.html`,
      notify_url: `${origin}/api/ipn_listener`, 
      charset: 'utf-8',
      // Enhancement parameters to show both "Connect" and "Pay by Card" options
      solution_type: 'Sole', 
      landing_page: 'Billing',
      lc: 'FR',
      no_note: '1',
      no_shipping: product.category === 'stl' ? '1' : '2'
    };

    // Constructing the real PayPal Business form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.paypal.com/cgi-bin/webscr';
    form.target = '_blank'; 
    
    Object.entries(paypalParams).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    
    // Store product info for the success page to read after redirect
    // Use localStorage instead of sessionStorage because PayPal return opens in a different session/tab context
    localStorage.setItem('last_purchase', JSON.stringify({
      name: product.name,
      category: product.category,
      downloadUrl: (product.category === 'stl' && product.name.toLowerCase().includes('aurora')) ? '/files/aurora.stl' : (product.stlFilePath || '')
    }));

    form.submit();
    document.body.removeChild(form);
  };

  const handleSTLUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('products')
        .upload(`files/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);
      
      if (publicUrl) {
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, stlFilePath: publicUrl });
        } else {
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, stlFilePath: publicUrl } : p));
        }
      }
    } catch (err) {
      console.error('STL Upload failed:', err);
      alert('Échec de l\'upload du fichier STL sur Supabase');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('products')
        .upload(`images/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      if (publicUrl && editingProduct) {
        setEditingProduct({ ...editingProduct, imageUrl: publicUrl });
        setUploadMessage({ text: 'Image uploadée sur Supabase ✅', type: 'success' });
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadMessage({ text: 'Échec de l\'upload de l\'image sur Supabase', type: 'error' });
    } finally {
      setUploadProgress(false);
    }
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: 0, // Placeholder for auto-increment
      name: 'Nouveau Produit',
      price: '0.00 €',
      category: 'tableau',
      imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
      instagramUrl: 'https://www.instagram.com/noor3dart/',
      description: 'Description détaillée de l\'œuvre...',
      stripePriceId: '',
      dimensions: '',
    };
    setEditingProduct(newProduct);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const sanitizedProduct = {
        name: sanitize(editingProduct.name),
        description: sanitize(editingProduct.description),
        price: sanitize(editingProduct.price),
        category: editingProduct.category,
        image_url: editingProduct.imageUrl, // Map to snake_case for DB
        dimensions: editingProduct.dimensions ? sanitize(editingProduct.dimensions) : '',
        instagram_url: editingProduct.instagramUrl,
        stripe_price_id: sanitize(editingProduct.stripePriceId || ''),
        stl_file_path: editingProduct.stlFilePath || null,
      };

      try {
        let response;
        if (editingProduct.id === 0) {
          // Insert new
          response = await supabase.from('products').insert([sanitizedProduct]).select();
        } else {
          // Update existing
          response = await supabase.from('products').update(sanitizedProduct).eq('id', editingProduct.id).select();
        }

        if (response.error) throw response.error;

        await fetchProducts(); // Refresh list
        setEditingProduct(null);
      } catch (err) {
        console.error('Error saving product:', err);
        alert('Erreur lors de l\'enregistrement sur Supabase');
      }
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Supprimer ce produit définitivement de Supabase ?')) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Erreur lors de la suppression sur Supabase');
      }
    }
  };

  return (
    <section id="product-catalogue" className="py-24 px-6 max-w-7xl mx-auto space-y-32">
      {/* SECTION 1: DIGITAL STL MODELS */}
      <div id="digital-collection" className="space-y-16">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 text-noor-gold uppercase tracking-[0.6em] text-[10px] font-bold">
            <div className="h-px w-8 bg-noor-gold/30" />
            <span>Digital Collection</span>
            <div className="h-px w-8 bg-noor-gold/30" />
          </div>
          <h2 className="text-5xl md:text-6xl font-serif text-noor-bronze italic leading-tight">Modèles STL Premium</h2>
          <p className="text-noor-bronze/60 font-light max-w-2xl mx-auto text-lg leading-relaxed">
            Fichiers haute résolution optimisés pour l'impression 3D et la CNC. 
            Une fusion de précision géométrique et d'art mural, disponible en accès immédiat.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-noor-gold animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {products.filter(p => p.category === 'stl').map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isAdmin={isAdmin} 
                  onBuy={handleBuyNow} 
                  onEdit={(p) => setEditingProduct(p)}
                  onDelete={handleDelete}
                  loadingId={loadingId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* SECTION 2: PHYSICAL ARTWORKS */}
      <div id="physical-collection" className="space-y-16">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 text-noor-gold uppercase tracking-[0.6em] text-[10px] font-bold">
            <div className="h-px w-8 bg-noor-gold/30" />
            <span>Physical Collection</span>
            <div className="h-px w-8 bg-noor-gold/30" />
          </div>
          <h2 className="text-5xl md:text-6xl font-serif text-noor-bronze italic leading-tight">Œuvres & Tableaux 3D</h2>
          <p className="text-noor-bronze/60 font-light max-w-2xl mx-auto text-lg leading-relaxed">
            Pièces artisanales uniques sculptées à la main dans notre atelier de Marrakech. 
            Chaque œuvre est un dialogue entre ombre et lumière, livrée avec son certificat d'authenticité.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-noor-gold animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {products.filter(p => p.category === 'tableau').map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isAdmin={isAdmin} 
                  onBuy={handleBuyNow} 
                  onEdit={(p) => setEditingProduct(p)}
                  onDelete={handleDelete}
                  loadingId={loadingId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex justify-center pt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-8 py-4 bg-noor-gold text-white rounded-full text-[10px] font-bold tracking-widest uppercase shadow-2xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter un nouveau produit
          </motion.button>
        </div>
      )}


      {/* Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-noor-bronze/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-8 right-8 text-noor-bronze/40 hover:text-noor-bronze"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-serif text-noor-bronze mb-10 italic">Configurer le produit</h3>
              
              <form 
                onSubmit={handleEditSave} 
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                enctype="multipart/form-data"
                data-netlify="true"
                name="product-form"
              >
                <input type="hidden" name="form-name" value="product-form" />
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Nom du produit</label>
                  <input
                    type="text"
                    name="name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze font-serif italic text-lg"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Description</label>
                  <textarea
                    name="description"
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze text-sm h-32 resize-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Prix (Affichage)</label>
                  <input
                    type="text"
                    name="price"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Email PayPal Business (Récepteur)</label>
                  <input
                    type="text"
                    name="stripePriceId"
                    value={editingProduct.stripePriceId || 'karimrachidi171986@gmail.com'}
                    onChange={(e) => setEditingProduct({...editingProduct, stripePriceId: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze text-sm"
                    placeholder="ex: ton-email-paypal@example.com"
                    required
                  />
                  <p className="text-[9px] text-noor-bronze/30 mt-2 italic">L'adresse email de votre compte PayPal Business.</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Image du produit</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-6 p-4 border border-noor-bronze/10 rounded-2xl bg-stone-50">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white shadow-sm">
                        <img 
                          src={editingProduct.imageUrl} 
                          alt="Previsualisation" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800';
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={editingProduct.imageUrl}
                          readOnly
                          className="w-full px-4 py-2 rounded-xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze text-[10px] bg-white/50"
                          placeholder="Le lien de l'image s'affichera ici"
                        />
                        <div className="relative">
                          <input 
                            type="file" 
                            name="image"
                            accept="image/png, image/jpeg"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="image-upload"
                            required={!editingProduct.imageUrl}
                          />
                          <label 
                            htmlFor="image-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-noor-bronze text-white rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-noor-gold transition-all cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            {uploadProgress ? 'Téléchargement...' : 'Télécharger (JPG/PNG)'}
                          </label>
                        </div>
                        {uploadMessage && (
                          <motion.p 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-[11px] font-bold ${uploadMessage.type === 'success' ? 'text-green-600' : 'text-red-500'} flex items-center gap-1`}
                          >
                            {uploadMessage.text}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Catégorie</label>
                  <select
                    name="category"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value as any})}
                    className="w-full px-6 py-4 rounded-2xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze bg-transparent"
                  >
                    <option value="stl">Fichier STL</option>
                    <option value="tableau">Tableau Physique</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Dimensions (Optionnel)</label>
                  <input
                    type="text"
                    name="dimensions"
                    value={editingProduct.dimensions || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, dimensions: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-noor-bronze/10 focus:border-noor-gold outline-none text-noor-bronze"
                    placeholder="ex: 100 x 100 cm"
                  />
                </div>

                {editingProduct.category === 'stl' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-noor-gold mb-3">Fichier STL (Local)</label>
                    <div className="flex flex-col gap-4">
                    <div className="p-6 border-2 border-dashed border-noor-bronze/10 rounded-2xl bg-stone-50 text-center">
                      {editingProduct.stlFilePath ? (
                        <div className="flex items-center justify-center gap-3 text-noor-bronze">
                          <FileCheck className="w-5 h-5 text-green-500" />
                          <span className="text-xs font-medium truncate max-w-[200px]">{editingProduct.stlFilePath}</span>
                          <button 
                            type="button"
                            onClick={() => setEditingProduct({...editingProduct, stlFilePath: ''})}
                            className="text-[10px] text-red-400 hover:text-red-600 underline font-bold"
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-noor-bronze/20" />
                            <p className="text-xs text-noor-bronze/40 italic">Téléversez le fichier .STL depuis votre PC</p>
                          </div>
                          <input 
                            type="file" 
                            accept=".stl"
                            onChange={(e) => handleSTLUpload(e, editingProduct.id)}
                            className="w-full text-xs file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-noor-bronze file:text-white hover:file:bg-noor-gold transition-all"
                          />
                        </div>
                      )}
                      {uploadProgress && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-noor-gold animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-bold tracking-widest">Envoi en cours...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

                <div className="col-span-2">
                   <button
                    type="submit"
                    className="w-full py-5 bg-noor-bronze text-white rounded-[2rem] text-xs font-bold tracking-[0.2em] uppercase hover:bg-noor-gold transition-all shadow-xl"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
