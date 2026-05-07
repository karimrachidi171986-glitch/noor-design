import { motion } from 'motion/react';

interface HeroProps {
  bgImage?: string | null;
  logo?: string | null;
}

export default function Hero({ bgImage, logo }: HeroProps) {
  const fullTitle = "Noor Design – Art de Relief à Marrakech";

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.1 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 120,
      },
    },
    hidden: {
      opacity: 0,
      y: 10,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 120,
      },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20 overflow-hidden">
      {/* Top Left Logo in Hero as requested */}
      {logo && (
        <motion.div 
          initial={{ opacity: 0, x: -40, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-12 left-12 hidden lg:block z-20"
        >
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white group cursor-pointer transition-transform duration-700 hover:scale-110">
            <img src={logo} alt="Noor Logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </motion.div>
      )}

      <div className="max-w-6xl text-center z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center mb-12"
        >
          {/* Main Animated Title */}
          <h1 className="text-4xl md:text-7xl lg:text-9xl font-serif text-noor-bronze leading-[1.2] mb-8 tracking-tighter flex flex-wrap justify-center overflow-hidden max-w-5xl">
            {fullTitle.split("").map((letter, index) => (
              <motion.span variants={child} key={index}>
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <a
            href="#catalogue"
            className="px-10 py-4 bg-noor-bronze text-white rounded-full text-sm font-medium hover:bg-noor-gold transition-all duration-500 shadow-xl shadow-noor-bronze/10 hover:-translate-y-1"
          >
            Découvrir la Collection
          </a>
          <a
            href="#about"
            className="px-10 py-4 border border-noor-bronze/20 text-noor-bronze rounded-full text-sm font-medium hover:border-noor-bronze transition-all duration-500"
          >
            Notre Histoire
          </a>
        </motion.div>
      </div>

      {/* Decorative vertical lines */}
      <div className="absolute left-10 bottom-0 h-32 w-px bg-noor-gold/30 hidden lg:block" />
      <div className="absolute right-10 bottom-0 h-32 w-px bg-noor-gold/30 hidden lg:block" />
    </section>
  );
}
