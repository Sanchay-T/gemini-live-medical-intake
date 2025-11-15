'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Clock, Mic, FileText, Camera } from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';
import { useIntakeStore } from '@/store/intake-store';
import { useConversationStore } from '@/store/conversation-store';
import { demoMessages, demoIntakeData } from '@/lib/demo-data';
import { toast } from 'react-hot-toast';

export function WelcomeScreen() {
  const { nextStep, setStep } = useFlowStore();
  const { setData } = useIntakeStore();
  const { setMessages } = useConversationStore();

  const loadDemoData = (targetScreen: 'conversation' | 'review' | 'confirmation') => {
    // Load demo messages
    setMessages(demoMessages);

    // Load demo intake data
    setData(demoIntakeData);

    // Navigate to target screen
    if (targetScreen === 'conversation') {
      setStep('conversation');
      toast.success('📸 Demo mode: Conversation Screen loaded');
    } else if (targetScreen === 'review') {
      setStep('review');
      toast.success('📸 Demo mode: Review Screen loaded');
    } else if (targetScreen === 'confirmation') {
      setStep('confirmation');
      toast.success('📸 Demo mode: Confirmation Screen loaded');
    }
  };

  const features = [
    {
      icon: <Mic className="w-5 h-5" />,
      title: 'Voice-First',
      description: 'Simply speak - no typing required',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: '3-5 Minutes',
      description: 'Quick and efficient process',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'HIPAA Compliant',
      description: 'Your data is secure and private',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Review & Edit',
      description: 'Confirm before submitting',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto">
              <Mic className="w-10 h-10 text-primary-foreground" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
          >
            Medical Intake
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground max-w-md mx-auto"
          >
            Complete your medical intake by speaking naturally. We'll handle the rest.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-secondary/50 border border-border rounded-lg p-4 mb-8"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">
                Your Privacy is Protected
              </p>
              <p className="text-xs text-muted-foreground">
                This conversation is HIPAA compliant and encrypted end-to-end. Your medical
                information is never shared without your explicit consent.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Demo Mode for Screenshots */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
          className="mb-6 p-5 bg-card border-2 border-dashed border-border rounded-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">📸 Screenshot Mode</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              Demo Data
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Jump to any screen with realistic demo data pre-loaded for documentation
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => loadDemoData('conversation')}
            >
              Step 1: Talk
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => loadDemoData('review')}
            >
              Step 2: Review
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => loadDemoData('confirmation')}
            >
              Step 3: Confirm
            </Button>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            onClick={nextStep}
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Voice Intake
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-14"
            onClick={() => {
              // Skip to manual form (future feature)
              console.log('Manual form not yet implemented');
            }}
          >
            <FileText className="w-5 h-5 mr-2" />
            Fill Form Manually
          </Button>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}
