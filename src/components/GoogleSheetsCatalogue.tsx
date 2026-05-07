import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RefreshCw, Layers, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { fetchGoogleSheetData, STLProduct } from '../services/googleSheetsService';

// Default public Google Sheet CSV export URL for demo or user to replace
// Note: User must publish their sheet to web as CSV and use that URL
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfX6f9j9X_XJz_X_X_X_X_X_X_X_X_X_X_X/pub?output=csv';

export default function GoogleSheetsCatalogue() {
  const [products, setProducts] = useState<STLProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      // In a real app, this URL should be in an env var or settings
      const url = localStorage.getItem('noor-sheet-url') || DEFAULT_SHEET_URL;
      const data = await fetchGoogleSheetData(url);
      setProducts(data);
    } catch (err) {
      setError("Impossible de charger le catalogue. Vérifiez l'URL de votre Google Sheet.");
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-noor-gold uppercase tracking-[0.3em] text-[10px] font-bold">
            <Layers className="w-3 h-3" />
            <span>Catalogue Digital</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-noor-bronze italic">Modèles STL & 3D</h2>
          <p className="text-noor-bronze/60 font-light max-w-lg">
            Découvrez nos créations numériques prêtes à l'emploi. Téléchargez nos fichiers STL 
            directement depuis notre bibliothèque synchronisée.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadData}
          disabled={isRefreshing}
          className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-noor-bronze/10 rounded-full text-noor-bronze font-medium text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Mise à jour...' : 'Actualiser le catalogue'}
        </motion.button>
      </header>

      {error && (
        <div className="mb-12 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Erreur de connexion</p>
            <p className="opacity-80">{error}</p>
            <p className="mt-2 text-xs">Assurez-vous de "Publier sur le Web" votre Google Sheet au format CSV.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-noor-gold animate-spin" />
          <p className="text-noor-bronze/40 font-serif italic">Chargement des modèles 3D...</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {products.length === 0 && !loading && !error && (
        <div className="text-center py-32 border-2 border-dashed border-noor-bronze/5 rounded-3xl">
          <p className="text-noor-bronze/40 italic font-serif">Aucun modèle trouvé dans votre feuille Google Sheet.</p>
        </div>
      )}
    </section>
  );
}

function ProductCard({ product }: { product: STLProduct }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-white/40 backdrop-blur-sm border border-noor-bronze/5 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-noor-bronze/5 transition-all duration-500"
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {product.category && (
          <div className="absolute top-4 right-4 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-noor-bronze shadow-sm">
            {product.category}
          </div>
        )}
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-serif text-noor-bronze">{product.name}</h3>
          <p className="text-noor-bronze/60 font-light text-sm line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between gap-4 border-t border-noor-bronze/5">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={product.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-noor-bronze text-white rounded-2xl text-xs font-bold tracking-widest uppercase hover:bg-noor-gold transition-colors shadow-lg shadow-noor-bronze/10"
          >
            <Download className="w-4 h-4" />
            Télécharger STL
          </motion.a>
          
          <motion.a
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={product.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center border border-noor-bronze/10 rounded-2xl text-noor-bronze hover:text-noor-gold transition-colors"
            title="Détails"
          >
            <ExternalLink className="w-4 h-4" />
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
