import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from '@/store/conversation-store';

describe('Conversation Store - Streaming', () => {
  beforeEach(() => {
    const { clearConversation } = useConversationStore.getState();
    clearConversation();
  });

  it('should handle streaming transcript chunks for AI', () => {
    const { appendTranscriptChunk, messages } = useConversationStore.getState();

    appendTranscriptChunk('ai', 'Hello');
    appendTranscriptChunk('ai', ' there');
    appendTranscriptChunk('ai', '!');

    // Should not create message until role changes or finalized
    expect(messages.length).toBe(0);

    // Now switch to patient role
    appendTranscriptChunk('patient', 'Hi');

    // Should finalize AI message
    const { messages: updatedMessages } = useConversationStore.getState();
    expect(updatedMessages.length).toBe(1);
    expect(updatedMessages[0].content).toBe('Hello there!');
    expect(updatedMessages[0].role).toBe('ai');
  });

  it('should handle role switching during streaming', () => {
    const { appendTranscriptChunk, messages } = useConversationStore.getState();

    appendTranscriptChunk('ai', 'What is your');
    appendTranscriptChunk('ai', ' chief complaint');
    appendTranscriptChunk('ai', '?');

    // Switch to patient
    appendTranscriptChunk('patient', 'I have a');
    appendTranscriptChunk('patient', ' headache');

    // AI message should be finalized
    let currentMessages = useConversationStore.getState().messages;
    expect(currentMessages.length).toBe(1);
    expect(currentMessages[0].content).toBe('What is your chief complaint?');
    expect(currentMessages[0].role).toBe('ai');

    // Switch back to AI
    appendTranscriptChunk('ai', 'I see');

    // Patient message should be finalized
    currentMessages = useConversationStore.getState().messages;
    expect(currentMessages.length).toBe(2);
    expect(currentMessages[1].content).toBe('I have a headache');
    expect(currentMessages[1].role).toBe('patient');
  });

  it('should handle finalizeCurrentMessage', () => {
    const { appendTranscriptChunk, finalizeCurrentMessage, messages } =
      useConversationStore.getState();

    appendTranscriptChunk('ai', 'Hello');
    appendTranscriptChunk('ai', ' World');

    expect(messages.length).toBe(0);

    finalizeCurrentMessage();

    const { messages: updatedMessages } = useConversationStore.getState();
    expect(updatedMessages.length).toBe(1);
    expect(updatedMessages[0].content).toBe('Hello World');
  });

  it('should clear conversation', () => {
    const { appendTranscriptChunk, clearConversation } = useConversationStore.getState();

    appendTranscriptChunk('ai', 'Test message');
    appendTranscriptChunk('patient', 'Response');

    clearConversation();

    const { messages } = useConversationStore.getState();
    expect(messages.length).toBe(0);
  });
});
