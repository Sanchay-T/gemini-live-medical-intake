import { create } from 'zustand';
import { Message } from '@/types';
import { generateId } from '@/lib/utils';

interface ConversationStore {
  messages: Message[];
  currentAIChunk: string;
  currentPatientChunk: string;
  lastRole: 'ai' | 'patient' | null;

  addMessage: (role: 'ai' | 'patient', content: string) => void;
  appendTranscriptChunk: (role: 'ai' | 'patient', chunk: string) => void;
  finalizeCurrentMessage: () => void;
  setMessages: (messages: Message[]) => void;
  clearConversation: () => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  messages: [],
  currentAIChunk: '',
  currentPatientChunk: '',
  lastRole: null,

  addMessage: (role, content) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: generateId(),
        role,
        content,
        timestamp: new Date(),
      },
    ],
  })),

  appendTranscriptChunk: (role, chunk) => set((state) => {
    // If role changed, finalize the previous message first
    if (state.lastRole && state.lastRole !== role) {
      const previousContent = state.lastRole === 'ai' ? state.currentAIChunk : state.currentPatientChunk;

      if (previousContent.trim()) {
        console.log(`[TRANSCRIPT] 💬 ${state.lastRole === 'ai' ? '🤖 AI' : '👤 Patient'}: "${previousContent.trim()}"`);
        return {
          messages: [
            ...state.messages,
            {
              id: generateId(),
              role: state.lastRole,
              content: previousContent.trim(),
              timestamp: new Date(),
            },
          ],
          currentAIChunk: role === 'ai' ? chunk : '',
          currentPatientChunk: role === 'patient' ? chunk : '',
          lastRole: role,
        };
      }
    }

    // Append to the current chunk
    if (role === 'ai') {
      const newContent = state.currentAIChunk + chunk;
      console.log(`[TRANSCRIPT] 🤖 AI (streaming): "${newContent}"`);
      return {
        currentAIChunk: newContent,
        lastRole: role,
      };
    } else {
      const newContent = state.currentPatientChunk + chunk;
      console.log(`[TRANSCRIPT] 👤 Patient (streaming): "${newContent}"`);
      return {
        currentPatientChunk: newContent,
        lastRole: role,
      };
    }
  }),

  finalizeCurrentMessage: () => set((state) => {
    const content = state.lastRole === 'ai' ? state.currentAIChunk : state.currentPatientChunk;

    if (!content.trim() || !state.lastRole) {
      return state;
    }

    console.log(`[TRANSCRIPT] ✅ FINALIZED ${state.lastRole === 'ai' ? '🤖 AI' : '👤 Patient'}: "${content.trim()}"`);

    return {
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: state.lastRole,
          content: content.trim(),
          timestamp: new Date(),
        },
      ],
      currentAIChunk: '',
      currentPatientChunk: '',
      lastRole: null,
    };
  }),

  setMessages: (messages) => set({
    messages: messages.map(msg => ({
      ...msg,
      id: msg.id || generateId(),
      timestamp: msg.timestamp || new Date(),
    })),
    currentAIChunk: '',
    currentPatientChunk: '',
    lastRole: null,
  }),

  clearConversation: () => set({
    messages: [],
    currentAIChunk: '',
    currentPatientChunk: '',
    lastRole: null,
  }),
}));
