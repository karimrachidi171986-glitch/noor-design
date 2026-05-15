import React from 'react';
import { motion } from 'motion/react';

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9f9] text-center p-[50px] font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100"
      >
        <div className="text-4xl mb-6">⚠️</div>
        <h2 className="text-[#333] text-2xl font-bold mb-4">❌ Paiement annulé</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Le paiement a été annulé. Veuillez réessayer ou retourner à la boutique si vous avez changé d'avis.
        </p>
        <a 
          href="/" 
          className="inline-block px-8 py-4 bg-noor-bronze text-white rounded-2xl text-[10px] font-bold tracking-widest uppercase hover:bg-noor-gold transition-all shadow-lg"
        >
          Retourner à la boutique
        </a>
      </motion.div>
    </div>
  );
}
