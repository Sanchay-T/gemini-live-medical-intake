'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useIntakeStore } from '@/store/intake-store';
import { MedicationsList } from './MedicationsList';
import { AllergiesAlert } from './AllergiesAlert';
import { ChiefComplaintCard } from './ChiefComplaintCard';

export function ExtractedDataCard() {
  const { extractedData } = useIntakeStore();

  if (!extractedData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Extracted Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No data extracted yet. Start the conversation to see extracted medical information.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Extracted Data</span>
            <Badge className="bg-green-500">Live Update</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chief Complaint */}
          <ChiefComplaintCard
            complaint={extractedData.chief_complaint}
            duration={extractedData.duration}
            severity={extractedData.severity}
          />

          <Separator />

          {/* Allergies */}
          {extractedData.allergies && extractedData.allergies.length > 0 && (
            <>
              <AllergiesAlert allergies={extractedData.allergies} />
              <Separator />
            </>
          )}

          {/* Medications */}
          {extractedData.current_medications && extractedData.current_medications.length > 0 && (
            <>
              <MedicationsList medications={extractedData.current_medications} />
              <Separator />
            </>
          )}

          {/* Medical History */}
          {extractedData.past_medical_history && (
            <div>
              <h4 className="font-semibold mb-2">Medical History</h4>
              {extractedData.past_medical_history.conditions && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Conditions:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {extractedData.past_medical_history.conditions.map((condition, i) => (
                      <li key={i}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Social History */}
          {extractedData.social_history && (
            <div>
              <h4 className="font-semibold mb-2">Social History</h4>
              <div className="space-y-1 text-sm">
                {extractedData.social_history.smoking && (
                  <p>
                    <span className="font-medium">Smoking:</span>{' '}
                    {extractedData.social_history.smoking}
                  </p>
                )}
                {extractedData.social_history.alcohol && (
                  <p>
                    <span className="font-medium">Alcohol:</span>{' '}
                    {extractedData.social_history.alcohol}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
