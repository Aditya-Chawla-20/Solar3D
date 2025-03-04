import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { User, Heart, Trash2 } from 'lucide-react';
import { getPlanetById } from '../utils/planetData';

interface ProfileProps {
  user: any;
}

interface FavoriteItem {
  id: string;
  planetId: string;
  planetName: string;
  createdAt: any;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const q = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const favoritesData: FavoriteItem[] = [];
        
        querySnapshot.forEach((doc) => {
          favoritesData.push({
            id: doc.id,
            ...doc.data(),
          } as FavoriteItem);
        });
        
        setFavorites(favoritesData);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center">
              <div className="bg-yellow-400 p-3 rounded-full">
                <User className="h-8 w-8 text-gray-900" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">{user.displayName || 'Space Explorer'}</h1>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Heart className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-xl font-bold text-white">Favorite Planets</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((favorite) => {
                  const planet = getPlanetById(favorite.planetId);
                  return (
                    <div key={favorite.id} className="bg-gray-700 rounded-lg overflow-hidden flex">
                      <div 
                        className="w-16 flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: planet?.color || '#666' }}
                      ></div>
                      <div className="p-4 flex-grow flex justify-between items-center">
                        <div>
                          <Link 
                            to={`/planet/${favorite.planetId}`}
                            className="text-lg font-medium text-white hover:text-yellow-400"
                          >
                            {favorite.planetName}
                          </Link>
                          <p className="text-sm text-gray-400">
                            Added on {favorite.createdAt.toDate().toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFavorite(favorite.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          aria-label="Remove favorite"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You haven't added any favorite planets yet.</p>
                <Link
                  to="/solar-system"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-gray-900 bg-yellow-400 hover:bg-yellow-500"
                >
                  Explore Solar System
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;