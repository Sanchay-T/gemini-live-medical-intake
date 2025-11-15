'use client';

import { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIntakeStore } from '@/store/intake-store';
import {
  FileText,
  Pill,
  AlertTriangle,
  Heart,
  Activity,
  X,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function DataSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

export function DataDrawer() {
  const { extractedData } = useIntakeStore();
  const [isOpen, setIsOpen] = useState(false);

  const hasData =
    extractedData?.chief_complaint ||
    (extractedData?.current_medications?.length ?? 0) > 0 ||
    (extractedData?.allergies?.length ?? 0) > 0 ||
    (extractedData?.past_medical_history?.conditions?.length ?? 0) > 0 ||
    extractedData?.social_history;

  const dataCount = [
    extractedData?.chief_complaint ? 1 : 0,
    extractedData?.current_medications?.length || 0,
    extractedData?.allergies?.length || 0,
    extractedData?.past_medical_history?.conditions?.length || 0,
    extractedData?.social_history ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 border border-border shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            <span>View Extracted Data</span>
            {dataCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {dataCount}
              </Badge>
            )}
          </Button>
        </div>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extracted Medical Data
          </DrawerTitle>
          <DrawerDescription>
            Review the medical information extracted from your conversation
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-30" />
              <p>No data extracted yet. Start your conversation to see data here.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full" defaultValue={['complaint']}>
              {/* Chief Complaint */}
              {extractedData?.chief_complaint && (
                <AccordionItem value="complaint">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-secondary border border-border rounded-md">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Chief Complaint</span>
                      <Badge variant="outline" className="ml-auto">
                        {extractedData.severity || 'N/A'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Complaint:
                        </span>
                        <p className="text-base">{extractedData.chief_complaint}</p>
                      </div>
                      {extractedData.duration && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            Duration:
                          </span>
                          <p className="text-base">{extractedData.duration}</p>
                        </div>
                      )}
                      {extractedData.location && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            Location:
                          </span>
                          <p className="text-base">{extractedData.location}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Medications */}
              {extractedData?.current_medications && extractedData.current_medications.length > 0 && (
                <AccordionItem value="medications">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-secondary border border-border rounded-md">
                        <Pill className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Current Medications</span>
                      <Badge variant="outline" className="ml-auto">
                        {extractedData.current_medications.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {extractedData.current_medications.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-muted/50 rounded-lg border border-border hover:border-foreground transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">{med.name}</h4>
                              <div className="mt-2 space-y-1">
                                {med.dose && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Dose:</span> {med.dose}
                                  </p>
                                )}
                                {med.frequency && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Frequency:</span>{' '}
                                    {med.frequency}
                                  </p>
                                )}
                              </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Allergies */}
              {extractedData?.allergies && extractedData.allergies.length > 0 && (
                <AccordionItem value="allergies">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-secondary border border-border rounded-md">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Allergies</span>
                      <Badge variant="outline" className="ml-auto">
                        {extractedData.allergies.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {extractedData.allergies.map((allergy, idx) => {
                        const isCritical = allergy.severity === 'life-threatening' || allergy.severity === 'serious';

                        return (
                          <div
                            key={idx}
                            className={cn(
                              'p-4 rounded-lg border-2',
                              isCritical
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-500'
                                : 'bg-muted/50 border-border'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base">{allergy.allergen}</h4>
                                {allergy.reaction && allergy.reaction.length > 0 && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    <span className="font-medium">Reaction:</span>{' '}
                                    {allergy.reaction.join(', ')}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={isCritical ? 'destructive' : 'outline'}
                                className="capitalize"
                              >
                                {allergy.severity || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Medical History */}
              {extractedData?.past_medical_history?.conditions && extractedData.past_medical_history.conditions.length > 0 && (
                <AccordionItem value="history">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-secondary border border-border rounded-md">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Medical History</span>
                      <Badge variant="outline" className="ml-auto">
                        {extractedData.past_medical_history.conditions.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {extractedData.past_medical_history.conditions.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Social History */}
              {extractedData?.social_history && (
                <AccordionItem value="social">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-secondary border border-border rounded-md">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Social History</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      {extractedData.social_history.smoking !== undefined && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            Smoking:
                          </span>
                          <p className="text-base">
                            {extractedData.social_history.smoking ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                      {extractedData.social_history.alcohol !== undefined && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            Alcohol:
                          </span>
                          <p className="text-base">
                            {extractedData.social_history.alcohol ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </ScrollArea>

        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" disabled={!hasData}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <DrawerClose asChild>
            <Button variant="secondary" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
