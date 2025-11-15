'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Mic,
  MicOff,
  Trash2,
  Download,
  FileText,
  Moon,
  Sun,
  HelpCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface CommandMenuProps {
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  onClearConversation?: () => void;
  onViewData?: () => void;
  onExportData?: () => void;
  isVoiceActive?: boolean;
}

export function CommandMenu({
  onStartVoice,
  onStopVoice,
  onClearConversation,
  onViewData,
  onExportData,
  isVoiceActive = false,
}: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Space bar for voice toggle
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        if (isVoiceActive) {
          onStopVoice?.();
        } else {
          onStartVoice?.();
        }
      }
      // Escape to stop voice
      if (e.key === 'Escape' && isVoiceActive) {
        onStopVoice?.();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onStartVoice, onStopVoice, isVoiceActive]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-muted/50 backdrop-blur-md rounded-lg border border-border hover:bg-muted transition-colors text-sm"
        >
          <span className="text-muted-foreground">Quick actions</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Voice Actions">
            {!isVoiceActive ? (
              <CommandItem
                onSelect={() => runCommand(() => onStartVoice?.())}
                className="cursor-pointer"
              >
                <Mic className="mr-2 h-4 w-4 text-green-500" />
                <span>Start Voice Input</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  Space
                </kbd>
              </CommandItem>
            ) : (
              <CommandItem
                onSelect={() => runCommand(() => onStopVoice?.())}
                className="cursor-pointer"
              >
                <MicOff className="mr-2 h-4 w-4 text-red-500" />
                <span>Stop Voice Input</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  Esc
                </kbd>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Data Actions">
            <CommandItem
              onSelect={() => runCommand(() => onViewData?.())}
              className="cursor-pointer"
            >
              <FileText className="mr-2 h-4 w-4 text-blue-500" />
              <span>View Extracted Data</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => onExportData?.())}
              className="cursor-pointer"
            >
              <Download className="mr-2 h-4 w-4 text-purple-500" />
              <span>Export Data (PDF)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => onClearConversation?.())}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span>Clear Conversation</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Appearance">
            <CommandItem
              onSelect={() => runCommand(() => setTheme('light'))}
              className="cursor-pointer"
            >
              <Sun className="mr-2 h-4 w-4 text-yellow-500" />
              <span>Light Mode</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setTheme('dark'))}
              className="cursor-pointer"
            >
              <Moon className="mr-2 h-4 w-4 text-blue-500" />
              <span>Dark Mode</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Help">
            <CommandItem className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4 text-gray-500" />
              <span>View Keyboard Shortcuts</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
