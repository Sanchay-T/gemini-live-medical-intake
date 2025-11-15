'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, User } from 'lucide-react';
import { useConversationStore } from '@/store/conversation-store';
import { useAudioStore } from '@/store/audio-store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function ConversationSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
          {i % 2 === 1 && <Skeleton className="w-10 h-10 rounded-full" />}
          <div className={cn('space-y-2', i % 2 === 0 ? 'items-end' : 'items-start')}>
            <Skeleton className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-40' : 'w-48')} />
          </div>
          {i % 2 === 0 && <Skeleton className="w-10 h-10 rounded-full" />}
        </div>
      ))}
    </div>
  );
}

export function FloatingConversation() {
  const { messages } = useConversationStore();
  const { state, isConnected } = useAudioStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    // Show skeleton if actively listening/processing
    if (state !== 'idle' && isConnected) {
      return (
        <ScrollArea className="h-full pr-4">
          <ConversationSkeleton />
        </ScrollArea>
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-center">
          Start speaking to begin your medical intake...
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div ref={scrollRef} className="space-y-4 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isAI = message.role === 'ai';
            return (
              <motion.div
                key={`${message.role}-${index}`}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut',
                }}
                className={cn('flex gap-3', isAI ? 'justify-start' : 'justify-end')}
              >
                {isAI && (
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarFallback className="bg-secondary">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <motion.div
                  className={cn(
                    'max-w-[70%] rounded-lg px-4 py-3 border',
                    isAI
                      ? 'bg-card border-l-2 border-l-foreground rounded-tl-none'
                      : 'bg-secondary border-r-2 border-r-foreground rounded-tr-none'
                  )}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <span className="text-xs mt-1 block text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </motion.div>

                {!isAI && (
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarFallback className="bg-foreground text-background">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {messages.length > 0 && messages[messages.length - 1].role === 'patient' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <Avatar className="w-8 h-8 border border-border">
              <AvatarFallback className="bg-secondary">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-card border border-l-2 border-l-foreground rounded-lg rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-foreground rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-foreground rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-foreground rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
}
