'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useFlowStore } from '@/store/flow-store';
import { useIntakeStore } from '@/store/intake-store';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function ConfirmationScreen() {
  const { nextStep, previousStep } = useFlowStore();
  const { extractedData } = useIntakeStore();
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isAgreed) {
      toast.error('Please confirm that your information is accurate');
      return;
    }

    setIsSubmitting(true);

    // Simulate API submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production, this would be an API call:
      // await fetch('/api/submit-intake', {
      //   method: 'POST',
      //   body: JSON.stringify(extractedData),
      // });

      toast.success('Medical intake submitted successfully!');
      nextStep();
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Confirm Your Information</span>
            <span className="text-xs text-muted-foreground">Step 3 of 3</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '66%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Confirm Your Information
            </h2>
            <p className="text-sm text-muted-foreground">
              Final review before submitting to your healthcare provider
            </p>
          </motion.div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 space-y-6">
              {/* Chief Complaint */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  CHIEF COMPLAINT
                </h3>
                <p className="text-foreground">{extractedData?.chief_complaint || 'Not provided'}</p>
              </div>

              {/* Current Medications */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  CURRENT MEDICATIONS ({extractedData?.current_medications?.length || 0})
                </h3>
                {extractedData?.current_medications?.length ? (
                  <ul className="space-y-2">
                    {extractedData.current_medications.map((med, index) => (
                      <li key={index} className="text-foreground">
                        <span className="font-medium">{med.name}</span>
                        {med.dose && <span className="text-muted-foreground"> - {med.dose}</span>}
                        {med.frequency && (
                          <span className="text-muted-foreground">, {med.frequency}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">None reported</p>
                )}
              </div>

              {/* Allergies */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  ALLERGIES ({extractedData?.allergies?.length || 0})
                </h3>
                {extractedData?.allergies?.length ? (
                  <ul className="space-y-2">
                    {extractedData.allergies.map((allergy, index) => (
                      <li key={index} className="text-foreground">
                        <span className="font-medium">{allergy.allergen}</span>
                        <span className="text-muted-foreground"> - {allergy.severity}</span>
                        {allergy.reaction?.length > 0 && (
                          <span className="text-muted-foreground">
                            {' '}
                            ({allergy.reaction.join(', ')})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No known allergies</p>
                )}
              </div>

              {/* Medical History */}
              {extractedData?.past_medical_history?.conditions &&
                extractedData.past_medical_history.conditions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      MEDICAL HISTORY
                    </h3>
                    <ul className="space-y-1">
                      {extractedData.past_medical_history.conditions.map((condition, index) => (
                        <li key={index} className="text-foreground">
                          • {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Social History */}
              {extractedData?.social_history && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    SOCIAL HISTORY
                  </h3>
                  <div className="space-y-1 text-foreground">
                    {extractedData.social_history.smoking && (
                      <p>Smoking: {extractedData.social_history.smoking}</p>
                    )}
                    {extractedData.social_history.alcohol && (
                      <p>Alcohol: {extractedData.social_history.alcohol}</p>
                    )}
                    {extractedData.social_history.occupation && (
                      <p>Occupation: {extractedData.social_history.occupation}</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Consent Checkbox */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={isAgreed}
                  onCheckedChange={(checked) => setIsAgreed(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="consent"
                  className="text-sm text-foreground leading-relaxed cursor-pointer"
                >
                  I confirm that this information is accurate to the best of my knowledge and
                  authorize its submission to my healthcare provider. I understand that this
                  information will be used for medical purposes and stored in accordance with
                  HIPAA regulations.
                </label>
              </div>
            </Card>
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 pt-6"
          >
            <Button
              size="lg"
              variant="outline"
              onClick={previousStep}
              className="flex-1"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              className="flex-1"
              disabled={!isAgreed || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm & Submit'
              )}
            </Button>
          </motion.div>

          {/* Help Text */}
          {!isAgreed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs text-muted-foreground"
            >
              Please check the consent box above to enable submission
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
