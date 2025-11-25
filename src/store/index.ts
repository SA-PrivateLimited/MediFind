import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Medicine {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  uses: string;
  sideEffects: string;
  dosage: string;
  warnings: string;
  timestamp: number;
  isFavorite?: boolean;
}

export interface Reminder {
  id: string;
  medicineName: string;
  time: Date;
  frequency: 'daily' | 'twice' | 'thrice' | 'custom';
  notes?: string;
  enabled: boolean;
}

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Search History
  searchHistory: Medicine[];
  addToHistory: (medicine: Medicine) => void;
  clearHistory: () => void;

  // Favorites
  favorites: Medicine[];
  toggleFavorite: (medicine: Medicine) => void;

  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Hydration
  hydrate: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isDarkMode: false,
  searchHistory: [],
  favorites: [],
  reminders: [],
  isLoading: false,

  toggleTheme: async () => {
    const newTheme = !get().isDarkMode;
    set({isDarkMode: newTheme});
    await AsyncStorage.setItem('theme', JSON.stringify(newTheme));
  },

  addToHistory: async (medicine: Medicine) => {
    const history = get().searchHistory;
    const filtered = history.filter(m => m.id !== medicine.id);
    const newHistory = [medicine, ...filtered].slice(0, 50); // Keep last 50
    set({searchHistory: newHistory});
    await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
  },

  clearHistory: async () => {
    set({searchHistory: []});
    await AsyncStorage.removeItem('searchHistory');
  },

  toggleFavorite: async (medicine: Medicine) => {
    const favorites = get().favorites;
    const index = favorites.findIndex(f => f.id === medicine.id);
    let newFavorites;

    if (index >= 0) {
      newFavorites = favorites.filter(f => f.id !== medicine.id);
    } else {
      newFavorites = [...favorites, {...medicine, isFavorite: true}];
    }

    set({favorites: newFavorites});
    await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
  },

  addReminder: async (reminder: Reminder) => {
    const reminders = [...get().reminders, reminder];
    set({reminders});
    await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
  },

  updateReminder: async (id: string, updates: Partial<Reminder>) => {
    const reminders = get().reminders.map(r =>
      r.id === id ? {...r, ...updates} : r,
    );
    set({reminders});
    await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
  },

  deleteReminder: async (id: string) => {
    const reminders = get().reminders.filter(r => r.id !== id);
    set({reminders});
    await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
  },

  setIsLoading: (loading: boolean) => set({isLoading: loading}),

  hydrate: async () => {
    try {
      const [theme, history, favorites, reminders] = await Promise.all([
        AsyncStorage.getItem('theme'),
        AsyncStorage.getItem('searchHistory'),
        AsyncStorage.getItem('favorites'),
        AsyncStorage.getItem('reminders'),
      ]);

      set({
        isDarkMode: theme ? JSON.parse(theme) : false,
        searchHistory: history ? JSON.parse(history) : [],
        favorites: favorites ? JSON.parse(favorites) : [],
        reminders: reminders ? JSON.parse(reminders) : [],
      });
    } catch (error) {
      console.error('Failed to hydrate store:', error);
    }
  },
}));
