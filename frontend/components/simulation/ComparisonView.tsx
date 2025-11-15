'use client';

import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalIntake } from '@/types';

interface ComparisonViewProps {
  expected: MedicalIntake;
  actual: MedicalIntake | null;
}

export function ComparisonView({ expected, actual }: ComparisonViewProps) {
  const compareField = (
    expectedValue: any,
    actualValue: any
  ): 'match' | 'mismatch' | 'pending' => {
    if (!actualValue) return 'pending';
    if (JSON.stringify(expectedValue) === JSON.stringify(actualValue))
      return 'match';
    return 'mismatch';
  };

  const getStatusIcon = (status: 'match' | 'mismatch' | 'pending') => {
    switch (status) {
      case 'match':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'mismatch':
        return <X className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <span className="text-xs text-muted-foreground">⏳</span>;
    }
  };

  const getStatusBadge = (status: 'match' | 'mismatch' | 'pending') => {
    switch (status) {
      case 'match':
        return <Badge className="bg-green-500">Match</Badge>;
      case 'mismatch':
        return <Badge className="bg-red-500">Mismatch</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const chiefComplaintStatus = compareField(
    expected.chief_complaint,
    actual?.chief_complaint
  );
  const durationType = compareField(expected.duration, actual?.duration);
  const severityStatus = compareField(expected.severity, actual?.severity);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expected vs Actual</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            {/* Chief Complaint */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(chiefComplaintStatus)}
                <span className="text-sm font-medium">Chief Complaint</span>
              </div>
              {getStatusBadge(chiefComplaintStatus)}
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(durationType)}
                <span className="text-sm font-medium">Duration</span>
              </div>
              {getStatusBadge(durationType)}
            </div>

            {/* Severity */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(severityStatus)}
                <span className="text-sm font-medium">Severity</span>
              </div>
              {getStatusBadge(severityStatus)}
            </div>

            {/* Medications */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(
                  compareField(
                    expected.current_medications,
                    actual?.current_medications
                  )
                )}
                <span className="text-sm font-medium">Medications</span>
              </div>
              {getStatusBadge(
                compareField(
                  expected.current_medications,
                  actual?.current_medications
                )
              )}
            </div>

            {/* Allergies */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(
                  compareField(expected.allergies, actual?.allergies)
                )}
                <span className="text-sm font-medium">Allergies</span>
              </div>
              {getStatusBadge(
                compareField(expected.allergies, actual?.allergies)
              )}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            {/* Chief Complaint Detailed */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Chief Complaint</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                  <p className="font-semibold mb-1">Expected:</p>
                  <p>{expected.chief_complaint}</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <p className="font-semibold mb-1">Actual:</p>
                  <p>{actual?.chief_complaint || 'Pending...'}</p>
                </div>
              </div>
            </div>

            {/* Duration Detailed */}
            {expected.duration && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Duration</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                    <p className="font-semibold mb-1">Expected:</p>
                    <p>{expected.duration}</p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="font-semibold mb-1">Actual:</p>
                    <p>{actual?.duration || 'Pending...'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Severity Detailed */}
            {expected.severity && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Severity</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                    <p className="font-semibold mb-1">Expected:</p>
                    <p>{expected.severity}</p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="font-semibold mb-1">Actual:</p>
                    <p>{actual?.severity || 'Pending...'}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
