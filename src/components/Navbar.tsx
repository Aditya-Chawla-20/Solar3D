import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Sun, Menu, X, LogOut, User, Home, Globe } from 'lucide-react';

interface NavbarProps {
  user: any;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Sun className="h-8 w-8 text-yellow-400" />
              <span className="ml-2 text-xl font-bold">Solar Explorer</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                  <Home className="inline-block mr-1 h-4 w-4" />
                  Home
                </Link>
                <Link to="/solar-system" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                  <Globe className="inline-block mr-1 h-4 w-4" />
                  Solar System
                </Link>
                {user ? (
                  <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                    <User className="inline-block mr-1 h-4 w-4" />
                    Profile
                  </Link>
                ) : (
                  <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
          {user && (
            <div className="hidden md:block">
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center"
              >
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Home className="inline-block mr-1 h-4 w-4" />
              Home
            </Link>
            <Link
              to="/solar-system"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Globe className="inline-block mr-1 h-4 w-4" />
              Solar System
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="inline-block mr-1 h-4 w-4" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <LogOut className="inline-block mr-1 h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;