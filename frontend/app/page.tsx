'use client';

import { IntakeFlow } from '@/components/flow/IntakeFlow';

export default function Home() {
  // Backend has API key in .env, so just show the intake flow
  return <IntakeFlow />;
}
