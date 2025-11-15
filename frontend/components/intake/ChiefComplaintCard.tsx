'use client';

import { Badge } from '@/components/ui/badge';

interface ChiefComplaintCardProps {
  complaint: string;
  duration?: string;
  severity?: string;
}

export function ChiefComplaintCard({
  complaint,
  duration,
  severity,
}: ChiefComplaintCardProps) {
  return (
    <div>
      <h4 className="font-semibold mb-2">Chief Complaint</h4>
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
        <p className="text-lg font-semibold mb-2">{complaint}</p>
        <div className="flex flex-wrap gap-2">
          {duration && (
            <Badge variant="outline">
              Duration: {duration}
            </Badge>
          )}
          {severity && (
            <Badge variant="outline">
              Severity: {severity}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
