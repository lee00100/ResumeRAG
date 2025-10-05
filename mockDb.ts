import { User, UserSettings } from '../types';

// --- Storage Keys ---
const USERS_DB_KEY = 'resume-rag-users-db';
const SETTINGS_DB_KEY = 'resume-rag-settings-db';
const SAVED_JOBS_DB_KEY_PREFIX = 'saved-job-ids-';
const CURRENT_USER_KEY = 'resume-rag-current-user';

// --- Database Helper Functions ---
const getDb = <T>(key: string): T | null => {
    const rawData = localStorage.getItem(key);
    return rawData ? JSON.parse(rawData) : null;
};

const saveDb = <T>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- Initialization ---
const initializeMockDatabase = () => {
    let users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
    let settings = getDb<Record<string, UserSettings>>(SETTINGS_DB_KEY) || {};

    if (!users['admin@mail.com']) {
        users['admin@mail.com'] = { password: 'admin123', name: 'Admin User' };
        settings['admin@mail.com'] = { theme: 'light', jobAlerts: false };
        saveDb(USERS_DB_KEY, users);
        saveDb(SETTINGS_DB_KEY, settings);
    }
};

initializeMockDatabase();

// --- Mock DB Service Definition (Synchronous) ---
export const mockDb = {
  signup: (name: string, email: string, password?: string): User => {
    let users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
    if (users[email]) {
      throw new Error('An account with this email already exists.');
    }
    
    users[email] = { password, name };
    saveDb(USERS_DB_KEY, users);
    
    let settings = getDb<Record<string, UserSettings>>(SETTINGS_DB_KEY) || {};
    settings[email] = { theme: 'light', jobAlerts: false };
    saveDb(SETTINGS_DB_KEY, settings);

    const newUser: User = { id: Date.now().toString(), email, name };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  login: (email: string, password?: string): User => {
    const users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
    const userData = users[email];

    if (!userData) {
      throw new Error('User not found.');
    }
    if (userData.password !== password) {
      throw new Error('Invalid password.');
    }

    const user: User = { id: Date.now().toString(), email, name: userData.name };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userRaw = localStorage.getItem(CURRENT_USER_KEY);
    return userRaw ? JSON.parse(userRaw) : null;
  },
  
  reloadUser: (email: string): User | null => {
    const users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
    const userData = users[email];
    if (userData) {
        const user: User = { id: Date.now().toString(), email, name: userData.name };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
    }
    return null;
  },

  updateProfile: (email: string, name: string): void => {
      let users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
      if(users[email]) {
          users[email].name = name;
          saveDb(USERS_DB_KEY, users);
      } else {
          throw new Error("User not found for profile update.");
      }
  },

  changePassword: (email: string, oldPassword?: string, newPassword?: string): void => {
      let users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
      if(users[email] && users[email].password === oldPassword) {
          users[email].password = newPassword;
          saveDb(USERS_DB_KEY, users);
      } else {
          throw new Error('Incorrect current password.');
      }
  },
  
  deleteAccount: (email: string): void => {
    let users = getDb<Record<string, any>>(USERS_DB_KEY) || {};
    delete users[email];
    saveDb(USERS_DB_KEY, users);

    let settings = getDb<Record<string, any>>(SETTINGS_DB_KEY) || {};
    delete settings[email];
    saveDb(SETTINGS_DB_KEY, settings);
    
    localStorage.removeItem(`${SAVED_JOBS_DB_KEY_PREFIX}${email}`);
    localStorage.removeItem(CURRENT_USER_KEY);
  },
  
  getUserSettings: (email: string): UserSettings => {
      const settings = getDb<Record<string, UserSettings>>(SETTINGS_DB_KEY) || {};
      return settings[email] || { theme: 'light', jobAlerts: false };
  },

  updateUserSettings: (email: string, newSettings: UserSettings): void => {
      let settings = getDb<Record<string, UserSettings>>(SETTINGS_DB_KEY) || {};
      settings[email] = newSettings;
      saveDb(SETTINGS_DB_KEY, settings);
  },

  getSavedJobs: (email: string): string[] => {
    const rawData = localStorage.getItem(`${SAVED_JOBS_DB_KEY_PREFIX}${email}`);
    if (rawData) {
        try {
            const parsed = JSON.parse(rawData);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.error("Failed to parse saved jobs", e);
        }
    }
    return [];
  },

  updateSavedJobs: (email: string, jobIds: string[]): void => {
      localStorage.setItem(`${SAVED_JOBS_DB_KEY_PREFIX}${email}`, JSON.stringify(jobIds));
  },
};
