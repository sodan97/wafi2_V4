
import React from 'react';

const HeroStatic: React.FC = () => {
  return (
    <div className="relative w-full h-[30vh] rounded-lg overflow-hidden shadow-2xl mb-12">
      <img 
        src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2574&auto=format&fit=crop" 
        alt="Wafi - Produits exclusifs" 
        className="w-full h-full object-cover" 
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-center p-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
          Bienvenue chez Wafi
        </h1>
        <p className="text-lg md:text-xl text-gray-200" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
          Découvrez nos produits exclusifs et affirmez votre style
        </p>
      </div>
    </div>
  );
};

export default HeroStatic;
