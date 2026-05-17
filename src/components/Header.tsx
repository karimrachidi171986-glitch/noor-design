import { motion } from 'motion/react';
import { Image, MessageCircle, RefreshCw, Facebook, Instagram, Upload, Save, Shield, ShieldCheck } from 'lucide-react';
import React, { useState, useEffect, ReactNode, useRef } from 'react';

interface HeaderProps {
  onBgChange: (url: string) => void;
  onLogoChange: (url: string) => void;
  currentLogo: string;
  isAdmin: boolean;
  onAdminToggle: () => void;
}

export default function Header({ onBgChange, onLogoChange, currentLogo, isAdmin, onAdminToggle }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onBgChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLogo = () => {
    if (tempLogo && isAdmin) {
      onLogoChange(tempLogo);
      setTempLogo(null);
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-noor-cream/80 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              className="flex items-center transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className={`relative h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 border-noor-bronze/10 shadow-sm bg-white`}>
                <img 
                  src={tempLogo || currentLogo} 
                  alt="Noor Design Logo" 
                  className="h-full w-full object-cover brightness-100"
                  referrerPolicy="no-referrer"
                />
              </div>
            </a>
            
            {tempLogo && isAdmin && (
              <button
                onClick={saveLogo}
                className="flex items-center gap-2 px-4 py-2 bg-noor-gold text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-noor-bronze transition-all animate-pulse"
              >
                <Save className="w-3 h-3" />
                Sauvegarder
              </button>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <NavLink href="/">Accueil</NavLink>
            <NavLink href="#catalogue">Catalogue</NavLink>
            <NavLink href="#galerie">Galerie</NavLink>
            <NavLink href="#about">À propos</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </nav>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2 py-2 border-r border-noor-bronze/10 pr-6">
            {/* Admin Toggle */}
            <button
              onClick={onAdminToggle}
              className={`p-2.5 rounded-full transition-all shadow-sm border ${
                isAdmin 
                  ? 'bg-noor-gold text-white border-noor-gold shadow-noor-gold/20' 
                  : 'bg-white/50 backdrop-blur-sm text-noor-bronze border-noor-bronze/10'
              }`}
              title={isAdmin ? "Quitter le mode Admin" : "Mode Admin"}
            >
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            </button>

            {isAdmin && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-500">
                <input 
                  type="file" 
                  ref={bgInputRef} 
                  onChange={handleBgFileChange}
                  className="hidden" 
                  accept="image/*"
                />
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className="p-2.5 bg-white/50 backdrop-blur-sm text-noor-bronze rounded-full hover:bg-noor-bronze hover:text-white transition-all shadow-sm border border-noor-bronze/10"
                  title="Changer l'image de fond"
                >
                  <Image className="w-4 h-4" />
                </button>

                <input 
                  type="file" 
                  ref={logoInputRef} 
                  onChange={handleLogoFileChange}
                  className="hidden" 
                  accept="image/*"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="p-2.5 bg-white/50 backdrop-blur-sm text-noor-gold rounded-full hover:bg-noor-gold hover:text-white transition-all shadow-sm border border-noor-gold/20"
                  title="Changer le logo"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="hidden sm:flex gap-2">
              <a 
                href="https://www.instagram.com/noor3dart/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-noor-bronze/40 hover:text-noor-bronze transition-colors p-1"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://web.facebook.com/profile.php?id=61588096002695" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-noor-bronze/40 hover:text-noor-bronze transition-colors p-1"
                title="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="hidden sm:flex items-center justify-center p-2.5 border border-noor-bronze/10 text-noor-bronze rounded-full hover:bg-noor-bronze hover:text-white transition-all duration-300"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="https://wa.me/212725963350"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-emerald-700 transition-colors duration-500 shadow-lg shadow-emerald-600/10"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span className="hidden md:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </motion.header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-noor-bronze/70 hover:text-noor-bronze transition-colors relative group py-2"
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-px bg-noor-gold transition-all duration-500 group-hover:w-full" />
    </a>
  );
}
