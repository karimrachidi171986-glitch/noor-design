import { Instagram, Facebook, MapPin, Phone } from 'lucide-react';
import { ReactNode } from 'react';

interface FooterProps {
  currentLogo: string;
}

export default function Footer({ currentLogo }: FooterProps) {
  return (
    <footer id="contact" className="bg-noor-bronze text-noor-cream py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-8">
            <a href="/" className="flex items-center transition-transform hover:scale-105 active:scale-95 group">
              <div className="h-20 w-auto bg-white/10 rounded-lg p-2 backdrop-blur-sm group-hover:bg-white transition-colors duration-500">
                <img 
                  src={currentLogo} 
                  alt="Noor Design Logo" 
                  className="h-full w-auto object-contain brightness-110"
                  referrerPolicy="no-referrer"
                />
              </div>
            </a>
            <p className="text-noor-cream/40 font-light leading-relaxed text-sm">
              L'excellence du relief 3D et du design minimaliste. Basé à Marrakech, 
              nous transformons les intérieurs en galeries de texture.
            </p>
            <div className="flex gap-4">
              <SocialIcon href="https://www.instagram.com/noor3dart/" icon={<Instagram className="w-4 h-4" />} />
              <SocialIcon href="https://web.facebook.com/profile.php?id=61588096002695" icon={<Facebook className="w-4 h-4" />} />
            </div>
          </div>

          <div>
            <h4 className="text-white font-serif text-xl mb-6">Navigation</h4>
            <ul className="space-y-4">
              <FooterLink href="#">Accueil</FooterLink>
              <FooterLink href="#catalogue">Collection 3D</FooterLink>
              <FooterLink href="#about">Notre Histoire</FooterLink>
              <FooterLink href="#contact">Contactez-nous</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif text-xl mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 text-noor-gold shrink-0 mt-0.5" />
                <span className="text-noor-cream/70 font-light group-hover:text-white transition-colors cursor-default">
                  Sidi Ghanem, Zone Industrielle<br />Marrakech, Maroc
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <Phone className="w-5 h-5 text-noor-gold shrink-0" />
                <a 
                  href="https://wa.me/212725963350" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-noor-cream/70 font-light group-hover:text-white transition-colors"
                >
                  +212 7 25 96 33 50
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif text-xl mb-6">Horaires</h4>
            <ul className="space-y-2 text-noor-cream/70 font-light">
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span>Lun - Ven</span>
                <span>09:00 - 18:30</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span>Samedi</span>
                <span>09:00 - 13:00</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span>Dimanche</span>
                <span className="italic">Fermé</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-noor-cream/40">
            © 2024 Noor DESIGN. Tous droits réservés.
          </p>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-noor-cream/40">
            Artisanat de Luxe — Marrakech
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <a
        href={href}
        className="text-noor-cream/60 hover:text-noor-gold transition-colors font-light relative group"
      >
        {children}
      </a>
    </li>
  );
}

function SocialIcon({ icon, href = "#" }: { icon: ReactNode; href?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-noor-cream/60 hover:text-white hover:border-noor-gold hover:bg-noor-gold/10 transition-all duration-300"
    >
      {icon}
    </a>
  );
}
