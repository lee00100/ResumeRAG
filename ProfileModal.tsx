import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { Icons } from './Icons';
import { api } from '../services/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'profile' | 'settings';

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, reloadUser, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
    // Reset state on open/close
    if (!isOpen) {
      setProfileMessage(null);
      setPasswordMessage(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDeleteConfirm('');
      setActiveTab('profile');
    }
  }, [user, isOpen]);
  
  if (!isOpen) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    if (!user || !name.trim()) {
        setProfileMessage({ type: 'error', text: 'Name cannot be empty.' });
        return;
    }
    try {
        await api.updateProfile(user.email, name.trim());
        await reloadUser();
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
        setProfileMessage({ type: 'error', text: 'Failed to update profile.' });
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordMessage(null);
      if (!user) return;
      if (newPassword !== confirmPassword) {
          setPasswordMessage({ type: 'error', text: 'New passwords do not match.'});
          return;
      }
      if (newPassword.length < 6) {
          setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.'});
          return;
      }
      try {
        await api.changePassword(user.email, currentPassword, newPassword);
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred.'});
      }
  };

  const handleDeleteAccount = async () => {
    if (user && deleteConfirm === 'DELETE') {
        try {
            await api.deleteAccount(user.email);
            logout(); // This will trigger redirect to login page
            onClose();
        } catch (err) {
            console.error("Failed to delete account:", err);
        }
    }
  };
  
  const TabButton: React.FC<{tab: ActiveTab, icon: React.ReactNode, label: string}> = ({ tab, icon, label }) => {
    const isActive = activeTab === tab;
    return (
       <button 
          onClick={() => setActiveTab(tab)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full text-left ${isActive ? 'bg-primary-light text-primary-dark dark:bg-primary-dark/50 dark:text-primary-light' : 'text-secondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          {icon}
          {label}
        </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Sidebar */}
        <aside className="w-full md:w-56 bg-gray-50 dark:bg-gray-800/50 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-secondary-dark dark:text-gray-100 mb-4 px-2">Account</h2>
          <nav className="space-y-1">
            <TabButton tab="profile" icon={<Icons.User className="h-5 w-5"/>} label="Profile" />
            <TabButton tab="settings" icon={<Icons.Cog className="h-5 w-5"/>} label="Settings" />
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <Icons.XMark className="h-6 w-6" />
          </button>
          
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-bold text-secondary-dark dark:text-gray-100 mb-4">Update Profile</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-sm">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input id="email" type="email" value={user?.email || ''} className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700/50 cursor-not-allowed" disabled />
                  </div>
                   <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-offset-gray-800" required/>
                  </div>
                  {profileMessage && <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{profileMessage.text}</p>}
                  <div>
                    <button type="submit" className="inline-flex justify-center rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800">Save Changes</button>
                  </div>
                </form>
              </section>
              <hr className="border-gray-200 dark:border-gray-700" />
              <section>
                <h3 className="text-xl font-bold text-secondary-dark dark:text-gray-100 mb-4">Change Password</h3>
                 <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                    <input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-offset-gray-800" required autoComplete="current-password" />
                  </div>
                   <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                    <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-offset-gray-800" required autoComplete="new-password" />
                  </div>
                   <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                    <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-offset-gray-800" required autoComplete="new-password" />
                  </div>
                  {passwordMessage && <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{passwordMessage.text}</p>}
                  <div>
                    <button type="submit" className="inline-flex justify-center rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800">Update Password</button>
                  </div>
                </form>
              </section>
              <hr className="border-gray-200 dark:border-gray-700" />
               <section>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4">Danger Zone</h3>
                <div className="p-4 border border-red-300 dark:border-red-500/50 rounded-lg max-w-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Deleting your account is permanent and cannot be undone. All your saved jobs and profile information will be lost.
                    </p>
                    <label htmlFor="delete-confirm" className="block text-sm font-medium text-red-700 dark:text-red-400">Type DELETE to confirm</label>
                    <input id="delete-confirm" type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-offset-gray-800" />
                    <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'} className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800">
                        <Icons.Trash className="mr-2 h-4 w-4"/> Delete My Account
                    </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
               <section>
                 <h3 className="text-xl font-bold text-secondary-dark dark:text-gray-100 mb-4">Appearance</h3>
                 <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg max-w-sm">
                   <div className="flex items-center gap-3">
                    {settings?.theme === 'dark' ? <Icons.Moon className="h-5 w-5 text-gray-400"/> : <Icons.Sun className="h-5 w-5 text-gray-500"/>}
                     <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                   </div>
                   <button onClick={() => updateSettings({ theme: settings?.theme === 'dark' ? 'light' : 'dark'})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings?.theme === 'dark' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                 </div>
               </section>
                <hr className="border-gray-200 dark:border-gray-700" />
               <section>
                 <h3 className="text-xl font-bold text-secondary-dark dark:text-gray-100 mb-4">Notifications</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg max-w-sm">
                   <div className="flex items-center gap-3">
                    <Icons.Bell className="h-5 w-5 text-gray-500 dark:text-gray-400"/>
                     <div>
                        <p className="font-medium text-sm text-gray-700 dark:text-gray-300">New Job Alerts</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about new matching jobs.</p>
                     </div>
                   </div>
                   <button onClick={() => updateSettings({ jobAlerts: !settings?.jobAlerts })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings?.jobAlerts ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.jobAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                 </div>
               </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfileModal;
