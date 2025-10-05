import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { useAuth } from '../hooks/useAuth';
import { ProfileDropdown } from './ProfileDropdown';

interface HeaderProps {
    onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Icons.Logo className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            ResumeRAG
          </h1>
        </div>
        
        {user && (
          <div className="relative" ref={dropdownRef}>
              <button 
                  onClick={() => setIsDropdownOpen(prev => !prev)} 
                  className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all"
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
              >
                <img 
                  src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
                  alt="Profile picture"
                  className="h-full w-full rounded-full object-cover"
                />
              </button>

              {isDropdownOpen && (
                  <ProfileDropdown 
                      user={user} 
                      onManageAccount={() => {
                          onProfileClick();
                          setIsDropdownOpen(false);
                      }}
                      onLogout={logout} 
                  />
              )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;