'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Allergy } from '@/types';

interface AllergiesAlertProps {
  allergies: Allergy[];
}

export function AllergiesAlert({ allergies }: AllergiesAlertProps) {
  if (allergies.length === 0) {
    return null;
  }

  const hasSeriousAllergies = allergies.some(
    (allergy) => allergy.severity === 'serious' || allergy.severity === 'life-threatening'
  );

  return (
    <Alert variant={hasSeriousAllergies ? 'destructive' : 'default'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Allergies Reported</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          {allergies.map((allergy, index) => (
            <div
              key={index}
              className="border-l-2 border-red-500 pl-3 py-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{allergy.allergen}</span>
                <Badge
                  variant={
                    allergy.severity === 'life-threatening' ||
                    allergy.severity === 'serious'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {allergy.severity}
                </Badge>
              </div>
              {allergy.reaction && allergy.reaction.length > 0 && (
                <p className="text-xs">
                  Reactions: {allergy.reaction.join(', ')}
                </p>
              )}
              {allergy.requires_emergency_treatment && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  ⚠️ Requires emergency treatment
                </p>
              )}
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
