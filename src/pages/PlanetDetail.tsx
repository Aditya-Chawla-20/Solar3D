import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { getPlanetById } from '../utils/planetData';
import { ArrowLeft, Heart, Info, Globe, Thermometer, Clock, Ruler, Scale } from 'lucide-react';

const PlanetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const planet = id ? getPlanetById(id) : undefined;
  const user = auth.currentUser;

  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!user || !id) return;
      
      try {
        const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
        const docSnap = await getDoc(favoriteRef);
        setIsFavorite(docSnap.exists());
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkIfFavorite();
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
      
      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          planetId: id,
          createdAt: new Date(),
          planetName: planet?.name || id
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!planet) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Planet not found</h2>
          <Link to="/solar-system" className="text-yellow-400 hover:text-yellow-300 flex items-center justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Solar System
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/solar-system" className="text-yellow-400 hover:text-yellow-300 flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Solar System
          </Link>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-700 p-6 flex items-center justify-center">
              <div className="relative">
                <div className={`w-64 h-64 rounded-full flex items-center justify-center`} style={{ backgroundColor: planet.color, opacity: 0.2 }}>
                  <div className={`w-48 h-48 rounded-full`} style={{ backgroundColor: planet.color }}></div>
                </div>
              </div>
            </div>
            
            <div className="md:w-2/3 p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-white">{planet.name}</h1>
                {user && (
                  <button 
                    onClick={toggleFavorite}
                    disabled={loading}
                    className={`p-2 rounded-full ${isFavorite ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'} hover:bg-opacity-80 transition-colors`}
                  >
                    <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
              
              <p className="text-gray-300 mb-6">{planet.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Ruler className="h-6 w-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Diameter</p>
                    <p className="text-white font-medium">{planet.diameter.toLocaleString()} km</p>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Scale className="h-6 w-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Mass</p>
                    <p className="text-white font-medium">{planet.mass} kg</p>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Globe className="h-6 w-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Distance from Sun</p>
                    <p className="text-white font-medium">{planet.distanceFromSun.toLocaleString()} million km</p>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Clock className="h-6 w-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Orbital Period</p>
                    <p className="text-white font-medium">{planet.orbitalPeriod.toLocaleString()} Earth days</p>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Clock className="h-6 w-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Rotation Period</p>
                    <p className="text-white font-medium">{Math.abs(planet.rotationPeriod).toLocaleString()} Earth days {planet.rotationPeriod < 0 ? '(retrograde)' : ''}</p>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Thermometer className="h-6 w-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Temperature</p>
                    <p className="text-white font-medium">{planet.temperature}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-yellow-400" />
                  Atmosphere
                </h2>
                <p className="text-gray-300">{planet.atmosphere}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Interesting Facts</h2>
            <ul className="space-y-2">
              {planet.facts.map((fact, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-gray-300">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanetDetail;