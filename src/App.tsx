/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Footer from './components/Footer';
import ProductCatalogue from './components/StripeCatalogue';
import MediaGallery from './components/MediaGallery';
import CheckoutSuccess from './components/CheckoutSuccess';
import CheckoutCancel from './components/CheckoutCancel';
import AdminLogin from './components/AdminLogin';
import { verifyAdmin, removeAuthToken } from './lib/auth';
import { motion, useScroll, useSpring } from 'motion/react';
import { useState, useEffect } from 'react';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'success' | 'cancel' | 'admin' | 'dashboard'>('home');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await verifyAdmin();
      setIsAdmin(isAuth);
      
      const path = window.location.pathname;
      if (isAuth && (path === '/admin' || path === '/admin-login')) {
        window.location.href = '/admin-dashboard';
      }
      
      setIsLoadingAuth(false);
    };

    const path = window.location.pathname;
    if (path === '/success') {
      setCurrentPage('success');
      setIsLoadingAuth(false);
    } else if (path === '/cancel') {
      setCurrentPage('cancel');
      setIsLoadingAuth(false);
    } else if (path === '/admin') {
      setCurrentPage('admin');
      checkAuth();
    } else if (path === '/admin-dashboard') {
      setCurrentPage('dashboard');
      checkAuth();
    } else {
      setCurrentPage('home');
      checkAuth();
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setCurrentPage('dashboard');
    window.location.href = '/admin-dashboard';
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAdmin(false);
    window.location.href = '/';
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [heroBg, setHeroBg] = useState<string | null>(() => {
    return localStorage.getItem('noor-hero-bg');
  });

  const handleBgChange = (newBg: string) => {
    setHeroBg(newBg);
    localStorage.setItem('noor-hero-bg', newBg);
  };

  const [logo, setLogo] = useState<string>(() => {
    return localStorage.getItem('noor-logo') || "https://instagram.fcmn1-1.fna.fbcdn.net/v/t51.82787-19/654232359_17905579212380582_7318363194633073419_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby43MjAuZXhwZXJpbWVudGFsIn0&_nc_ht=instagram.fcmn1-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2gE3vI0rC-LMYT9iWa83dccRk7ho1hrdETHZAp8YxT4cioVjDZ40byA4I4St0MsW39Y&_nc_ohc=kNA54N6cOs0Q7kNvwHLMs0b&_nc_gid=tIiNBa-UO5jIEvhrXc4lJQ&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_Af7BSRtoRPlthSuhi8sCJeftQZrXOEL2WkGvMChJGNG1_Q&oe=69F98E67&_nc_sid=7a9f4b";
  });

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
        <div className="w-12 h-12 border-4 border-noor-gold/20 border-t-noor-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (currentPage === 'success') {
    return <CheckoutSuccess />;
  }

  if (currentPage === 'cancel') {
    return <CheckoutCancel />;
  }

  if (currentPage === 'admin' && !isAdmin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'dashboard' && !isAdmin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const handleSaveLogo = (newLogo: string) => {
    setLogo(newLogo);
    localStorage.setItem('noor-logo', newLogo);
  };

  const defaultBg = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Global Background Image with Overlay */}
      <div className="fixed inset-0 -z-10">
        <img 
          src={heroBg || defaultBg} 
          alt="Background" 
          className="w-full h-full object-cover opacity-40 transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-white/30" />
      </div>

      {isAdmin && (
        <div className="fixed top-4 right-4 z-[100]">
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-noor-bronze text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-noor-gold transition-all"
          >
            Déconnexion Admin
          </button>
        </div>
      )}

      {/* Custom Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-noor-gold z-[60] origin-left"
        style={{ scaleX }}
      />

      <Header 
        onBgChange={handleBgChange} 
        currentLogo={logo} 
        onLogoChange={handleSaveLogo}
        isAdmin={isAdmin}
        onAdminToggle={() => {
          if (!isAdmin) {
            window.location.href = '/admin-dashboard';
          } else {
            handleLogout();
          }
        }}
      />
      
      <main className="space-y-32">
        <Hero bgImage={heroBg} logo={logo} />
        
        {/* Decorative Divider */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px w-full bg-noor-bronze/10" />
        </div>

        <div id="catalogue">
          <ProductCatalogue isAdmin={isAdmin} />
        </div>

        <div id="galerie">
          <MediaGallery />
        </div>
        
        <div id="about">
          <About />
        </div>
        
        {/* Instagram/Showcase Section (Quick filler) */}
        <section className="py-32 px-6 max-w-7xl mx-auto text-center border-t border-noor-bronze/5">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-3xl font-serif text-noor-bronze">Inspiration Quotidienne</h2>
            <p className="text-noor-bronze/60 font-light">
              Suivez-nous sur les réseaux pour découvrir nos dernières installations chez nos clients 
              et nos nouveaux designs exclusifs.
            </p>
            <div className="pt-4">
              <a 
                href="https://www.instagram.com/noor3dart/" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-noor-gold font-bold tracking-widest uppercase text-xs border-b border-noor-gold pb-1 hover:text-noor-bronze hover:border-noor-bronze transition-all"
              >
                Suivre sur Instagram
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer currentLogo={logo} />
    </div>
  );
}
