import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Download, CheckCircle, Loader2, Home, AlertCircle } from 'lucide-react';

export default function CheckoutSuccess() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [productInfo, setProductInfo] = useState<{name: string, downloadUrl?: string, category?: string} | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const productId = query.get('productId');
    const name = query.get('name');
    const category = query.get('category');
    const downloadUrl = query.get('downloadUrl');

    // Try URL params first, then session storage
    const savedPurchase = sessionStorage.getItem('last_purchase');
    
    if (productId && name) {
      setProductInfo({
        name: decodeURIComponent(name),
        downloadUrl: downloadUrl ? decodeURIComponent(downloadUrl) : undefined,
        category: category || 'tableau'
      });
      setStatus('success');
    } else if (savedPurchase) {
      try {
        const info = JSON.parse(savedPurchase);
        setProductInfo(info);
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    } else {
      setStatus('error');
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
        <Loader2 className="w-12 h-12 text-noor-gold animate-spin" />
        <p className="text-noor-bronze font-serif italic text-lg">Vérification de votre paiement...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-8">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-serif text-noor-bronze mb-4">Oups ! Une erreur est survenue</h1>
        <p className="text-noor-bronze/60 max-w-md mb-12">
          Nous n'avons pas pu valider votre session de paiement. Si vous avez été débité, 
          veuillez nous contacter via WhatsApp avec votre reçu.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-noor-bronze text-white rounded-2xl text-xs font-bold tracking-widest uppercase hover:bg-noor-gold transition-colors"
        >
          <Home className="w-4 h-4" />
          Retour à l'accueil
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9f9] text-center p-[50px] font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <h2 className="text-[#333] text-3xl font-bold mb-4">✅ Merci pour votre achat !</h2>
        
        {productInfo?.category === 'stl' ? (
          <div className="space-y-6">
            <p className="text-lg text-gray-700">Votre fichier est prêt à être téléchargé :</p>
            <motion.a
              whileHover={{ scale: 1.05, backgroundColor: '#005c99' }}
              whileTap={{ scale: 0.95 }}
              href={productInfo.downloadUrl?.startsWith('http') ? productInfo.downloadUrl : `${window.location.origin}${productInfo.downloadUrl}`}
              download
              className="download-link inline-block mt-5 px-5 py-3 bg-[#0070ba] text-white no-underline rounded-md font-bold transition-colors"
            >
              Télécharger {productInfo.name}
            </motion.a>
            <p className="mt-8">
              <a href="/index.html" className="text-[#0070ba] hover:underline">Retour à la boutique</a>
            </p>
          </div>
        ) : (
          <div className="space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 mt-8">
            <div className="space-y-2">
              <p className="text-gray-600 text-lg">Confirmation de commande pour :</p>
              <h3 className="text-2xl font-serif text-noor-bronze italic">"{productInfo?.name}"</h3>
            </div>
            
            <div className="h-px w-12 bg-noor-gold mx-auto" />
            
            <div className="text-left space-y-6 max-w-md mx-auto">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-noor-gold text-center">Instructions de Livraison</h4>
              <div className="space-y-4">
                {[
                  { title: "Préparation", desc: "Expertise de l'œuvre et certificat d'authenticité." },
                  { title: "Emballage", desc: "Haute protection sur-mesure pour préserver les reliefs." },
                  { title: "Expédition", desc: "Livraison via transporteur spécialisé en art sous 7-10 jours." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <span className="w-6 h-6 rounded-full bg-noor-gold/10 text-noor-gold flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                    <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">{step.title} :</span> {step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Service Client</p>
                <p className="text-sm font-serif italic text-noor-bronze">+212 6 61 23 45 67 (WhatsApp)</p>
              </div>
              <a href="/index.html" className="text-[#0070ba] hover:underline text-sm font-bold">Retour à la boutique</a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
