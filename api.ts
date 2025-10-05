import { mockDb } from './mockDb';
import { User, UserSettings } from '../types';

const MOCK_API_DELAY = 400; // ms

// Helper to simulate network latency and handle errors from the sync mock DB
const simulateApiCall = <T>(fn: () => T): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const result = fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, MOCK_API_DELAY);
    });
};

export const api = {
  // --- Auth ---
  signup: (name: string, email: string, password?: string): Promise<User> => {
    return simulateApiCall(() => mockDb.signup(name, email, password));
  },
  login: (email: string, password?: string): Promise<User> => {
    return simulateApiCall(() => mockDb.login(email, password));
  },
  logout: (): Promise<void> => {
    return simulateApiCall(() => mockDb.logout());
  },
  getCurrentUser: (): User | null => {
    return mockDb.getCurrentUser(); // This can remain sync as it's for initial load
  },
  reloadUser: (email: string): Promise<User | null> => {
    return simulateApiCall(() => mockDb.reloadUser(email));
  },
  
  // --- Profile ---
  updateProfile: (email: string, name: string): Promise<void> => {
    return simulateApiCall(() => mockDb.updateProfile(email, name));
  },
  changePassword: (email: string, oldPassword?: string, newPassword?: string): Promise<void> => {
    return simulateApiCall(() => mockDb.changePassword(email, oldPassword, newPassword));
  },
  deleteAccount: (email: string): Promise<void> => {
    return simulateApiCall(() => mockDb.deleteAccount(email));
  },
  
  // --- Settings ---
  getUserSettings: (email: string): Promise<UserSettings> => {
    return simulateApiCall(() => mockDb.getUserSettings(email));
  },
  updateUserSettings: (email: string, newSettings: UserSettings): Promise<void> => {
    return simulateApiCall(() => mockDb.updateUserSettings(email, newSettings));
  },

  // --- Saved Jobs ---
  getSavedJobs: (email: string): Promise<string[]> => {
    return simulateApiCall(() => mockDb.getSavedJobs(email));
  },
  updateSavedJobs: (email: string, jobIds: string[]): Promise<void> => {
    return simulateApiCall(() => mockDb.updateSavedJobs(email, jobIds));
  }
};
