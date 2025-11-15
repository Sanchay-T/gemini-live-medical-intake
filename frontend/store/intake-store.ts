import { create } from 'zustand';
import { MedicalIntake, Medication, Allergy } from '@/types';

interface IntakeStore {
  extractedData: MedicalIntake | null;
  updateData: (data: Partial<MedicalIntake>) => void;
  setData: (data: MedicalIntake) => void;
  clearData: () => void;

  // Editing capabilities
  editField: (field: keyof MedicalIntake, value: any) => void;
  addMedication: (medication: Medication) => void;
  editMedication: (index: number, medication: Medication) => void;
  removeMedication: (index: number) => void;
  addAllergy: (allergy: Allergy) => void;
  editAllergy: (index: number, allergy: Allergy) => void;
  removeAllergy: (index: number) => void;
}

export const useIntakeStore = create<IntakeStore>((set) => ({
  extractedData: null,

  updateData: (data) => set((state) => ({
    extractedData: state.extractedData
      ? { ...state.extractedData, ...data }
      : null,
  })),

  setData: (data) => set({ extractedData: data }),

  clearData: () => set({ extractedData: null }),

  // Editing capabilities
  editField: (field, value) => set((state) => ({
    extractedData: state.extractedData
      ? { ...state.extractedData, [field]: value }
      : null,
  })),

  addMedication: (medication) => set((state) => ({
    extractedData: state.extractedData
      ? {
          ...state.extractedData,
          current_medications: [...state.extractedData.current_medications, medication],
        }
      : null,
  })),

  editMedication: (index, medication) => set((state) => {
    if (!state.extractedData) return state;
    const newMeds = [...state.extractedData.current_medications];
    newMeds[index] = medication;
    return {
      extractedData: {
        ...state.extractedData,
        current_medications: newMeds,
      },
    };
  }),

  removeMedication: (index) => set((state) => ({
    extractedData: state.extractedData
      ? {
          ...state.extractedData,
          current_medications: state.extractedData.current_medications.filter((_, i) => i !== index),
        }
      : null,
  })),

  addAllergy: (allergy) => set((state) => ({
    extractedData: state.extractedData
      ? {
          ...state.extractedData,
          allergies: [...state.extractedData.allergies, allergy],
        }
      : null,
  })),

  editAllergy: (index, allergy) => set((state) => {
    if (!state.extractedData) return state;
    const newAllergies = [...state.extractedData.allergies];
    newAllergies[index] = allergy;
    return {
      extractedData: {
        ...state.extractedData,
        allergies: newAllergies,
      },
    };
  }),

  removeAllergy: (index) => set((state) => ({
    extractedData: state.extractedData
      ? {
          ...state.extractedData,
          allergies: state.extractedData.allergies.filter((_, i) => i !== index),
        }
      : null,
  })),
}));
