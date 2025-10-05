import { User, UserSettings } from '../types';

// More structured storage keys for a mock DB
const USERS_DB_KEY = 'resume-rag-users-db'; // Stores { email: { password, name } }
const SETTINGS_DB_KEY = 'resume-rag-settings-db'; // Stores { email: UserSettings }
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

    // Seed default admin user if not present
    if (!users['admin@mail.com']) {
        users['admin@mail.com'] = { password: 'admin123', name: 'Admin User' };
        settings['admin@mail.com'] = { theme: 'light', jobAlerts: false };
        saveDb(USERS_DB_KEY, users);
        saveDb(SETTINGS_DB_KEY, settings);
    }
};

initializeMockDatabase();

// --- Auth Service Definition ---
export const authService = {
  signup: (name: string, email: string, password?: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
        if (users[email]) {
          return reject(new Error('An account with this email already exists.'));
        }
        
        users[email] = { password, name };
        saveDb(USERS_DB_KEY, users);
        
        // Create default settings for the new user
        let settings = getDb<Record<string, UserSettings>>(SETTINGS_DB_KEY) || {};
        settings[email] = { theme: 'light', jobAlerts: false };
        saveDb(SETTINGS_DB_KEY, settings);

        const newUser: User = { id: Date.now().toString(), email, name };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        resolve(newUser);
      }, 500);
    });
  },

  login: (email: string, password?: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
        const userData = users[email];

        if (!userData) {
          return reject(new Error('User not found.'));
        }
        if (userData.password !== password) {
          return reject(new Error('Invalid password.'));
        }

        const user: User = { id: Date.now().toString(), email, name: userData.name };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        resolve(user);
      }, 500);
    });
  },

  logout: (): Promise<void> => {
    return new Promise((resolve) => {
        localStorage.removeItem(CURRENT_USER_KEY);
        resolve();
    });
  },

  getCurrentUser: (): User | null => {
    const userRaw = localStorage.getItem(CURRENT_USER_KEY);
    return userRaw ? JSON.parse(userRaw) : null;
  },
  
  reloadUser: (email: string): Promise<User | null> => {
     return new Promise((resolve) => {
        const users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
        const userData = users[email];
        if (userData) {
            const user: User = { id: Date.now().toString(), email, name: userData.name };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            resolve(user);
        } else {
            resolve(null);
        }
     });
  },

  updateProfile: (email: string, name: string): Promise<void> => {
      return new Promise((resolve) => {
          let users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
          if(users[email]) {
              users[email].name = name;
              saveDb(USERS_DB_KEY, users);
          }
          resolve();
      });
  },

  changePassword: (email: string, oldPassword?: string, newPassword?: string): Promise<void> => {
      return new Promise((resolve, reject) => {
          let users = getDb<Record<string, { password?: string, name: string }>>(USERS_DB_KEY) || {};
          if(users[email] && users[email].password === oldPassword) {
              users[email].password = newPassword;
              saveDb(USERS_DB_KEY, users);
              resolve();
          } else {
              reject(new Error('Incorrect current password.'));
          }
      });
  },
  
  deleteAccount: (email: string): Promise<void> => {
    return new Promise((resolve) => {
        let users = getDb<Record<string, any>>(USERS_DB_KEY) || {};
        delete users[email];
        saveDb(USERS_DB_KEY, users);

        let settings = getDb<Record<string, any>>(SETTINGS_DB_KEY) || {};
        delete settings[email];
        saveDb(SETTINGS_DB_KEY, settings);
        
        // Also remove user-specific data like saved jobs
        localStorage.removeItem(`saved-job-ids-${email}`);
        
        localStorage.removeItem(CURRENT_USER_KEY);
        resolve();
    });
  },
  
  getUserSettings: (email: string): Promise<UserSettings> => {
      return new Promise((resolve) => {
          const settings = getDb<Record<string, UserSettings>>(SETTINGS_DB_KEY) || {};
          const userSettings = settings[email] || { theme: 'light', jobAlerts: false };
          resolve(userSettings);
      });
  },

  updateUserSettings: (email: string, newSettings: UserSettings): Promise<void> => {
      return new Promise((resolve) => {
          let settings = getDb<Record<string, UserSettings>>(SETTINGS_DB_KEY) || {};
          settings[email] = newSettings;
          saveDb(SETTINGS_DB_KEY, settings);
          resolve();
      });
  },
};