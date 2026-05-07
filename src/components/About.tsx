import { motion } from 'motion/react';

export default function About() {
  return (
    <section id="about" className="pt-16 pb-32 px-6 bg-noor-sand/20 overflow-hidden text-center">
      <div className="max-w-4xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <span className="text-[10px] font-bold tracking-[0.6em] text-noor-gold uppercase block">
            Notre Philosophie
          </span>
          <h2 className="text-6xl md:text-8xl font-serif text-noor-bronze leading-tight">
            L'Élégance du Relief <br /> 
            <span className="italic font-normal">Façonnée à Marrakech</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-10 text-noor-bronze/70 text-xl font-light leading-relaxed font-serif italic"
        >
          <p>
            Depuis notre atelier au cœur de la Ville Rouge, nous sculptons l'espace. 
            Noor Design fusionne l'artisanat pur et le minimalisme contemporain 
            pour créer des textures 3D qui donnent vie à vos murs.
          </p>
          <p>
            Chaque pièce est une exploration du relief, où la lumière devient un matériau 
            à part entière, révélant des ombres subtiles et des détails d'une finesse absolue.
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.4 }}
           className="pt-12 flex justify-center gap-20 border-t border-noor-bronze/10"
        >
             <div className="text-center">
               <p className="text-4xl font-serif text-noor-bronze mb-2">Artisanal</p>
               <p className="text-[10px] text-noor-gold font-bold tracking-widest uppercase">Pureté</p>
             </div>
             <div className="text-center">
               <p className="text-4xl font-serif text-noor-bronze mb-2">Moderniste</p>
               <p className="text-[10px] text-noor-gold font-bold tracking-widest uppercase">Perspective</p>
             </div>
        </motion.div>
      </div>
    </section>
  );
}
