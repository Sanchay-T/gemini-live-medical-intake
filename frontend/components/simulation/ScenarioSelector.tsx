'use client';

import { Scenario } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: Scenario | null;
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioSelector({
  scenarios,
  selectedScenario,
  onSelect,
}: ScenarioSelectorProps) {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Test Scenario</label>
      <Select
        value={selectedScenario?.id}
        onValueChange={(id) => {
          const scenario = scenarios.find((s) => s.id === id);
          if (scenario) onSelect(scenario);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a scenario..." />
        </SelectTrigger>
        <SelectContent>
          {scenarios.map((scenario) => (
            <SelectItem key={scenario.id} value={scenario.id}>
              <div className="flex items-center gap-2">
                <span>{scenario.name}</span>
                <Badge className={`text-xs ${getComplexityColor(scenario.complexity)}`}>
                  {scenario.complexity}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({scenario.duration})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedScenario && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-semibold">{selectedScenario.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedScenario.description}
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {selectedScenario.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {selectedScenario.exchanges.length} exchanges
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
