'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Clock, Mic, FileText } from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';
import { BackgroundParticles } from '@/components/effects/BackgroundParticles';
import { SoundWaveCoreOrb } from '@/components/voice/orbs/SoundWaveCoreOrb';

export function WelcomeScreen() {
  const { nextStep } = useFlowStore();

  const features = [
    {
      icon: <Mic className="w-4 h-4" />,
      title: 'Voice-First',
      description: 'Simply speak',
    },
    {
      icon: <Clock className="w-4 h-4" />,
      title: '3-5 Minutes',
      description: 'Quick process',
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: 'HIPAA Secure',
      description: 'Private & encrypted',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: 'Review & Edit',
      description: 'Confirm first',
    },
  ];

  return (
    <div className="min-h-screen bg-zen-gray-50 flex items-center justify-center p-6 relative">
      <BackgroundParticles />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-xl w-full relative z-10"
      >
        {/* Minimal Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-8xl font-light mb-3 text-zen-black tracking-tight"
          >
            Medical Intake
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-lg md:text-xl text-zen-gray-600 max-w-sm mx-auto"
          >
            Speak naturally. We handle the rest.
          </motion.p>
        </div>

        {/* Orb Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="flex justify-center mb-12"
        >
          <SoundWaveCoreOrb
            layoutId="voice-orb"
            state="idle"
            audioLevel={0}
            onClick={() => {}}
            size={280}
          />
        </motion.div>

        {/* Minimal Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
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
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="glass-zen-card p-4 mb-6 border-l-2 border-zen-green"
        >
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
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-2"
        >
          <Button
            size="lg"
            className="w-full h-12 text-base font-medium bg-zen-black hover:bg-zen-gray-900"
            onClick={nextStep}
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Voice Intake
          </Button>

        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-zen-gray-500 mt-6"
        >
          By continuing, you agree to our Terms and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}
