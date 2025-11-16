'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useFlowStore } from '@/store/flow-store';
import { UnifiedIntakeScreen } from './UnifiedIntakeScreen';
import { ReviewScreen } from './ReviewScreen';
import { ConfirmationScreen } from './ConfirmationScreen';
import { SuccessScreen } from './SuccessScreen';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.4, 0, 0.2, 1] as const,
  duration: 0.3,
};

interface Props {
  apiKey?: string | null;
}

export function IntakeFlow({ apiKey }: Props) {
  const { currentStep } = useFlowStore();

  return (
    <AnimatePresence mode="wait">
      {(currentStep === 'welcome' || currentStep === 'conversation') && (
        <motion.div
          key="unified-intake"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <UnifiedIntakeScreen apiKey={apiKey} />
        </motion.div>
      )}

      {currentStep === 'review' && (
        <motion.div
          key="review"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <ReviewScreen />
        </motion.div>
      )}

      {currentStep === 'confirmation' && (
        <motion.div
          key="confirmation"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <ConfirmationScreen />
        </motion.div>
      )}

      {currentStep === 'success' && (
        <motion.div
          key="success"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <SuccessScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
