/**
 * Demo data for screenshots and documentation
 * High-quality realistic medical intake data
 */

import { Message } from '@/types';
import type { IntakeData } from '@/store/intake-store';

// Demo conversation messages for Conversation Screen
export const demoMessages: Message[] = [
  {
    role: 'ai',
    content: "Hello! I'm here to help with your medical intake today. Can you tell me what brings you in?",
  },
  {
    role: 'patient',
    content: "Hi, I've been experiencing severe migraine headaches for the past two weeks. They're getting worse and affecting my work.",
  },
  {
    role: 'ai',
    content: "I'm sorry to hear that. Can you describe the pain? Is it on one side or both sides of your head?",
  },
  {
    role: 'patient',
    content: "It's mostly on the right side, behind my eye. The pain is throbbing and comes with sensitivity to light and nausea.",
  },
  {
    role: 'ai',
    content: "Thank you for that detail. Are you currently taking any medications?",
  },
  {
    role: 'patient',
    content: "Yes, I'm taking Lisinopril 10mg daily for blood pressure, and I've been using Ibuprofen 400mg as needed for the headaches, about three times a day lately.",
  },
  {
    role: 'ai',
    content: "Got it. Do you have any known allergies to medications or other substances?",
  },
  {
    role: 'patient',
    content: "Yes, I'm allergic to Penicillin - I get severe hives and difficulty breathing. Also allergic to shellfish, which causes throat swelling.",
  },
  {
    role: 'ai',
    content: "That's important information. Can you tell me about any past medical conditions?",
  },
  {
    role: 'patient',
    content: "I have hypertension, which is controlled with medication. I also had my appendix removed about five years ago.",
  },
  {
    role: 'ai',
    content: "Thank you. Just a few more questions - do you smoke or drink alcohol?",
  },
  {
    role: 'patient',
    content: "I quit smoking two years ago, but I used to smoke a pack a day for ten years. I have an occasional glass of wine on weekends, maybe 2-3 drinks per week. I work as a software engineer.",
  },
];

// Demo extracted data for Review/Confirmation Screens
export const demoIntakeData: IntakeData = {
  chief_complaint: "Severe migraine headaches for the past two weeks, worsening over time. Pain is throbbing, located on the right side behind the eye, accompanied by photophobia (light sensitivity) and nausea. Symptoms are interfering with work performance.",

  current_medications: [
    {
      name: "Lisinopril",
      dose: "10mg",
      frequency: "Once daily",
    },
    {
      name: "Ibuprofen",
      dose: "400mg",
      frequency: "Three times daily as needed",
    },
    {
      name: "Multivitamin",
      dose: "1 tablet",
      frequency: "Once daily",
    },
  ],

  allergies: [
    {
      allergen: "Penicillin",
      reaction: ["Severe hives", "Difficulty breathing"],
      severity: "life-threatening",
    },
    {
      allergen: "Shellfish",
      reaction: ["Throat swelling", "Hives"],
      severity: "serious",
    },
  ],

  past_medical_history: {
    conditions: [
      "Hypertension (controlled with medication)",
      "Appendectomy (5 years ago)",
      "Seasonal allergies",
    ],
  },

  social_history: {
    smoking: "Former smoker (quit 2 years ago, 10-year history at 1 pack/day)",
    alcohol: "Social drinker (2-3 drinks per week, typically wine)",
    occupation: "Software Engineer",
  },
};

// Alternative demo data sets for variety
export const demoDataSets = {
  migraine: demoIntakeData, // Already defined above

  diabetes: {
    chief_complaint: "Type 2 Diabetes follow-up. Blood sugar levels have been fluctuating despite medication compliance. Experiencing increased thirst and frequent urination.",
    current_medications: [
      { name: "Metformin", dose: "1000mg", frequency: "Twice daily with meals" },
      { name: "Atorvastatin", dose: "20mg", frequency: "Once daily at bedtime" },
      { name: "Aspirin", dose: "81mg", frequency: "Once daily" },
    ],
    allergies: [
      { allergen: "Sulfa drugs", reaction: ["Rash", "Itching"], severity: "moderate" },
    ],
    past_medical_history: {
      conditions: ["Type 2 Diabetes (8 years)", "Hyperlipidemia", "Obesity"],
    },
    social_history: {
      smoking: "Never smoker",
      alcohol: "None",
      occupation: "Accountant",
    },
  } as IntakeData,

  asthma: {
    chief_complaint: "Asthma exacerbation over the past week. Increased wheezing, shortness of breath, especially at night and during exercise. Using rescue inhaler more frequently than usual.",
    current_medications: [
      { name: "Albuterol Inhaler", dose: "2 puffs", frequency: "Every 4 hours as needed" },
      { name: "Fluticasone Inhaler", dose: "220mcg", frequency: "Twice daily" },
      { name: "Montelukast", dose: "10mg", frequency: "Once daily at bedtime" },
    ],
    allergies: [
      { allergen: "Dust mites", reaction: ["Wheezing", "Sneezing"], severity: "moderate" },
      { allergen: "Pollen", reaction: ["Nasal congestion", "Itchy eyes"], severity: "mild" },
    ],
    past_medical_history: {
      conditions: ["Asthma (since childhood)", "Allergic rhinitis", "Eczema"],
    },
    social_history: {
      smoking: "Never smoker",
      alcohol: "Occasional (1-2 drinks per month)",
      occupation: "Elementary School Teacher",
    },
  } as IntakeData,
};

// Empty state data
export const emptyIntakeData: IntakeData = {
  chief_complaint: "",
  current_medications: [],
  allergies: [],
  past_medical_history: { conditions: [] },
  social_history: {},
};
