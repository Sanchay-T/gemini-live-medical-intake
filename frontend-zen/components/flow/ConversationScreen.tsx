'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/store/flow-store';
import { useAudioStore } from '@/store/audio-store';
import { useConversationStore } from '@/store/conversation-store';
import { useIntakeStore } from '@/store/intake-store';
import { AudioManager } from '@/lib/audio-manager';
import { WebSocketClient } from '@/lib/websocket-client';
import { ArrowRight, User, Bot, Circle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SoundWaveCoreOrb } from '@/components/voice/orbs/SoundWaveCoreOrb';
import { BackgroundParticles } from '@/components/effects/BackgroundParticles';

export function ConversationScreen() {
  const [isActive, setIsActive] = useState(false);
  const { nextStep, updateProgress } = useFlowStore();
  const { state, audioLevel, isConnected, setState, setAudioLevel, setConnected, setError } = useAudioStore();
  const { messages, appendTranscriptChunk, finalizeCurrentMessage } = useConversationStore();
  const { setData, extractedData } = useIntakeStore();

  const audioManagerRef = useRef<AudioManager | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const teardownSession = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    audioManagerRef.current?.stopCapture();
    setIsActive(false);
    setState('idle');
    setAudioLevel(0);

    if (wsClientRef.current) {
      try {
        wsClientRef.current.sendControl('stop');
        wsClientRef.current.endSession();
      } catch (error) {
        console.warn('Failed to send end-session control', error);
      }
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }

    setConnected(false);
  }, [setAudioLevel, setConnected, setState]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const wsClient = new WebSocketClient(wsUrl);

    wsClient.onConnected(() => setConnected(true));
    wsClient.onDisconnected(() => setConnected(false));
    wsClient.onStatusUpdate((status) => setState(status as any));
    wsClient.onDataExtracted((data) => setData(data));
    wsClient.onError((error) => setError(error.message));
    wsClient.onTranscript((payload) => {
      const role = payload.role === 'assistant' ? 'ai' : 'patient';
      appendTranscriptChunk(role, payload.text);
    });
    wsClient.onAudio((audioBuffer) => {
      if (audioManagerRef.current) {
        audioManagerRef.current.playAudio(audioBuffer);
      }
    });
    wsClient.onTurnComplete(() => {
      finalizeCurrentMessage();
    });
    wsClient.onIntakeComplete((message) => {
      toast.success('Intake complete!', { duration: 3000 });
      setTimeout(() => {
        teardownSession();
        nextStep();
      }, 1500);
    });

    wsClientRef.current = wsClient;
    wsClient.connect().catch((error) => setError('Failed to connect'));

    return () => {
      teardownSession();
    };
  }, [appendTranscriptChunk, finalizeCurrentMessage, setConnected, setData, setError, setState, teardownSession, nextStep]);

  useEffect(() => {
    if (extractedData?.chief_complaint) updateProgress('chiefComplaint', true);
    if (extractedData?.current_medications?.length) updateProgress('medications', true);
    if (extractedData?.allergies?.length) updateProgress('allergies', true);
    if (extractedData?.past_medical_history?.conditions?.length) updateProgress('medicalHistory', true);
    if (extractedData?.social_history) updateProgress('socialHistory', true);
  }, [extractedData, updateProgress]);

  const updateAudioLevel = () => {
    if (audioManagerRef.current && isActive) {
      const level = audioManagerRef.current.getAudioLevel();
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const handleStartVoice = async () => {
    try {
      if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager();
      }

      const hasAccess = await audioManagerRef.current.requestMicrophoneAccess();
      if (!hasAccess) {
        toast.error('Microphone access denied');
        return;
      }

      await audioManagerRef.current.initializePlayback();
      await audioManagerRef.current.startCapture();
      audioManagerRef.current.onAudioData((audioData) => {
        if (wsClientRef.current) {
          wsClientRef.current.sendAudio(audioData);
        }
      });

      setIsActive(true);
      setState('listening');
      wsClientRef.current?.sendControl('start');
      updateAudioLevel();
      toast.success('Listening...');
    } catch (error) {
      toast.error('Failed to start microphone');
    }
  };

  const handleStopVoice = () => {
    audioManagerRef.current?.stopCapture();
    setIsActive(false);
    setState('idle');
    setAudioLevel(0);
    wsClientRef.current?.sendControl('stop');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleToggle = () => {
    if (isActive) {
      handleStopVoice();
    } else {
      handleStartVoice();
    }
  };

  const canProceed = extractedData?.chief_complaint || messages.length >= 2;
  const showTranscript = messages.length >= 2;

  return (
    <div className="min-h-screen bg-zen-gray-50 relative">
      <BackgroundParticles />

      {/* Minimal Header */}
      <div className="sticky top-0 z-50 glass-zen-overlay border-b border-zen-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-zen-black">Medical Intake</h1>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zen-white border border-zen-gray-200">
                <Circle className={`w-1.5 h-1.5 ${isConnected ? 'fill-zen-green text-zen-green' : 'fill-zen-gray-400 text-zen-gray-400'}`} />
                <span className="text-xs text-zen-gray-600 uppercase tracking-wide">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zen-gray-500">Step 1/3</span>
              <div className="w-20 h-1 bg-zen-gray-200 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '33%' }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-zen-black"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered Orb */}
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Voice Orb Section */}
          <div className="flex flex-col items-center mb-16">
            <SoundWaveCoreOrb
              layoutId="voice-orb"
              state={state}
              audioLevel={audioLevel}
              onClick={handleToggle}
              size={400}
            />

            <motion.div
              key={state}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-medium text-zen-black mb-1">
                {state === 'listening' && 'Listening'}
                {state === 'processing' && 'Processing'}
                {state === 'speaking' && 'AI Speaking'}
                {state === 'idle' && 'Ready'}
              </h2>
              <p className="text-sm text-zen-gray-600">
                {isActive ? 'Speak naturally' : 'Click to begin'}
              </p>
            </motion.div>

            {canProceed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <Button
                  size="lg"
                  onClick={() => {
                    teardownSession();
                    nextStep();
                  }}
                  className="h-10 text-sm font-medium bg-zen-black hover:bg-zen-gray-900"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>

          {/* Transcript Section - Show after 2 messages */}
          {messages.length >= 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="glass-zen-card overflow-hidden">
              <div className="border-b border-zen-gray-200 px-4 py-3 bg-zen-gray-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zen-black uppercase tracking-wide">Transcript</h3>
                  {messages.length > 0 && (
                    <span className="text-xs text-zen-gray-500">{messages.length}</span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-3 ${message.role === 'patient' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 ${
                          message.role === 'patient' ? 'bg-zen-black' : 'bg-zen-gray-200'
                        }`}>
                          {message.role === 'patient' ? (
                            <User className="w-3 h-3 text-zen-white" />
                          ) : (
                            <Bot className="w-3 h-3 text-zen-gray-600" />
                          )}
                        </div>

                        <div className="flex-1 max-w-[80%]">
                          <p className={`text-xs px-3 py-2 ${
                            message.role === 'patient'
                              ? 'bg-zen-black text-zen-white'
                              : 'bg-zen-gray-100 text-zen-gray-900'
                          }`}>
                            {message.content}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  }
                </AnimatePresence>
                <div ref={transcriptEndRef} />

                {state === 'speaking' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 bg-zen-gray-200 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-zen-gray-600" />
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 bg-zen-gray-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
