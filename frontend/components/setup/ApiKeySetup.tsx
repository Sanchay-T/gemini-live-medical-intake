'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Key, ExternalLink, CheckCircle2 } from 'lucide-react';
import { BackgroundParticles } from '@/components/effects/BackgroundParticles';

interface Props {
  onApiKeySubmit: (apiKey: string) => void;
}

export function ApiKeySetup({ onApiKeySubmit }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) return;

    setIsValidating(true);

    // Simulate validation delay
    setTimeout(() => {
      onApiKeySubmit(apiKey.trim());
      setIsValidating(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-zen-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <BackgroundParticles />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-zen-black mb-4"
          >
            <Key className="w-8 h-8 text-zen-white" />
          </motion.div>

          <h1 className="text-4xl font-light mb-2 text-zen-black tracking-tight">
            API Key Required
          </h1>
          <p className="text-base text-zen-gray-600 max-w-md mx-auto">
            To use voice-based medical intake, please provide your Google Gemini API key
          </p>
        </div>

        {/* API Key Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-zen-card p-6 mb-4"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-xs font-semibold text-zen-black uppercase tracking-wide mb-2">
                Gemini API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-zen-white border border-zen-gray-200 text-zen-black placeholder-zen-gray-400 focus:outline-none focus:border-zen-black transition-colors text-sm font-mono"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!apiKey.trim() || isValidating}
              className="w-full h-11 text-sm font-medium bg-zen-black hover:bg-zen-gray-900 disabled:opacity-50"
            >
              {isValidating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zen-white border-t-transparent rounded-full animate-spin" />
                  Validating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Continue
                </span>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Get API Key Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {!showInstructions ? (
            <button
              onClick={() => setShowInstructions(true)}
              className="w-full text-sm text-zen-gray-600 hover:text-zen-black transition-colors py-3"
            >
              Don't have an API key? Click here
            </button>
          ) : (
            <div className="glass-zen-card p-5 border-l-2 border-zen-black">
              <div className="flex items-start gap-3">
                <Key className="w-4 h-4 text-zen-black flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-zen-black uppercase tracking-wide mb-2">
                    How to Get Your API Key
                  </h3>
                  <ol className="text-xs text-zen-gray-700 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-zen-black font-semibold">1.</span>
                      <span>Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-zen-black underline hover:no-underline inline-flex items-center gap-1">
                        Google AI Studio
                        <ExternalLink className="w-3 h-3" />
                      </a></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zen-black font-semibold">2.</span>
                      <span>Click "Get API Key" or "Create API Key"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zen-black font-semibold">3.</span>
                      <span>Copy the generated API key</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zen-black font-semibold">4.</span>
                      <span>Paste it in the field above</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Privacy Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-zen-gray-500 mt-6"
        >
          Your API key is stored locally in your browser and never sent to our servers
        </motion.p>
      </motion.div>
    </div>
  );
}
