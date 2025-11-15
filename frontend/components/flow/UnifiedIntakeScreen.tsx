'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpring, animated, config } from 'react-spring';
import { Button } from '@/components/ui/button';
import { Shield, Clock, Mic, FileText, User, Bot, Circle, ArrowRight } from 'lucide-react';
import { useAudioStore } from '@/store/audio-store';
import { useConversationStore } from '@/store/conversation-store';
import { useIntakeStore } from '@/store/intake-store';
import { useFlowStore } from '@/store/flow-store';
import { useApiKeyStore } from '@/store/api-key-store';
import { AudioManager } from '@/lib/audio-manager';
import { WebSocketClient } from '@/lib/websocket-client';
import { SoundWaveCoreOrb } from '@/components/voice/orbs/SoundWaveCoreOrb';
import { BackgroundParticles } from '@/components/effects/BackgroundParticles';
import { toast } from 'react-hot-toast';

export function UnifiedIntakeScreen() {
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const { nextStep, updateProgress } = useFlowStore();
  const { state, audioLevel, isConnected, setState, setAudioLevel, setConnected, setError } = useAudioStore();
  const { messages, appendTranscriptChunk, finalizeCurrentMessage } = useConversationStore();
  const { setData, extractedData } = useIntakeStore();
  const { apiKey } = useApiKeyStore();

  const audioManagerRef = useRef<AudioManager | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const features = [
    { icon: <Mic className="w-4 h-4" />, title: 'Voice-First', description: 'Simply speak' },
    { icon: <Clock className="w-4 h-4" />, title: '3-5 Minutes', description: 'Quick process' },
    { icon: <Shield className="w-4 h-4" />, title: 'HIPAA Secure', description: 'Private & encrypted' },
    { icon: <FileText className="w-4 h-4" />, title: 'Review & Edit', description: 'Confirm first' },
  ];

  // Animations with React Spring
  const welcomeAnimation = useSpring({
    opacity: isConversationMode ? 0 : 1,
    transform: isConversationMode
      ? 'translateY(-50px) scale(0.95)'
      : 'translateY(0px) scale(1)',
    config: { tension: 120, friction: 14 },
  });

  const cardsAnimation = useSpring({
    opacity: isConversationMode ? 0 : 1,
    transform: isConversationMode ? 'translateY(30px)' : 'translateY(0px)',
    config: { tension: 120, friction: 14 },
    delay: isConversationMode ? 0 : 100,
  });

  const conversationAnimation = useSpring({
    opacity: isConversationMode ? 1 : 0,
    transform: isConversationMode ? 'translateY(0px)' : 'translateY(30px)',
    config: { tension: 120, friction: 14 },
    delay: isConversationMode ? 300 : 0,
  });

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
    if (!isConversationMode) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const wsClient = new WebSocketClient(wsUrl, apiKey);

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
    wsClient.onTurnComplete(() => finalizeCurrentMessage());
    wsClient.onIntakeComplete((message) => {
      console.log('🏁 Intake complete signal received:', message);
      toast.success('Intake complete!', { duration: 3000 });
      setTimeout(() => {
        console.log('🚀 Navigating to next step...');
        teardownSession();
        nextStep();
      }, 1500);
    });

    wsClientRef.current = wsClient;
    wsClient.connect().catch((error) => setError('Failed to connect'));

    return () => {
      teardownSession();
    };
  }, [isConversationMode, appendTranscriptChunk, finalizeCurrentMessage, setConnected, setData, setError, setState, teardownSession, nextStep]);

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

  const handleStart = async () => {
    // Trigger animation to conversation mode
    setIsConversationMode(true);

    // Start audio after animation completes
    setTimeout(async () => {
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
    }, 800);
  };

  const handleToggle = () => {
    if (isActive) {
      audioManagerRef.current?.stopCapture();
      setIsActive(false);
      setState('idle');
      setAudioLevel(0);
      wsClientRef.current?.sendControl('stop');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      handleStartVoice();
    }
  };

  const handleStartVoice = async () => {
    try {
      if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager();
      }

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

  const canProceed = extractedData?.chief_complaint || messages.length >= 2;
  const showTranscript = messages.length >= 2;

  return (
    <div className="min-h-screen bg-zen-gray-50 relative overflow-hidden">
      <BackgroundParticles />

      {/* Conversation Header - Only visible in conversation mode */}
      {isConversationMode && (
        <animated.div style={conversationAnimation}>
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
                    <div style={{ width: '33%' }} className="h-full bg-zen-black transition-all duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </animated.div>
      )}

      {/* Main Content Container */}
      <div className={`relative z-10 ${
        isConversationMode ? 'h-screen flex flex-col' : 'flex items-center justify-center min-h-screen p-6'
      }`}>
        {/* Conversation Mode Layout */}
        {isConversationMode ? (
          <animated.div style={conversationAnimation} className="flex items-center justify-center h-full">
            <div className="max-w-xl w-full px-6">
              {/* Fixed Center Section - Orb, Status, Continue */}
              <div className="flex flex-col items-center">
                {/* Orb */}
                <div className="flex justify-center mb-8">
                  <SoundWaveCoreOrb
                    state={state}
                    audioLevel={audioLevel}
                    onClick={handleToggle}
                    size={280}
                  />
                </div>

                {/* Status */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-medium text-zen-black mb-1">
                    {state === 'listening' && 'Listening'}
                    {state === 'processing' && 'Processing'}
                    {state === 'speaking' && 'AI Speaking'}
                    {state === 'idle' && 'Ready'}
                  </h2>
                  <p className="text-sm text-zen-gray-600">
                    {isActive ? 'Speak naturally' : 'Click orb to begin'}
                  </p>
                </div>

                {/* Continue Button */}
                {canProceed && (
                  <div className="text-center mb-6">
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
                  </div>
                )}
              </div>

              {/* Fixed Transcript Box at Bottom */}
              {showTranscript && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6">
                  <div className="glass-zen-card overflow-hidden">
                    <div className="border-b border-zen-gray-200 px-4 py-3 bg-zen-gray-50/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-zen-black uppercase tracking-wide">Transcript</h3>
                        {messages.length > 0 && (
                          <span className="text-xs text-zen-gray-500">{messages.length}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
                      {messages.map((message, index) => (
                        <div
                          key={index}
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
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />

                      {state === 'speaking' && (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-zen-gray-200 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-zen-gray-600" />
                          </div>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-1 h-1 bg-zen-gray-400 animate-pulse"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </animated.div>
        ) : (
          /* Welcome Screen Layout */
          <div className="max-w-xl w-full">
            {/* Welcome Content */}
            <animated.div style={welcomeAnimation} className="text-center mb-12">
              <h1 className="text-7xl md:text-8xl font-light mb-3 text-zen-black tracking-tight">
                Medical Intake
              </h1>
              <p className="text-lg md:text-xl text-zen-gray-600 max-w-sm mx-auto">
                Speak naturally. We handle the rest.
              </p>
            </animated.div>

            {/* Orb - Always visible, centered */}
            <div className="flex justify-center mb-12">
              <SoundWaveCoreOrb
                state={state}
                audioLevel={audioLevel}
                onClick={() => {}}
                size={280}
              />
            </div>

            {/* Welcome Cards and CTA */}
            <animated.div style={cardsAnimation}>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="glass-zen-card p-4 hover:shadow-md transition-shadow duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zen-gray-100 flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold mb-0.5 text-zen-black">{feature.title}</h3>
                        <p className="text-base text-zen-gray-500">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-zen-card p-4 mb-6 border-l-2 border-zen-green">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-zen-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zen-black font-medium mb-1">
                      HIPAA Compliant & Encrypted
                    </p>
                    <p className="text-xs text-zen-gray-600 leading-relaxed">
                      Your medical information is secure and never shared without consent.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-base font-medium bg-zen-black hover:bg-zen-gray-900"
                onClick={handleStart}
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Voice Intake
              </Button>

              <p className="text-center text-xs text-zen-gray-500 mt-6">
                By continuing, you agree to our Terms and Privacy Policy
              </p>
            </animated.div>
          </div>
        )}
      </div>
    </div>
  );
}
