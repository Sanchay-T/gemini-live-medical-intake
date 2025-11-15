'use client';

import { Medication } from '@/types';
import { Badge } from '@/components/ui/badge';

interface MedicationsListProps {
  medications: Medication[];
}

export function MedicationsList({ medications }: MedicationsListProps) {
  return (
    <div>
      <h4 className="font-semibold mb-2">Current Medications</h4>
      <div className="space-y-3">
        {medications.map((med, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">{med.name}</p>
                {med.dose && (
                  <p className="text-xs text-muted-foreground">Dose: {med.dose}</p>
                )}
                {med.frequency && (
                  <p className="text-xs text-muted-foreground">
                    Frequency: {med.frequency}
                  </p>
                )}
                {med.indication && (
                  <p className="text-xs text-muted-foreground">
                    For: {med.indication}
                  </p>
                )}
              </div>
              {med.effectiveness && (
                <Badge variant="outline" className="text-xs">
                  {med.effectiveness}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
