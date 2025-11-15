import { create } from 'zustand';

export type FlowStep = 'welcome' | 'conversation' | 'review' | 'confirmation' | 'success';

export type IntakeProgress = {
  chiefComplaint: boolean;
  medications: boolean;
  allergies: boolean;
  medicalHistory: boolean;
  socialHistory: boolean;
};

interface FlowState {
  currentStep: FlowStep;
  progress: IntakeProgress;
  canProceedToReview: boolean;

  // Actions
  setStep: (step: FlowStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateProgress: (field: keyof IntakeProgress, completed: boolean) => void;
  reset: () => void;
}

const initialProgress: IntakeProgress = {
  chiefComplaint: false,
  medications: false,
  allergies: false,
  medicalHistory: false,
  socialHistory: false,
};

export const useFlowStore = create<FlowState>((set, get) => ({
  currentStep: 'welcome',
  progress: initialProgress,
  canProceedToReview: false,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    const stepOrder: FlowStep[] = ['welcome', 'conversation', 'review', 'confirmation', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      set({ currentStep: stepOrder[currentIndex + 1] });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    const stepOrder: FlowStep[] = ['welcome', 'conversation', 'review', 'confirmation', 'success'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: stepOrder[currentIndex - 1] });
    }
  },

  updateProgress: (field, completed) => {
    set((state) => {
      const newProgress = { ...state.progress, [field]: completed };
      const canProceedToReview = newProgress.chiefComplaint; // Minimum requirement
      return { progress: newProgress, canProceedToReview };
    });
  },

  reset: () => set({ currentStep: 'welcome', progress: initialProgress, canProceedToReview: false }),
}));
