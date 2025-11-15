'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/store/flow-store';
import { useIntakeStore } from '@/store/intake-store';
import { Medication, Allergy } from '@/types';
import {
  CheckCircle2,
  Edit,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function ReviewScreen() {
  const { nextStep, previousStep } = useFlowStore();
  const {
    extractedData,
    editField,
    addMedication,
    editMedication,
    removeMedication,
    addAllergy,
    editAllergy,
    removeAllergy,
  } = useIntakeStore();

  const [editingComplaint, setEditingComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState(extractedData?.chief_complaint || '');

  const [medicationDialog, setMedicationDialog] = useState(false);
  const [currentMedication, setCurrentMedication] = useState<Medication | null>(null);
  const [medicationIndex, setMedicationIndex] = useState<number | null>(null);

  const [allergyDialog, setAllergyDialog] = useState(false);
  const [currentAllergy, setCurrentAllergy] = useState<Allergy | null>(null);
  const [allergyIndex, setAllergyIndex] = useState<number | null>(null);

  const handleSaveComplaint = () => {
    editField('chief_complaint', complaintText);
    setEditingComplaint(false);
    toast.success('Chief complaint updated');
  };

  const handleAddMedication = () => {
    setCurrentMedication({ name: '', dose: '', frequency: '' });
    setMedicationIndex(null);
    setMedicationDialog(true);
  };

  const handleEditMedication = (index: number) => {
    setCurrentMedication(extractedData!.current_medications[index]);
    setMedicationIndex(index);
    setMedicationDialog(true);
  };

  const handleSaveMedication = () => {
    if (!currentMedication?.name) {
      toast.error('Medication name is required');
      return;
    }

    if (medicationIndex !== null) {
      editMedication(medicationIndex, currentMedication);
      toast.success('Medication updated');
    } else {
      addMedication(currentMedication);
      toast.success('Medication added');
    }

    setMedicationDialog(false);
    setCurrentMedication(null);
    setMedicationIndex(null);
  };

  const handleRemoveMedication = (index: number) => {
    removeMedication(index);
    toast.success('Medication removed');
  };

  const handleAddAllergy = () => {
    setCurrentAllergy({ allergen: '', reaction: [], severity: 'mild' });
    setAllergyIndex(null);
    setAllergyDialog(true);
  };

  const handleEditAllergy = (index: number) => {
    setCurrentAllergy(extractedData!.allergies[index]);
    setAllergyIndex(index);
    setAllergyDialog(true);
  };

  const handleSaveAllergy = () => {
    if (!currentAllergy?.allergen) {
      toast.error('Allergen is required');
      return;
    }

    if (allergyIndex !== null) {
      editAllergy(allergyIndex, currentAllergy);
      toast.success('Allergy updated');
    } else {
      addAllergy(currentAllergy);
      toast.success('Allergy added');
    }

    setAllergyDialog(false);
    setCurrentAllergy(null);
    setAllergyIndex(null);
  };

  const handleRemoveAllergy = (index: number) => {
    removeAllergy(index);
    toast.success('Allergy removed');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Review Your Information</span>
            <span className="text-xs text-muted-foreground">Step 2 of 3</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '33%' }}
              animate={{ width: '66%' }}
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Information</h2>
            <p className="text-sm text-muted-foreground">
              Please review and edit if needed. All changes are saved automatically.
            </p>
          </motion.div>

          {/* Chief Complaint Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-foreground">Chief Complaint</h3>
                </div>
                {!editingComplaint && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingComplaint(true)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {editingComplaint ? (
                <div className="space-y-3">
                  <Textarea
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Describe your main concern..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveComplaint}>Save</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setComplaintText(extractedData?.chief_complaint || '');
                        setEditingComplaint(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground">{extractedData?.chief_complaint || 'Not provided'}</p>
              )}
            </Card>
          </motion.div>

          {/* Current Medications Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-foreground">
                    Current Medications ({extractedData?.current_medications?.length || 0})
                  </h3>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddMedication}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add New
                </Button>
              </div>

              <div className="space-y-3">
                {extractedData?.current_medications?.length ? (
                  extractedData.current_medications.map((med, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{med.name}</p>
                        {med.dose && (
                          <p className="text-sm text-muted-foreground">
                            {med.dose}
                            {med.frequency && `, ${med.frequency}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditMedication(index)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMedication(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No medications reported</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Allergies Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {extractedData?.allergies?.length ? (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                  <h3 className="font-semibold text-foreground">
                    Allergies ({extractedData?.allergies?.length || 0})
                  </h3>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddAllergy}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add New
                </Button>
              </div>

              <div className="space-y-3">
                {extractedData?.allergies?.length ? (
                  extractedData.allergies.map((allergy, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{allergy.allergen}</p>
                        <p className="text-sm text-muted-foreground">
                          Severity: {allergy.severity}
                        </p>
                        {allergy.reaction?.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Reaction: {allergy.reaction.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditAllergy(index)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAllergy(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No known allergies</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Medical History Card */}
          {extractedData?.past_medical_history?.conditions &&
            extractedData.past_medical_history.conditions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <h3 className="font-semibold text-foreground">Medical History</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {extractedData.past_medical_history.conditions.map((condition, index) => (
                      <li key={index} className="text-foreground">
                        {condition}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 pt-6"
          >
            <Button size="lg" variant="outline" onClick={previousStep} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button size="lg" onClick={nextStep} className="flex-1">
              Continue to Confirmation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Medication Dialog */}
      <Dialog open={medicationDialog} onOpenChange={setMedicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {medicationIndex !== null ? 'Edit Medication' : 'Add Medication'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="med-name">Medication Name *</Label>
              <Input
                id="med-name"
                value={currentMedication?.name || ''}
                onChange={(e) =>
                  setCurrentMedication({ ...currentMedication!, name: e.target.value })
                }
                placeholder="e.g., Aspirin"
              />
            </div>
            <div>
              <Label htmlFor="med-dose">Dose</Label>
              <Input
                id="med-dose"
                value={currentMedication?.dose || ''}
                onChange={(e) =>
                  setCurrentMedication({ ...currentMedication!, dose: e.target.value })
                }
                placeholder="e.g., 325mg"
              />
            </div>
            <div>
              <Label htmlFor="med-frequency">Frequency</Label>
              <Input
                id="med-frequency"
                value={currentMedication?.frequency || ''}
                onChange={(e) =>
                  setCurrentMedication({ ...currentMedication!, frequency: e.target.value })
                }
                placeholder="e.g., Once daily"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMedicationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMedication}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allergy Dialog */}
      <Dialog open={allergyDialog} onOpenChange={setAllergyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{allergyIndex !== null ? 'Edit Allergy' : 'Add Allergy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="allergen">Allergen *</Label>
              <Input
                id="allergen"
                value={currentAllergy?.allergen || ''}
                onChange={(e) =>
                  setCurrentAllergy({ ...currentAllergy!, allergen: e.target.value })
                }
                placeholder="e.g., Penicillin"
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={currentAllergy?.severity || 'mild'}
                onValueChange={(value) =>
                  setCurrentAllergy({
                    ...currentAllergy!,
                    severity: value as Allergy['severity'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="serious">Serious</SelectItem>
                  <SelectItem value="life-threatening">Life-Threatening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reaction">Reaction</Label>
              <Input
                id="reaction"
                value={currentAllergy?.reaction?.join(', ') || ''}
                onChange={(e) =>
                  setCurrentAllergy({
                    ...currentAllergy!,
                    reaction: e.target.value.split(',').map((r) => r.trim()),
                  })
                }
                placeholder="e.g., Rash, Hives"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllergyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAllergy}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
