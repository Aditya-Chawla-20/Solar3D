import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, User, Info } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="Space background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="block">Explore Our</span>
              <span className="block text-yellow-400">Solar System</span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-gray-300">
              An interactive 3D journey through our cosmic neighborhood. Discover planets, moons, and celestial wonders.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                to="/solar-system"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-yellow-400 hover:bg-yellow-500 md:py-4 md:text-lg md:px-10"
              >
                Start Exploring
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Features
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-center mb-4">
              <Globe className="h-12 w-12 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">3D Visualization</h3>
            <p className="text-gray-300 text-center">
              Explore a realistic 3D model of our solar system with accurate orbits and planetary details.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-center mb-4">
              <Info className="h-12 w-12 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Planetary Information</h3>
            <p className="text-gray-300 text-center">
              Learn fascinating facts about each planet, including size, composition, and unique features.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex justify-center mb-4">
              <User className="h-12 w-12 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">User Profiles</h3>
            <p className="text-gray-300 text-center">
              Create an account to save your favorite planets and track your exploration journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;