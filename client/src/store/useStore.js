import { create } from 'zustand';

export const useStore = create((set) => ({
  student: null,
  setStudent: (student) => set({ student }),

  // Session
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  // Chat
  chatHistory: [],
  addMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),
}));
