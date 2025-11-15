'use client';

import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scenario } from '@/types';

interface SimulationControlsProps {
  scenario: Scenario | null;
  isPlaying: boolean;
  currentExchange: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function SimulationControls({
  scenario,
  isPlaying,
  currentExchange,
  onPlay,
  onPause,
  onNext,
  onReset,
}: SimulationControlsProps) {
  if (!scenario) {
    return null;
  }

  const progress = (currentExchange / scenario.exchanges.length) * 100;
  const totalExchanges = scenario.exchanges.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="text-muted-foreground">
              {currentExchange} / {totalExchanges} exchanges
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isPlaying ? (
            <Button onClick={onPause} variant="outline" className="flex-1">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button onClick={onPlay} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              {currentExchange === 0 ? 'Start' : 'Resume'}
            </Button>
          )}

          <Button onClick={onNext} variant="outline" disabled={isPlaying}>
            <SkipForward className="w-4 h-4 mr-2" />
            Next
          </Button>

          <Button onClick={onReset} variant="outline">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Exchange Preview */}
        {currentExchange < totalExchanges && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Next Exchange:
            </p>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-semibold">AI:</span>{' '}
                <span className="text-muted-foreground">
                  {scenario.exchanges[currentExchange].ai}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Patient:</span>{' '}
                <span className="text-muted-foreground">
                  {scenario.exchanges[currentExchange].patient}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
