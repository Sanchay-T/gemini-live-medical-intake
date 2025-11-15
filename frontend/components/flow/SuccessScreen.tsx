'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFlowStore } from '@/store/flow-store';
import { useIntakeStore } from '@/store/intake-store';
import { useConversationStore } from '@/store/conversation-store';
import { CheckCircle2, Download, RefreshCw, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SuccessScreen() {
  const { reset: resetFlow } = useFlowStore();
  const { clearData } = useIntakeStore();
  const { clearConversation } = useConversationStore();
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    // Generate a unique reference number
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    setReferenceNumber(`INT-${timestamp}-${random}`);
  }, []);

  const handleDownloadSummary = () => {
    // In production, this would download a PDF
    toast.success('Summary download started (demo mode)');
  };

  const handleStartNew = () => {
    resetFlow();
    clearData();
    clearConversation();
    toast.success('Ready for a new intake');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center space-y-8"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.5,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className="flex justify-center"
          >
            <div className="w-32 h-32 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-20 h-20 text-success" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Intake Complete!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your information has been securely sent to your healthcare provider.
            </p>
          </motion.div>

          {/* What Happens Next Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 text-left">
              <h2 className="font-semibold text-foreground mb-4 text-lg">What Happens Next:</h2>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <span className="text-foreground">
                    Your medical intake has been submitted successfully
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <span className="text-foreground">
                    Please remain in the waiting room or check your phone for updates
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <span className="text-foreground">
                    Your healthcare provider will review your information
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <span className="text-foreground">
                    You'll be called shortly for your appointment
                  </span>
                </li>
              </ol>
            </Card>
          </motion.div>

          {/* Reference Number */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-secondary/50 border border-border rounded-lg p-4"
          >
            <p className="text-xs text-muted-foreground mb-1">Reference Number</p>
            <p className="text-lg font-mono font-semibold text-foreground">{referenceNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Save this for your records
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14"
              onClick={handleDownloadSummary}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Summary PDF
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-14"
              onClick={handleStartNew}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Start New Intake
            </Button>
          </motion.div>

          {/* Help Contact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-4 border-t border-border"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>Need help? Contact reception at extension 100</span>
            </div>
          </motion.div>

          {/* Privacy Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-muted-foreground"
          >
            Your information is protected under HIPAA and stored securely
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
