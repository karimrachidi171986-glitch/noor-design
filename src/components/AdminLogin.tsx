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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.token);
        onLoginSuccess();
      } else {
        setError(data.error || 'Identifiants invalides');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
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
