'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceButton } from './VoiceButton';
import { AudioVisualizer } from './AudioVisualizer';
import { VoiceStatus } from './VoiceStatus';
import { useAudioStore } from '@/store/audio-store';
import { useConversationStore } from '@/store/conversation-store';
import { useIntakeStore } from '@/store/intake-store';
import { AudioManager } from '@/lib/audio-manager';
import { WebSocketClient } from '@/lib/websocket-client';
import { normalizeMedicalIntake } from '@/lib/medical-intake';
import { VoiceMode, VoiceState } from '@/types';

interface VoiceInputProps {
  mode: VoiceMode;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceInput({ mode, onStart, onStop }: VoiceInputProps) {
  const [isActive, setIsActive] = useState(false);
  const { state, audioLevel, isConnected, setState, setAudioLevel, setConnected, setError } =
    useAudioStore();
  const { addMessage } = useConversationStore();
  const { setData } = useIntakeStore();

  const audioManagerRef = useRef<AudioManager | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager();
    }

    // Initialize WebSocket client
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const wsClient = new WebSocketClient(wsUrl);

    wsClient.onConnected(() => {
      setConnected(true);
      console.log('Connected to backend');
    });

    wsClient.onDisconnected(() => {
      setConnected(false);
      console.log('Disconnected from backend');
    });

    wsClient.onStatusUpdate((status) => {
      setState(normalizeVoiceState(status));
    });

    wsClient.onDataExtracted((data) => {
      setData(normalizeMedicalIntake(data));
    });

    wsClient.onAudio(async (chunk) => {
      if (!audioManagerRef.current) {
        audioManagerRef.current = new AudioManager();
      }
      await audioManagerRef.current.playAudioChunk(chunk);
      setState('speaking');
    });

    wsClient.onTranscript(({ role, text }) => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      const normalizedRole = role === 'assistant' ? 'ai' : 'patient';
      addMessage(normalizedRole, trimmed);

      if (role === 'assistant') {
        speak(trimmed);
      }
    });

    wsClient.onError((error) => {
      setError(error.message);
      console.error('WebSocket error:', error);
    });

    wsClientRef.current = wsClient;

    // Connect to WebSocket
    wsClient.connect().catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
      setError('Failed to connect to backend');
    });

    return () => {
      wsClient.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [addMessage, setConnected, setState, setData, setError]);

  const updateAudioLevel = () => {
    if (audioManagerRef.current && isActive) {
      const level = audioManagerRef.current.getAudioLevel();
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const handleClick = async () => {
    if (mode === 'simulation') {
      // In simulation mode, just toggle active state
      setIsActive(!isActive);
      if (!isActive) {
        onStart();
      } else {
        onStop();
      }
      return;
    }

    // Live mode
    if (!isActive) {
      // Start listening
      try {
        const hasAccess = await audioManagerRef.current!.requestMicrophoneAccess();
        if (!hasAccess) {
          setError('Microphone access denied');
          return;
        }

        await audioManagerRef.current!.startCapture();

        audioManagerRef.current!.onAudioData((audioData) => {
          if (wsClientRef.current) {
            wsClientRef.current.sendAudio(audioData);
          }
        });

        setIsActive(true);
        setState('listening');
        wsClientRef.current?.sendControl('start');
        onStart();

        // Start audio level updates
        updateAudioLevel();
      } catch (error) {
        console.error('Failed to start audio capture:', error);
        setError('Failed to start microphone');
      }
    } else {
      // Stop listening
      audioManagerRef.current?.stopCapture();
      setIsActive(false);
      setState('idle');
      setAudioLevel(0);
      wsClientRef.current?.sendControl('stop');
      onStop();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voice Input</span>
          <VoiceStatus state={state} isConnected={isConnected} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 py-8">
        <VoiceButton isActive={isActive} state={state} onClick={handleClick} />
        <AudioVisualizer audioLevel={audioLevel} isActive={isActive && state === 'listening'} />
      </CardContent>
    </Card>
  );
}

const speak = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
};

const normalizeVoiceState = (status: string): VoiceState => {
  switch (status) {
    case 'listening':
      return 'listening';
    case 'speaking':
      return 'speaking';
    case 'processing':
      return 'processing';
    case 'ready':
    case 'idle':
    default:
      return 'idle';
  }
};
