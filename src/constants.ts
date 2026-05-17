export interface Product {
  id: string | number;
  name: string;
  price: string;
  category: 'panel' | 'art' | 'stl' | 'tableau';
  imageUrl: string;
  images?: string[];
  dimensions?: string; // Dimensions for physical artworks
  instagramUrl: string;
  description: string;
  stripePriceId?: string; // Optional price ID for Stripe Checkout
  stlFilePath?: string;   // Path to the local STL file for digital delivery
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Tableau Géométrique Minimal',
    price: '450 DH / m²',
    category: 'panel',
    imageUrl: 'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800'
    ],
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Structure géométrique répétitive pour un effet de profondeur architecturale.',
  },
  {
    id: 'p2',
    name: 'Tableau Texture Bois 3D',
    price: '580 DH / m²',
    category: 'panel',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
    ],
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Chaleur naturelle du bois alliée à une sculpture contemporaine en relief.',
  },
  {
    id: 'p3',
    name: 'Relief Mural Vagues',
    price: '420 DH / m²',
    category: 'panel',
    imageUrl: 'https://images.unsplash.com/photo-1544450610-ad597caaf270?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1544450610-ad597caaf270?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518005020251-58d83769c0d9?auto=format&fit=crop&q=80&w=800'
    ],
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Mouvement fluide capturé dans la matière, idéal pour une ambiance apaisante.',
  },
  {
    id: 'a1',
    name: 'Tableau Abstrait Plâtre',
    price: '1,200 DH',
    category: 'art',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Oeuvre unique en plâtre sculpté jouant avec les ombres portées.',
  },
  {
    id: 'a2',
    name: 'Art Mural Botanique 3D',
    price: '1,500 DH',
    category: 'art',
    imageUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Réinterprétation artistique de formes végétales pour un mur organique.',
  },
  {
    id: 'a3',
    name: 'Sculpture Murale Sable',
    price: '950 DH',
    category: 'art',
    imageUrl: 'https://images.unsplash.com/photo-1515405299443-fbd3bb044097?auto=format&fit=crop&q=80&w=800',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Texture minérale brute évoquant les paysages désertiques de Marrakech.',
  },
  {
    id: 'p4',
    name: 'Tableau Origami 3D',
    price: '490 DH / m²',
    category: 'panel',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Pliages et facettes créant un dynamisme visuel unique selon l\'éclairage.',
  },
  {
    id: 'a4',
    name: 'Tableau Floral Sculpté',
    price: '1,800 DH',
    category: 'art',
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Finesse florale sculptée avec une précision artisanale d\'exception.',
  },
  {
    id: 'stl1',
    name: 'Panneau Géométrique STL',
    price: '9.99 €',
    category: 'stl',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Fichier STL haute précision pour impression 3D ou fraisage CNC. Motif géométrique moderne.',
    stripePriceId: 'price_placeholder_1', // Replace with real Stripe Price ID
  },
  {
    id: 't1',
    name: 'Vibration Minérale',
    price: '349.00 €',
    category: 'tableau',
    imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
    dimensions: '100 x 100 cm',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Une œuvre physique unique explorant les textures organiques et les ombres portées.',
    stripePriceId: 'price_placeholder_tableau_1',
  },
  {
    id: 't2',
    name: 'Éclat Géométrique',
    price: '289.00 €',
    category: 'tableau',
    imageUrl: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&q=80&w=800',
    dimensions: '80 x 120 cm',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Composition abstraite mêlant relief 3D et finitions métalliques élégantes.',
    stripePriceId: 'price_placeholder_tableau_2',
  },
  {
    id: 't3',
    name: 'Dunes de Plâtre',
    price: '420.00 €',
    category: 'tableau',
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800',
    dimensions: '120 x 150 cm',
    instagramUrl: 'https://www.instagram.com/noor3dart/',
    description: 'Une grande pièce magistrale évoquant les vagues de sable du Sahara en relief profond.',
    stripePriceId: 'price_placeholder_tableau_3',
  },
];
