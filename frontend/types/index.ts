// Core medical intake types
export interface Medication {
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  indication?: string;
  effectiveness?: string;
}

export interface Allergy {
  allergen: string;
  reaction: string[];
  severity: 'mild' | 'moderate' | 'serious' | 'life-threatening';
  requires_emergency_treatment?: boolean;
}

export interface MedicalIntake {
  chief_complaint: string;
  duration?: string;
  location?: string;
  severity?: string;
  timing?: string;
  current_medications: Medication[];
  allergies: Allergy[];
  past_medical_history?: {
    conditions?: string[];
    surgeries?: string[];
    hospitalizations?: string[];
  };
  family_history?: {
    conditions?: string[];
    relatives?: string[];
  };
  social_history?: {
    smoking?: string;
    alcohol?: string;
    occupation?: string;
  };
  red_flags?: string[];
  review_of_systems?: Record<string, string[]>;
}

// Conversation types
export interface Message {
  id: string;
  role: 'ai' | 'patient';
  content: string;
  timestamp: Date;
}

// Simulation types
export interface Exchange {
  ai: string;
  patient: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  duration: string;
  complexity: 'low' | 'medium' | 'high';
  category: 'happy-path' | 'edge-case' | 'error-scenario';
  exchanges: Exchange[];
  expected_output: MedicalIntake;
}

// WebSocket message types
export interface AudioMessage {
  type: 'audio';
  data: ArrayBuffer;
}

export interface ControlMessage {
  type: 'control';
  action: 'start' | 'stop' | 'interrupt';
}

export interface ExtractedDataMessage {
  type: 'extracted_data';
  data: MedicalIntake;
}

export interface StatusMessage {
  type: 'status';
  state: 'listening' | 'processing' | 'speaking';
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WebSocketMessage =
  | AudioMessage
  | ControlMessage
  | ExtractedDataMessage
  | StatusMessage
  | ErrorMessage;

// Audio types
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

// Voice UI state types
export type VoiceMode = 'live' | 'simulation';
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

// Component prop types
export interface VoiceInputProps {
  mode: VoiceMode;
  onStart: () => void;
  onStop: () => void;
}

export interface VoiceButtonProps {
  isActive: boolean;
  state: VoiceState;
  onClick: () => void;
}

export interface AudioVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export interface ConversationLogProps {
  messages: Message[];
}

export interface ExtractedDataCardProps {
  data: MedicalIntake | null;
}

export interface SimulationControlsProps {
  scenario: Scenario | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onReset: () => void;
}

export interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: Scenario | null;
  onSelect: (scenario: Scenario) => void;
}

export interface ComparisonViewProps {
  expected: MedicalIntake;
  actual: MedicalIntake | null;
}
