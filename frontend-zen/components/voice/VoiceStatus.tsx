'use client';

import { Badge } from '@/components/ui/badge';
import { VoiceState } from '@/types';

interface VoiceStatusProps {
  state: VoiceState;
  isConnected: boolean;
}

export function VoiceStatus({ state, isConnected }: VoiceStatusProps) {
  const getStatusBadge = () => {
    if (!isConnected) {
      return <Badge variant="destructive">Disconnected</Badge>;
    }

    switch (state) {
      case 'listening':
        return <Badge className="bg-green-500">Listening</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      case 'speaking':
        return <Badge className="bg-blue-500">AI Speaking</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Status:</span>
      {getStatusBadge()}
    </div>
  );
}
