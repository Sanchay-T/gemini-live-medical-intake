/**
 * Demo data for screenshots and documentation
 * High-quality realistic medical intake data
 */

import { Message, MedicalIntake } from '@/types';

// Demo conversation messages for Conversation Screen
const baseTime = new Date('2024-01-15T10:00:00');
export const demoMessages: Message[] = [
  {
    id: '1',
    role: 'ai',
    content: "Hello! I'm here to help with your medical intake today. Can you tell me what brings you in?",
    timestamp: new Date(baseTime.getTime()),
  },
  {
    id: '2',
    role: 'patient',
    content: "Hi, I've been experiencing severe migraine headaches for the past two weeks. They're getting worse and affecting my work.",
    timestamp: new Date(baseTime.getTime() + 5000),
  },
  {
    id: '3',
    role: 'ai',
    content: "I'm sorry to hear that. Can you describe the pain? Is it on one side or both sides of your head?",
    timestamp: new Date(baseTime.getTime() + 10000),
  },
  {
    id: '4',
    role: 'patient',
    content: "It's mostly on the right side, behind my eye. The pain is throbbing and comes with sensitivity to light and nausea.",
    timestamp: new Date(baseTime.getTime() + 15000),
  },
  {
    id: '5',
    role: 'ai',
    content: "Thank you for that detail. Are you currently taking any medications?",
    timestamp: new Date(baseTime.getTime() + 20000),
  },
  {
    id: '6',
    role: 'patient',
    content: "Yes, I'm taking Lisinopril 10mg daily for blood pressure, and I've been using Ibuprofen 400mg as needed for the headaches, about three times a day lately.",
    timestamp: new Date(baseTime.getTime() + 25000),
  },
  {
    id: '7',
    role: 'ai',
    content: "Got it. Do you have any known allergies to medications or other substances?",
    timestamp: new Date(baseTime.getTime() + 30000),
  },
  {
    id: '8',
    role: 'patient',
    content: "Yes, I'm allergic to Penicillin - I get severe hives and difficulty breathing. Also allergic to shellfish, which causes throat swelling.",
    timestamp: new Date(baseTime.getTime() + 35000),
  },
  {
    id: '9',
    role: 'ai',
    content: "That's important information. Can you tell me about any past medical conditions?",
    timestamp: new Date(baseTime.getTime() + 40000),
  },
  {
    id: '10',
    role: 'patient',
    content: "I have hypertension, which is controlled with medication. I also had my appendix removed about five years ago.",
    timestamp: new Date(baseTime.getTime() + 45000),
  },
  {
    id: '11',
    role: 'ai',
    content: "Thank you. Just a few more questions - do you smoke or drink alcohol?",
    timestamp: new Date(baseTime.getTime() + 50000),
  },
  {
    id: '12',
    role: 'patient',
    content: "I quit smoking two years ago, but I used to smoke a pack a day for ten years. I have an occasional glass of wine on weekends, maybe 2-3 drinks per week. I work as a software engineer.",
    timestamp: new Date(baseTime.getTime() + 55000),
  },
];

// Demo extracted data for Review/Confirmation Screens
export const demoIntakeData: MedicalIntake = {
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
  } as MedicalIntake,

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
  } as MedicalIntake,
};

// Empty state data
export const emptyIntakeData: MedicalIntake = {
  chief_complaint: "",
  current_medications: [],
  allergies: [],
  past_medical_history: { conditions: [] },
  social_history: {},
};
