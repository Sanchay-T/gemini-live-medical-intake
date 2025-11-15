'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Ripple } from '@/components/ui/ripple';
import { useFlowStore } from '@/store/flow-store';
import { useAudioStore } from '@/store/audio-store';
import { useConversationStore } from '@/store/conversation-store';
import { useIntakeStore } from '@/store/intake-store';
import { AudioManager } from '@/lib/audio-manager';
import { WebSocketClient } from '@/lib/websocket-client';
import {
  ArrowRight,
  Mic,
  MicOff,
  User,
  Bot,
  Circle,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      console.log('[ConversationScreen] Turn complete - finalizing current message');
      finalizeCurrentMessage();
    });
    wsClient.onIntakeComplete((message) => {
      console.log('[ConversationScreen] 🎉 INTAKE COMPLETE -', message);
      // Show success notification
      toast.success('Intake complete! Reviewing your information...', {
        duration: 3000,
        icon: '✅',
      });
      // Auto-navigate to review screen
      setTimeout(() => {
        console.log('[ConversationScreen] Auto-navigating to review screen');
        teardownSession();
        nextStep();
      }, 1500); // Brief delay to show the toast
    });

    wsClientRef.current = wsClient;
    wsClient.connect().catch((error) => setError('Failed to connect'));

    return () => {
      teardownSession();
    };
  }, [appendTranscriptChunk, finalizeCurrentMessage, setConnected, setData, setError, setState, teardownSession]);

  useEffect(() => {
    if (extractedData?.chief_complaint) updateProgress('chiefComplaint', true);
    if (extractedData?.current_medications?.length) updateProgress('medications', true);
    if (extractedData?.allergies?.length) updateProgress('allergies', true);
    if (extractedData?.past_medical_history?.conditions?.length) updateProgress('medicalHistory', true);
    if (extractedData?.social_history) updateProgress('socialHistory', true);
  }, [extractedData]);

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

      // Initialize playback AudioContext from user gesture (fixes autoplay policy)
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
      toast.success('Listening... Speak now');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar - More Premium */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            {/* Left - Title & Status */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Medical Intake</h1>
                <p className="text-sm text-muted-foreground">Voice-first patient conversation</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border shadow-sm">
                <Circle className={`w-2 h-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'} animate-pulse`} />
                <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Right - Progress */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium">Step 1 of 3</span>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '33%' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Modern SaaS Grid */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-5 gap-6 h-[calc(100vh-180px)]">

          {/* LEFT - Microphone Control (2 columns) */}
          <div className="col-span-2 flex flex-col gap-5 min-h-0">
            {/* Main Voice Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-card border border-border rounded-3xl shadow-lg overflow-hidden"
            >
              <div className="h-full flex flex-col items-center justify-center p-10 relative">
                {/* Ripple Effect */}
                {isActive && (
                  <Ripple
                    mainCircleSize={180}
                    mainCircleOpacity={0.15}
                    numCircles={6}
                  />
                )}

                {/* Microphone Button - More Premium */}
                <div className="relative mb-16">
                  <motion.button
                    onClick={handleToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative w-48 h-48 rounded-full
                      flex items-center justify-center
                      transition-all duration-500
                      ${isActive
                        ? 'bg-primary shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]'
                        : 'bg-secondary/50 hover:bg-secondary shadow-md border border-border/50'
                      }
                    `}
                  >
                    {isActive ? (
                      <Mic className="w-20 h-20 text-primary-foreground" strokeWidth={1.5} />
                    ) : (
                      <MicOff className="w-20 h-20 text-muted-foreground" strokeWidth={1.5} />
                    )}

                    {/* Recording Indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
                      >
                        <Circle className="w-1.5 h-1.5 fill-current animate-pulse" />
                        REC
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Audio Visualizer - More Sophisticated */}
                  {isActive && (
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-end justify-center gap-[3px] h-14 w-full max-w-xs">
                      {[...Array(48)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 bg-primary/80 rounded-full min-w-[2px]"
                          animate={{
                            height: [
                              `${25 + Math.random() * 15}%`,
                              `${45 + Math.random() * 35}%`,
                              `${25 + Math.random() * 15}%`,
                            ],
                          }}
                          transition={{
                            duration: 0.4 + Math.random() * 0.3,
                            repeat: Infinity,
                            delay: i * 0.02,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Text - Better Hierarchy */}
                <motion.div
                  key={state}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-3 mt-8"
                >
                  <div className="flex items-center justify-center gap-2.5">
                    {isActive && <Activity className="w-5 h-5 text-primary animate-pulse" />}
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                      {state === 'listening' && 'Listening...'}
                      {state === 'processing' && 'Processing...'}
                      {state === 'speaking' && 'AI Responding...'}
                      {state === 'idle' && 'Ready to Start'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    {isActive
                      ? 'Speak naturally about your symptoms and medical history'
                      : 'Click the microphone to begin your medical intake conversation'
                    }
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Continue Button - More Prominent */}
            {canProceed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  size="lg"
                  onClick={() => {
                    teardownSession();
                    nextStep();
                  }}
                  className="w-full h-16 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Continue to Review
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>

          {/* RIGHT - Transcript (3 columns) */}
          <div className="col-span-3 flex flex-col min-h-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full bg-card border border-border rounded-3xl shadow-lg flex flex-col overflow-hidden min-h-0"
            >
              {/* Header - More Refined */}
              <div className="border-b border-border bg-secondary/30 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                    <Bot className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Live Transcript</h2>
                    <p className="text-sm text-muted-foreground">Real-time conversation with AI assistant</p>
                  </div>
                  {messages.length > 0 && (
                    <div className="px-3 py-1.5 bg-background rounded-full border border-border">
                      <span className="text-xs font-semibold text-muted-foreground">{messages.length} messages</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages - Better Spacing */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 pr-4">
                <AnimatePresence mode="popLayout">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex items-center justify-center"
                    >
                      <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-border/50">
                          <Mic className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                          Start Speaking
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Click the microphone button to begin your conversation. Your dialogue with the AI assistant will appear here in real-time.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-4 ${message.role === 'patient' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar - Better Design */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                          message.role === 'patient'
                            ? 'bg-primary'
                            : 'bg-secondary border border-border/50'
                        }`}>
                          {message.role === 'patient' ? (
                            <User className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
                          ) : (
                            <Bot className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
                          )}
                        </div>

                        {/* Message Bubble - More Polished */}
                        <div className={`flex-1 max-w-[80%]`}>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide uppercase">
                            {message.role === 'patient' ? 'You' : 'AI Assistant'}
                          </p>
                          <div
                            className={`px-5 py-4 rounded-2xl shadow-sm ${
                              message.role === 'patient'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/50 text-foreground border border-border/50'
                            }`}
                          >
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
                <div ref={transcriptEndRef} />
              </div>

              {/* Typing Indicator - More Refined */}
              {state === 'speaking' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-6 pb-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary border border-border/50 rounded-xl flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
                    </div>
                    <div className="bg-secondary/50 border border-border/50 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Typing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
