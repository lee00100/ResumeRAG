import React from 'react';
import { User } from '../types';
import { Icons } from './Icons';

interface ProfileDropdownProps {
  user: User;
  onManageAccount: () => void;
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onManageAccount, onLogout }) => {
  const displayName = user.name || user.email;

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-down">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
            alt="Profile picture"
            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="overflow-hidden">
            <p className="font-semibold text-sm text-secondary-dark dark:text-gray-100 truncate">{displayName}</p>
            <p className="text-xs text-secondary dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="p-2">
        <button
          onClick={onManageAccount}
          className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-secondary-dark dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Icons.User className="h-4 w-4" />
          <span>Manage Account</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-secondary-dark dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Icons.Logout className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};