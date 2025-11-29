import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Doctor,
  User,
  Consultation,
  ChatMessage,
  Prescription,
} from '../types/consultation';

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

  // Consultation - User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Consultation - Doctors
  doctors: Doctor[];
  setDoctors: (doctors: Doctor[]) => void;

  // Consultation - Consultations
  consultations: Consultation[];
  setConsultations: (consultations: Consultation[]) => void;
  addConsultation: (consultation: Consultation) => void;
  updateConsultation: (id: string, updates: Partial<Consultation>) => void;
  activeConsultation: Consultation | null;
  setActiveConsultation: (consultation: Consultation | null) => void;

  // Consultation - Chat
  chatMessages: {[consultationId: string]: ChatMessage[]};
  setChatMessages: (consultationId: string, messages: ChatMessage[]) => void;
  addChatMessage: (consultationId: string, message: ChatMessage) => void;

  // Consultation - Prescriptions
  prescriptions: Prescription[];
  setPrescriptions: (prescriptions: Prescription[]) => void;
  addPrescription: (prescription: Prescription) => void;

  // Hydration
  hydrate: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isDarkMode: false,
  searchHistory: [],
  favorites: [],
  reminders: [],
  isLoading: false,

  // Consultation initial state
  currentUser: null,
  doctors: [],
  consultations: [],
  activeConsultation: null,
  chatMessages: {},
  prescriptions: [],

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

  // Consultation actions
  setCurrentUser: async (user: User | null) => {
    set({currentUser: user});
    if (user) {
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('currentUser');
    }
  },

  setDoctors: async (doctors: Doctor[]) => {
    set({doctors});
    await AsyncStorage.setItem('doctors', JSON.stringify(doctors));
    await AsyncStorage.setItem('doctorsCachedAt', new Date().toISOString());
  },

  setConsultations: async (consultations: Consultation[]) => {
    set({consultations});
    await AsyncStorage.setItem('consultations', JSON.stringify(consultations));
  },

  addConsultation: async (consultation: Consultation) => {
    const consultations = [...get().consultations, consultation];
    set({consultations});
    await AsyncStorage.setItem('consultations', JSON.stringify(consultations));
  },

  updateConsultation: async (id: string, updates: Partial<Consultation>) => {
    const consultations = get().consultations.map(c =>
      c.id === id ? {...c, ...updates} : c,
    );
    set({consultations});
    await AsyncStorage.setItem('consultations', JSON.stringify(consultations));
  },

  setActiveConsultation: (consultation: Consultation | null) => {
    set({activeConsultation: consultation});
  },

  setChatMessages: (consultationId: string, messages: ChatMessage[]) => {
    set({
      chatMessages: {
        ...get().chatMessages,
        [consultationId]: messages,
      },
    });
  },

  addChatMessage: (consultationId: string, message: ChatMessage) => {
    const existingMessages = get().chatMessages[consultationId] || [];
    set({
      chatMessages: {
        ...get().chatMessages,
        [consultationId]: [...existingMessages, message],
      },
    });
  },

  setPrescriptions: async (prescriptions: Prescription[]) => {
    set({prescriptions});
    await AsyncStorage.setItem('prescriptions', JSON.stringify(prescriptions));
  },

  addPrescription: async (prescription: Prescription) => {
    const prescriptions = [...get().prescriptions, prescription];
    set({prescriptions});
    await AsyncStorage.setItem('prescriptions', JSON.stringify(prescriptions));
  },

  hydrate: async () => {
    try {
      const [
        theme,
        history,
        favorites,
        reminders,
        currentUser,
        doctors,
        consultations,
        prescriptions,
      ] = await Promise.all([
        AsyncStorage.getItem('theme'),
        AsyncStorage.getItem('searchHistory'),
        AsyncStorage.getItem('favorites'),
        AsyncStorage.getItem('reminders'),
        AsyncStorage.getItem('currentUser'),
        AsyncStorage.getItem('doctors'),
        AsyncStorage.getItem('consultations'),
        AsyncStorage.getItem('prescriptions'),
      ]);

      set({
        isDarkMode: theme ? JSON.parse(theme) : false,
        searchHistory: history ? JSON.parse(history) : [],
        favorites: favorites ? JSON.parse(favorites) : [],
        reminders: reminders ? JSON.parse(reminders) : [],
        currentUser: currentUser ? JSON.parse(currentUser) : null,
        doctors: doctors ? JSON.parse(doctors) : [],
        consultations: consultations ? JSON.parse(consultations) : [],
        prescriptions: prescriptions ? JSON.parse(prescriptions) : [],
      });
    } catch (error) {
      console.error('Failed to hydrate store:', error);
    }
  },
}));
