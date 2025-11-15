import { Scenario, Exchange } from '@/types';
import { delay } from './utils';

export class SimulationEngine {
  private currentScenario: Scenario | null = null;
  private currentExchangeIndex = 0;
  private isRunning = false;
  private isPaused = false;

  private onAIMessageCallback: ((message: string) => void) | null = null;
  private onPatientMessageCallback: ((message: string) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;

  loadScenario(scenario: Scenario): void {
    this.currentScenario = scenario;
    this.currentExchangeIndex = 0;
    this.isRunning = false;
    this.isPaused = false;
  }

  async play(): Promise<void> {
    if (!this.currentScenario) {
      throw new Error('No scenario loaded');
    }

    this.isRunning = true;
    this.isPaused = false;

    while (
      this.currentExchangeIndex < this.currentScenario.exchanges.length &&
      this.isRunning &&
      !this.isPaused
    ) {
      const exchange = this.currentScenario.exchanges[this.currentExchangeIndex];
      await this.playExchange(exchange);
      this.currentExchangeIndex++;
    }

    if (this.currentExchangeIndex >= this.currentScenario.exchanges.length) {
      this.isRunning = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.play();
    }
  }

  async nextStep(): Promise<void> {
    if (!this.currentScenario) return;

    if (this.currentExchangeIndex < this.currentScenario.exchanges.length) {
      const exchange = this.currentScenario.exchanges[this.currentExchangeIndex];
      await this.playExchange(exchange);
      this.currentExchangeIndex++;
    }

    if (this.currentExchangeIndex >= this.currentScenario.exchanges.length) {
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  }

  reset(): void {
    this.currentExchangeIndex = 0;
    this.isRunning = false;
    this.isPaused = false;
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
  }

  onAIMessage(callback: (message: string) => void): void {
    this.onAIMessageCallback = callback;
  }

  onPatientMessage(callback: (message: string) => void): void {
    this.onPatientMessageCallback = callback;
  }

  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }

  private async playExchange(exchange: Exchange): Promise<void> {
    // AI speaks first
    if (this.onAIMessageCallback) {
      this.onAIMessageCallback(exchange.ai);
    }
    await delay(2000); // Wait for AI to "speak"

    // Patient responds
    if (this.onPatientMessageCallback) {
      this.onPatientMessageCallback(exchange.patient);
    }

    // Convert patient text to audio using Web Speech API
    await this.textToSpeech(exchange.patient);

    // Wait before next exchange
    await delay(1500);
  }

  private async textToSpeech(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = () => {
          console.error('Speech synthesis error');
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: just wait for estimated reading time
        const estimatedDuration = (text.split(' ').length / 2.5) * 1000; // ~150 words per minute
        setTimeout(resolve, estimatedDuration);
      }
    });
  }

  convertTextToAudio(text: string): ArrayBuffer {
    // This is a placeholder for actual text-to-speech audio conversion
    // In a real implementation, this would use the Web Speech API or
    // send the text to a backend TTS service
    // For now, we'll use the speechSynthesis API directly in textToSpeech

    // Return empty buffer as placeholder
    return new ArrayBuffer(0);
  }

  get progress(): number {
    if (!this.currentScenario) return 0;
    return (this.currentExchangeIndex / this.currentScenario.exchanges.length) * 100;
  }

  get currentExchange(): number {
    return this.currentExchangeIndex;
  }

  get totalExchanges(): number {
    return this.currentScenario?.exchanges.length || 0;
  }

  get playing(): boolean {
    return this.isRunning && !this.isPaused;
  }
}
