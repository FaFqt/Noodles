import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Splash Screen
    play: 'JOUER',
    tagline: 'Cuisine. Village. Aventure.',
    powered: 'Propulsé par Starknet × Cartridge',
    
    // Village
    openRestaurant: 'OUVRIR!',
    restaurant: 'Restaurant',
    market: 'Marché',
    greenhouse: 'Serre',
    library: 'Librairie',
    friends: 'Amis',
    construction: 'Construction',

    // Restaurant
    cookRestaurant: 'CUISINER',

    // Game Header
    level: 'Niveau',
    
    // Client Orders
    ordersWaiting: 'commandes en attente',
    orders: 'Commandes',
    
    // Cooking Phase
    selectIngredients: 'Sélectionnez les ingrédients',
    cooking: 'Cuisson',
    serve: 'Servir',
    start: 'Démarrer',
    stir: 'Remuer',
    slice: 'Trancher',
    perfect: 'Parfait !',
    good: 'Bien !',
    
    // Rewards
    orderComplete: 'Commande terminée !',
    quality: 'Qualité',
    
    // Menu
    event: 'Événement',
    shop: 'Boutique',
    profile: 'Profil',
    home: 'Accueil',
    
    // Clients
    student: 'Étudiant',
    ninjacat: 'Chat Ninja',
    foodcritic: 'Critique Food',
    samurai: 'Samouraï',
    geisha: 'Geisha',
    panda: 'Panda',
    fox: 'Renard',
    rabbit: 'Lapin',
    chef: 'Chef',
    tourist: 'Touriste',
    
    // Recipes
    'ramen-miso': 'Ramen Miso',
    'ramen-veggie': 'Ramen Végé',
    'ramen-tonkotsu': 'Ramen Tonkotsu',
    'ramen-spicy': 'Ramen Épicé',
    'sushi-salmon': 'Sushi Saumon',
    'california-roll': 'California Roll',
  },
  en: {
    // Splash Screen
    play: 'PLAY',
    tagline: 'Cook. Village. Adventure.',
    powered: 'Powered by Starknet × Cartridge',
    
    // Village
    openRestaurant: 'OPEN!',
    restaurant: 'Restaurant',
    market: 'Market',
    greenhouse: 'Greenhouse',
    library: 'Library',
    friends: 'Friends',
    construction: 'Construction',

    // Restaurant
    cookRestaurant: 'COOK',
    
    // Game Header
    level: 'Level',
    
    // Client Orders
    ordersWaiting: 'orders waiting',
    orders: 'Orders',
    
    // Cooking Phase
    selectIngredients: 'Select ingredients',
    cooking: 'Cooking',
    serve: 'Serve',
    start: 'Start',
    stir: 'Stir',
    slice: 'Slice',
    perfect: 'Perfect!',
    good: 'Good!',
    
    // Rewards
    orderComplete: 'Order complete!',
    quality: 'Quality',
    
    // Menu
    event: 'Event',
    shop: 'Shop',
    profile: 'Profile',
    home: 'Home',
    
    // Clients
    student: 'Student',
    ninjacat: 'Ninja Cat',
    foodcritic: 'Food Critic',
    samurai: 'Samurai',
    geisha: 'Geisha',
    panda: 'Panda',
    fox: 'Fox',
    rabbit: 'Rabbit',
    chef: 'Chef',
    tourist: 'Tourist',
    
    // Recipes
    'ramen-miso': 'Miso Ramen',
    'ramen-veggie': 'Veggie Ramen',
    'ramen-tonkotsu': 'Tonkotsu Ramen',
    'ramen-spicy': 'Spicy Ramen',
    'sushi-salmon': 'Salmon Sushi',
    'california-roll': 'California Roll',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['fr']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
