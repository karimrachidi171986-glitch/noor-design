import React, { useState } from 'react';
import { motion } from 'motion/react';
import { setAuthToken } from '../lib/auth';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log("Tentative de connexion à /api/login...");
      // Using the Express API endpoint
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      console.log("Réponse reçue, statut:", response.status);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Réponse non-JSON reçue de l'API:", text.substring(0, 200));
        throw new Error(`API non configurée (Reçu: ${text.substring(0, 20) === '<!DOCTYPE html>' ? 'HTML' : 'Texte'})`);
      }

      if (response.ok) {
        setAuthToken(data.token);
        onLoginSuccess();
      } else {
        console.error("Échec de la connexion:", data.error || 'Statut ' + response.status);
        // Specifically check for 401 to show credentials error
        if (response.status === 401) {
          setError('❌ Identifiants invalides');
        } else {
          setError(data.error || `Erreur ${response.status}`);
        }
      }
    } catch (err: any) {
      console.error("Erreur détaillée lors de la connexion:", err);
      setError(err.message === "Réponse serveur non valide (pas du JSON)" 
        ? "Erreur de configuration serveur (API non trouvée)" 
        : 'Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-2xl font-serif italic text-noor-bronze mb-2">Accès Administrateur</h2>
          <p className="text-xs text-noor-bronze/40 uppercase tracking-widest font-bold">Sécurisé par JWT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-noor-gold uppercase mb-2 tracking-widest">Utilisateur</label>
            <input 
              type="text" 
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-noor-gold/10 transition-all font-sans"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-noor-gold uppercase mb-2 tracking-widest">Mot de passe</label>
            <input 
              type="password" 
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-noor-gold/10 transition-all font-sans"
              required
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-[10px] uppercase font-bold text-center tracking-wider"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-noor-bronze text-white rounded-2xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-noor-gold transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se Connecter'}
          </button>

          <div className="pt-6 text-center">
            <a href="/" className="text-[10px] text-gray-400 uppercase tracking-widest hover:text-noor-gold transition-colors font-bold">
              Retour au site
            </a>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
