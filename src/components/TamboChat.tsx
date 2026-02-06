'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ChevronRight, Mic, Paperclip, Sparkles, X, Zap } from 'lucide-react';
import { ReviewCard } from './ReviewCard';
import {
  useTamboContextAttachment,
  useTamboSuggestions,
  useTamboThread,
  useTamboThreadInput,
  useTamboVoice,
  useTamboGenerationStage,
} from '@tambo-ai/react';
import type { Subscription } from '@/lib/types';

interface TamboChatProps {
  onSubmitFallback?: (message: string) => void;
  selectedSubscription?: Subscription | null;
  potentialSavings?: number;
  subscriptions?: Subscription[];
  onAddSubscription?: (sub: Subscription) => void;
  onAddMultipleSubscriptions?: (subs: Subscription[]) => void;
}

export function TamboChat({
  onSubmitFallback,
  selectedSubscription,
  potentialSavings,
  subscriptions = [],
  onAddSubscription,
  onAddMultipleSubscriptions,
}: TamboChatProps) {
  const hasApiKey = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);

  if (!hasApiKey) {
    return (
      <DemoTamboChat
        onSubmitFallback={onSubmitFallback}
        selectedSubscription={selectedSubscription}
        potentialSavings={potentialSavings}
        subscriptions={subscriptions}
        onAddSubscription={onAddSubscription}
        onAddMultipleSubscriptions={onAddMultipleSubscriptions}
      />
    );
  }

  return <RealTamboChat onSubmitFallback={onSubmitFallback} selectedSubscription={selectedSubscription} potentialSavings={potentialSavings} />;
}

/* ─── Bot Avatar ────────────────────────────────────────────────── */

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-emerald-600" />
    </div>
  );
}

/* ─── Stage Labels ──────────────────────────────────────────────── */

const STAGE_LABELS: Record<string, string> = {
  CHOOSING_COMPONENT: 'Choosing component...',
  FETCHING_CONTEXT: 'Fetching data...',
  HYDRATING_COMPONENT: 'Generating UI...',
  STREAMING_RESPONSE: 'Responding...',
};

/* ─── Real Tambo Chat (Live API) ────────────────────────────────── */

function RealTamboChat({ onSubmitFallback, selectedSubscription, potentialSavings }: TamboChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { generationStage, isIdle } = useTamboGenerationStage();
  const { attachments, removeContextAttachment, clearContextAttachments } = useTamboContextAttachment();
  const suggestionsState = useTamboSuggestions({ maxSuggestions: 3 });
  const voice = useTamboVoice();
  const handledTranscriptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!voice.transcript || voice.transcript === handledTranscriptRef.current) return;
    handledTranscriptRef.current = voice.transcript;
    setValue(prev => (prev ? `${prev} ${voice.transcript ?? ''}` : voice.transcript ?? ''));
  }, [voice.transcript, setValue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isPending) return;

    if (onSubmitFallback) {
      onSubmitFallback(trimmed);
    }

    await submit();
  }, [value, isPending, submit, onSubmitFallback]);

  const messages = thread?.messages ?? [];
  const lastMessageRole = messages[messages.length - 1]?.role;
  const suggestions = suggestionsState.suggestions ?? [];
  const showSuggestions = !isPending && lastMessageRole === 'assistant' && suggestions.length > 0;

  const suggestionLabel = useMemo(() => {
    if (!suggestionsState.suggestionsResult.isFetching) return 'TRY SAYING:';
    return 'Generating suggestions...';
  }, [suggestionsState.suggestionsResult.isFetching]);

  return (
    <div className="w-[360px] border-l border-slate-200 flex flex-col bg-slate-50/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BotAvatar />
          <div>
            <h2 className="font-semibold text-sm text-slate-900">Tambo AI</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {isPending ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex gap-2.5">
            <BotAvatar />
            <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong>Welcome!</strong> I&apos;m your AI subscription assistant. I can help you find hidden subscriptions, cancel unwanted services, and protect you from trial traps.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {message.role === 'user' ? (
              <div className="text-right">
                <div className="inline-block bg-emerald-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] text-left">
                  <p className="text-sm">{formatMessageText(message.content)}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <BotAvatar />
                <div className="space-y-3 max-w-[85%]">
                  <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3">
                    {formatMessageText(message.content)
                      .split('\n')
                      .filter(Boolean)
                      .map((line, i) => (
                        <p key={i} className="text-sm text-slate-700 leading-relaxed">
                          {renderFormattedText(line)}
                        </p>
                      ))}
                  </div>
                  {message.renderedComponent && (
                    <div>{message.renderedComponent}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex gap-2.5">
            <BotAvatar />
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              <span>{STAGE_LABELS[generationStage] || 'Investigating...'}</span>
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="space-y-2 pl-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{suggestionLabel}</p>
            <div className="space-y-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => suggestionsState.accept({ suggestion, shouldSubmit: true })}
                  disabled={suggestionsState.acceptResult.isPending}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                >
                  <span>{suggestion.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Context</span>
            {attachments.map((attachment) => (
              <button
                key={attachment.id}
                type="button"
                onClick={() => removeContextAttachment(attachment.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                title="Remove context"
              >
                <span className="truncate max-w-[120px]">{attachment.displayName ?? attachment.type ?? 'Attachment'}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => clearContextAttachments()}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about subscriptions..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none h-16 bg-slate-50/80 focus:bg-white"
            disabled={isPending}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => (voice.isRecording ? voice.stopRecording() : voice.startRecording())}
                disabled={voice.isTranscribing || Boolean(voice.mediaAccessError)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  voice.isRecording
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                } disabled:text-slate-300`}
                title={voice.mediaAccessError ? 'Microphone access denied' : 'Voice input'}
                aria-pressed={voice.isRecording}
                aria-label="Toggle voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={isPending || !value.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </form>
        {(voice.isTranscribing || voice.transcriptionError || voice.mediaAccessError) && (
          <div className="mt-1.5 text-xs text-slate-400">
            {voice.isTranscribing && <span>Transcribing voice input...</span>}
            {voice.transcriptionError && <span className="text-red-500">{voice.transcriptionError}</span>}
            {voice.mediaAccessError && <span className="text-red-500">{voice.mediaAccessError}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Safely render markdown-like bold/italic as React elements instead of raw HTML (fixes XSS) */
function renderFormattedText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold** and *italic* patterns safely
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index}>{match[3]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/* ─── Demo Chat (No API Key) ───────────────────────────────────── */

function DemoTamboChat({
  onSubmitFallback,
  selectedSubscription,
  potentialSavings,
  subscriptions = [],
  onAddMultipleSubscriptions,
}: TamboChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState('');
  const [localMessages, setLocalMessages] = useState<Array<{
    id: string;
    role: string;
    content: string;
    type?: 'text' | 'review';
    reviewData?: Subscription[];
    isApproved?: boolean;
  }>>([]);
  const [localPending, setLocalPending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    subscriptions.length === 0
      ? ['Add my subscriptions', 'I have Netflix, Spotify, and Adobe']
      : ['Scan my subscriptions', 'Find zombie services', 'Create trial shield']
  );

  // Sync suggestions when subscriptions change (e.g., after adding subs)
  useEffect(() => {
    if (localMessages.length > 0) return; // Don't override if user already chatting
    setSuggestions(
      subscriptions.length === 0
        ? ['Add my subscriptions', 'I have Netflix, Spotify, and Adobe']
        : ['Scan my subscriptions', 'Find zombie services', 'Create trial shield']
    );
  }, [subscriptions.length, localMessages.length]);

  const handleSpeechResult = useCallback((transcript: string) => {
    setLocalValue(prev => (prev ? `${prev} ${transcript}` : transcript));
  }, []);
  const speech = useSpeechInput(handleSpeechResult);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleApproveReview = useCallback((messageId: string, subs: Subscription[]) => {
    if (onAddMultipleSubscriptions) {
      onAddMultipleSubscriptions(subs);

      // Update message to show approved state
      setLocalMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isApproved: true } : m
      ));

      // Add confirmation message
      setTimeout(() => {
        setLocalMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Great! I've added **${subs.length} items** to your tracker. Is there anything else you'd like to update?`,
        }]);
      }, 500);
    }
  }, [onAddMultipleSubscriptions]);

  const handleDeclineReview = useCallback((messageId: string) => {
    setLocalMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: 'Review cancelled.', type: 'text', reviewData: undefined } : m
    ));
  }, []);

  /** Core submit logic that takes a message string directly (fixes race condition) */
  const submitMessage = useCallback((message: string) => {
    if (!message.trim() || localPending) return;

    const trimmed = message.trim();
    setLocalValue('');
    setLocalPending(true);

    // Parse subscriptions from message
    const parsedSubs = parseSubscriptionsFromMessage(trimmed);

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      type: 'text' as const,
    };

    setLocalMessages(prev => {
      const newMessages = [...prev, userMessage];

      // Simulate response after a delay
      setTimeout(() => {
        // If subscriptions found, show review card
        if (parsedSubs.length > 0) {
          setLocalMessages(current => [...current, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I've detected **${parsedSubs.length} subscriptions** from your message. Please review them before I add them to your dashboard:`,
            type: 'review',
            reviewData: parsedSubs
          }]);
          setSuggestions(['Approve List', 'I have more', 'Cancel']);
          setLocalPending(false);
          return;
        }

        const result = getDemoResponse(
          trimmed,
          newMessages,
          {
            selected: selectedSubscription ?? undefined,
            savings: potentialSavings,
            subscriptions,
          }
        );
        setLocalMessages(current => [...current, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          type: 'text'
        }]);
        setSuggestions(result.suggestions);
        setLocalPending(false);
      }, 1200);

      return newMessages;
    });

    if (onSubmitFallback) {
      onSubmitFallback(trimmed);
    }
  }, [localPending, onSubmitFallback, selectedSubscription, potentialSavings, subscriptions]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(localValue);
  }, [localValue, submitMessage]);

  /** Submit a suggestion directly — no setTimeout race condition */
  const handleSuggestedPrompt = useCallback((prompt: string) => {
    submitMessage(prompt);
  }, [submitMessage]);

  return (
    <section className="w-[360px] border-l border-slate-200 bg-slate-50/50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BotAvatar />
          <div>
            <h2 className="font-semibold text-sm text-slate-900">Tambo AI</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${localPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {localPending ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {localMessages.length === 0 && (
          <>
            {/* Welcome messages from bot */}
            <div className="flex gap-2.5">
              <BotAvatar />
              <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {subscriptions.length === 0
                    ? <><strong>Welcome!</strong> I&apos;m your AI subscription detective. Let&apos;s get started by adding your subscriptions.</>
                    : <>You have <strong>{subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}</strong> tracked, totaling <strong>${subscriptions.reduce((sum, s) => sum + s.cost, 0).toFixed(2)}/month</strong>.</>
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <div className="w-8 flex-shrink-0" />
              <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {subscriptions.length === 0
                    ? <>Just type something like: <em>&quot;I have Netflix, Spotify, and Adobe&quot;</em> and I&apos;ll automatically detect and add them.</>
                    : <>I can analyze your subscriptions, find unused services, or help you cancel. What would you like to do?</>
                  }
                </p>
              </div>
            </div>

            {/* Suggestion Cards */}
            <div className="pl-10 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TRY SAYING:</p>
              <div className="space-y-1.5">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(suggestion)}
                    className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <span>{suggestion}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {localMessages.map((message) => (
          <div key={message.id}>
            {message.role === 'user' ? (
              <div className="text-right">
                <div className="inline-block bg-emerald-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] text-left">
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <BotAvatar />
                <div className="space-y-3 max-w-[85%]">
                  {/* Render Review Card if present */}
                  {message.type === 'review' && message.reviewData && (
                    <div>
                      <ReviewCard
                        subscriptions={message.reviewData}
                        isApproved={message.isApproved}
                        onApprove={(subs) => handleApproveReview(message.id, subs)}
                        onDecline={() => handleDeclineReview(message.id)}
                      />
                    </div>
                  )}

                  {/* Render Text Content — safe rendering, no dangerouslySetInnerHTML */}
                  {message.content && (
                    <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3">
                      {message.content.split('\n').filter(Boolean).map((line, i) => (
                        <p key={i} className="text-sm text-slate-700 leading-relaxed">
                          {renderFormattedText(line)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {localPending && (
          <div className="flex gap-2.5">
            <BotAvatar />
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              <span>Investigating...</span>
            </div>
          </div>
        )}

        {/* Dynamic Suggestions */}
        {!localPending && localMessages.length > 0 && suggestions.length > 0 && (
          <div className="space-y-2 pl-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TRY SAYING:</p>
            <div className="space-y-1.5">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedPrompt(suggestion)}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <span>{suggestion}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <form onSubmit={handleSubmit}>
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about subscriptions..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none h-16 bg-slate-50/80 focus:bg-white"
            disabled={localPending}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={speech.toggle}
                disabled={!speech.isSupported}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  speech.isListening
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                } disabled:text-slate-300`}
                title={speech.isSupported ? 'Voice input' : 'Voice input not supported'}
                aria-pressed={speech.isListening}
                aria-label="Toggle voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={localPending || !localValue.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function formatMessageText(content: unknown): string {
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (part && typeof part === 'object' && 'type' in part && (part as { type?: unknown }).type === 'text') {
          return String((part as { text?: unknown }).text ?? '');
        }
        return '';
      })
      .join('');
  }

  return String(content ?? '');
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function useSpeechInput(onResult: (transcript: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Keep ref in sync so we don't recreate recognition on every callback change
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionImpl = (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onResultRef.current(transcript);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop?.();
    };
  }, []); // stable — uses ref for callback

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    recognition.start();
  }, [isListening]);

  return { isSupported, isListening, toggle };
}

function getDemoResponse(
  message: string,
  conversationHistory: Array<{role: string; content: string}>,
  subscriptionContext?: {
    selected?: Subscription;
    savings?: number;
    subscriptions?: Subscription[];
    addedSubs?: Subscription[];
  }
): { response: string; suggestions: string[] } {
  const lower = message.toLowerCase();
  const historyContext = conversationHistory.map(m => m.content.toLowerCase()).join(' ');
  const currentSubs = subscriptionContext?.subscriptions || [];
  const addedSubs = subscriptionContext?.addedSubs || [];

  // If subscriptions were just added, acknowledge them
  if (addedSubs.length > 0) {
    const subNames = addedSubs.map(s => `**${s.name}**`).join(', ');
    const totalCost = addedSubs.reduce((sum, s) => sum + s.cost, 0);
    const allSubs = [...currentSubs, ...addedSubs];
    const grandTotal = allSubs.reduce((sum, s) => sum + s.cost, 0);

    return {
      response: `**Added ${addedSubs.length} subscription${addedSubs.length > 1 ? 's' : ''}!**

${subNames}

**Cost of added:** $${totalCost.toFixed(2)}/month
**Your total subscriptions:** ${allSubs.length}
**Total monthly spend:** $${grandTotal.toFixed(2)}

I've added these to your sidebar. You can click on any subscription to see details.

Want me to analyze your subscriptions for potential savings?`,
      suggestions: ['Analyze for savings', 'Add more subscriptions', 'Show all my subscriptions']
    };
  }

  // Check if this is a follow-up to a previous topic
  const wasDiscussingZombies = historyContext.includes('zombie') || historyContext.includes('unused');
  const wasDiscussingCancel = historyContext.includes('cancel');
  const wasDiscussingTrial = historyContext.includes('trial') || historyContext.includes('shield');
  const wasScanning = historyContext.includes('scan') || historyContext.includes('found');

  // Handle affirmative responses (yes, sure, okay, etc.)
  if (/^(yes|yeah|yep|sure|okay|ok|please|do it|go ahead)$/i.test(lower.trim())) {
    if (wasDiscussingZombies) {
      return {
        response: `**Let's tackle these zombies one by one!**

Starting with the biggest drain: **Adobe Creative Cloud** at $59.99/mo.

This one is notoriously difficult to cancel. They use what I call "The Labyrinth" - multiple confirmation screens, hidden buttons, and guilt-trip offers.

Ready for the cancellation roadmap? Say **"show roadmap"** or ask about a different subscription.`,
        suggestions: ['Show Adobe roadmap', 'Cancel Planet Fitness instead', 'How much will I save?']
      };
    }
    if (wasDiscussingCancel) {
      return {
        response: `**Generating cancellation roadmap...**

I'll show you exactly where to click and what dark patterns to watch out for. The companies make it intentionally confusing, but I've mapped every trap.

Which service would you like to start with?`,
        suggestions: ['Adobe Creative Cloud', 'Planet Fitness', 'LinkedIn Premium']
      };
    }
    if (wasDiscussingTrial) {
      return {
        response: `**Your Trial Shield is ready!**

Virtual Card: **** **** **** ${Math.floor(1000 + Math.random() * 9000)}
Expires: 7 days from activation
Status: Protected

This card will automatically decline after the trial period. Copy the number and use it for signup!

Need another card for a different trial?`,
        suggestions: ['Create another card', 'Make it expire in 14 days', 'Show my active shields']
      };
    }
  }

  // Handle negative responses
  if (/^(no|nope|not now|later|nevermind|cancel)$/i.test(lower.trim())) {
    return {
      response: `No problem! I'm here whenever you need me. Is there anything else I can help with?`,
      suggestions: ['Scan my subscriptions', 'Show zombie services', 'Create trial shield']
    };
  }

  // Main topic handlers - check for subscription queries first
  if (lower.includes('subscription') || lower.includes('scan') || (lower.includes('what') && lower.includes('active')) || lower.includes('show all') || lower.includes('analyze')) {
    const subs = currentSubs;

    if (subs.length === 0) {
      return {
        response: `**No subscriptions found yet!**

You haven't added any subscriptions. Tell me what services you're paying for and I'll track them for you.

Just say something like: "I have Netflix, Spotify, and ChatGPT"`,
        suggestions: ['I have Netflix and Spotify', 'Add my subscriptions', 'How does this work?']
      };
    }

    const totalSpend = subs.reduce((sum, s) => sum + s.cost, 0);
    const subList = subs.map(s => `- **${s.name}** - $${s.cost.toFixed(2)}/mo`).join('\n');

    return {
      response: `**Your Subscription Summary**

I found **${subs.length} subscription${subs.length !== 1 ? 's' : ''}** in your account:

${subList}

**Total Monthly Spending:** $${totalSpend.toFixed(2)}
**Yearly Total:** $${(totalSpend * 12).toFixed(2)}

Want me to analyze these for potential savings?`,
      suggestions: ['Find savings opportunities', 'Add more subscriptions', 'Which costs the most?']
    };
  }

  if (lower.includes('zombie') || lower.includes('unused') || lower.includes('wasting')) {
    return {
      response: `**Zombie Subscriptions Detected!**

These are bleeding you dry without you even noticing:

1. **Adobe Creative Cloud** - $59.99/mo
   Last opened: *4 months ago*

2. **Planet Fitness** - $24.99/mo
   Last visit: *6 months ago*

3. **LinkedIn Premium** - $29.99/mo
   Last used: *3 months ago*

4. **Headspace** - $12.99/mo
   Last session: *5 months ago*

**Total Zombie Drain: $127.96/month** ($1,535.52/year!)

Want me to help you cancel any of these? Just say which one!`,
      suggestions: ['Cancel Adobe', 'Cancel all zombies', 'Why is Planet Fitness hard to cancel?']
    };
  }

  if (lower.includes('trial') || lower.includes('shield') || lower.includes('burner') || lower.includes('virtual card')) {
    return {
      response: `**Trial Shield Generator**

I can create a virtual burner card that auto-expires after your trial ends. No more forgotten cancellations!

What service are you signing up for? I'll customize the expiry to match their trial period.

Common trials I've helped with:
- Netflix (30 days)
- Spotify Premium (30 days)
- Adobe CC (7 days)
- Masterclass (7 days)`,
      suggestions: ['Create 7-day card', 'Create 30-day card', 'How does this work?']
    };
  }

  if (lower.includes('cancel')) {
    const services = [
      { name: 'adobe', difficulty: 'nightmare' },
      { name: 'netflix', difficulty: 'easy' },
      { name: 'spotify', difficulty: 'easy' },
      { name: 'planet fitness', difficulty: 'nightmare' },
      { name: 'disney', difficulty: 'easy' },
      { name: 'linkedin', difficulty: 'medium' },
      { name: 'headspace', difficulty: 'medium' }
    ];

    const matched = services.find(s => lower.includes(s.name));

    if (matched) {
      const displayName = matched.name.charAt(0).toUpperCase() + matched.name.slice(1);
      return {
        response: `**Cancellation Path for ${displayName}**

**Difficulty: ${matched.difficulty.toUpperCase()}**

${matched.difficulty === 'nightmare' ?
`Warning: This company uses aggressive dark patterns to prevent cancellation. I'll guide you through every trap.

**Step 1:** Go to Account Settings
**Step 2:** Look for "Manage Subscription" (it's hidden in small text)
**Step 3:** They'll offer you discounts - DECLINE them all
**Step 4:** You may need to confirm via email within 24 hours

Want me to show the full roadmap with screenshots?` :
`This one is relatively straightforward. Here's the quick path:

**Step 1:** Log into your account
**Step 2:** Go to Account > Subscription
**Step 3:** Click "Cancel Subscription"
**Step 4:** Confirm cancellation

Should complete in under 2 minutes!`}`,
        suggestions: ['Show full roadmap', 'Give me the GDPR script', 'Cancel a different service']
      };
    }

    return {
      response: `Which subscription would you like to cancel? I have dark pattern navigation guides for:

- Adobe Creative Cloud (nightmare difficulty)
- Planet Fitness (requires in-person/mail!)
- LinkedIn Premium (medium difficulty)
- Disney+ (surprisingly easy)
- Netflix (easy)
- Headspace (app store redirect trick)

Just tell me which one and I'll guide you through it!`,
      suggestions: ['Cancel Adobe', 'Cancel Planet Fitness', 'Which is easiest to cancel?']
    };
  }

  if (lower.includes('save') || lower.includes('saving') || lower.includes('how much')) {
    const savings = subscriptionContext?.savings || 127.96;
    const yearSavings = savings * 12;
    return {
      response: `**Your Potential Savings**

If you cancel all zombie subscriptions, you could save:

**Monthly:** $${savings.toFixed(2)}
**Yearly:** $${yearSavings.toFixed(2)}
**Over 5 years:** $${(savings * 60).toFixed(2)}

${yearSavings >= 1000
  ? `That's enough for ${Math.floor(yearSavings / 1000)} international flight${Math.floor(yearSavings / 1000) !== 1 ? 's' : ''} or ${Math.floor(yearSavings / 15)} months of a new streaming service!`
  : `That's enough for ${Math.floor(yearSavings / 15)} months of a new streaming service!`
}

Ready to start saving?`,
      suggestions: ['Start with the biggest one', 'Show me the zombies again', 'Which should I cancel first?']
    };
  }

  if (lower.includes('help') || lower.includes('what can you do')) {
    return {
      response: `I'm Subbo, your subscription detective! Here's what I can do:

**Scan** - Find all your subscriptions and show spending
**Find Zombies** - Identify unused services draining your wallet
**Cancel Guides** - Step-by-step cancellation with dark pattern warnings
**Trial Shield** - Virtual cards for safe free trial signups
**Savings Calculator** - See how much you could save

I can also answer follow-up questions and remember our conversation context!`,
      suggestions: ['Scan my subscriptions', 'Find zombie services', 'Create trial shield']
    };
  }

  // GDPR script - use word boundary to avoid matching 'subscriptions'
  if (lower.includes('gdpr') || lower.includes('legal') || /\bscript\b/.test(lower)) {
    return {
      response: `**GDPR Legal Script for Cancellation**

Copy and send this to their support:

---

*"I am invoking my right to cancel my subscription under GDPR Article 17 (Right to Erasure) and consumer protection laws. Please confirm immediate cancellation without any retention offers.*

*I do not wish to hear about discounts, pauses, or alternative plans. Please process my cancellation and send written confirmation within 24 hours.*

*Failure to comply will result in a formal complaint to the relevant data protection authority."*

---

This works especially well for European users, but US companies often comply too to avoid hassle!`,
      suggestions: ['Copy to clipboard', 'Try with Adobe', 'What if they ignore it?']
    };
  }

  if (lower.includes('netflix') && subscriptionContext?.selected?.name?.toLowerCase().includes('netflix')) {
    return {
      response: `**Netflix Analysis for your account**

You're currently on the **Premium 4K** plan at $${subscriptionContext.selected.cost}/mo.

Based on your viewing patterns:
- You mostly watch on 1 device at a time
- 4K content is rarely accessed
- Mobile viewing is your primary method

**Recommendation:** Downgrade to Standard ($15.49/mo)
**Monthly Savings:** $4.50

Would you like me to help you downgrade?`,
      suggestions: ['Help me downgrade', 'Keep my current plan', 'Analyze another subscription']
    };
  }

  // Default response with context-aware suggestions
  const defaultSuggestions = wasScanning
    ? ['Show zombie subscriptions', 'Cancel a service', 'Calculate savings']
    : ['Scan my subscriptions', 'Find zombie services', 'Create trial shield'];

  return {
    response: `I'm here to help you fight subscription bloat!

You can ask me things like:
- "Scan my subscriptions" - See everything you're paying for
- "Show zombie services" - Find unused subscriptions
- "Cancel [service name]" - Get cancellation guides
- "Create a trial shield" - Virtual card for free trials
- "How much can I save?" - Calculate potential savings

Or just ask me anything about your subscriptions!`,
    suggestions: defaultSuggestions
  };
}

// Known services for enrichment — used to fill in cost/category/logo when recognized
const knownServices: Record<string, { cost: number; category: string; logo: string }> = {
  'netflix': { cost: 15.99, category: 'Entertainment', logo: '🎬' },
  'spotify': { cost: 10.99, category: 'Music', logo: '🎵' },
  'adobe': { cost: 59.99, category: 'Productivity', logo: '🎨' },
  'adobe creative cloud': { cost: 59.99, category: 'Productivity', logo: '🎨' },
  'chatgpt': { cost: 20.00, category: 'AI Tools', logo: '🤖' },
  'openai': { cost: 20.00, category: 'AI Tools', logo: '🤖' },
  'claude': { cost: 20.00, category: 'AI Tools', logo: '🤖' },
  'anthropic': { cost: 20.00, category: 'AI Tools', logo: '🤖' },
  'cursor': { cost: 20.00, category: 'Developer', logo: '💻' },
  'perplexity': { cost: 20.00, category: 'AI Tools', logo: '🔍' },
  'midjourney': { cost: 10.00, category: 'AI Tools', logo: '🎨' },
  'copilot': { cost: 10.00, category: 'Developer', logo: '💻' },
  'disney': { cost: 13.99, category: 'Entertainment', logo: '🏰' },
  'disney+': { cost: 13.99, category: 'Entertainment', logo: '🏰' },
  'hbo': { cost: 15.99, category: 'Entertainment', logo: '📺' },
  'hbo max': { cost: 15.99, category: 'Entertainment', logo: '📺' },
  'youtube': { cost: 13.99, category: 'Entertainment', logo: '▶️' },
  'youtube premium': { cost: 13.99, category: 'Entertainment', logo: '▶️' },
  'amazon prime': { cost: 14.99, category: 'Shopping', logo: '📦' },
  'prime': { cost: 14.99, category: 'Shopping', logo: '📦' },
  'apple music': { cost: 10.99, category: 'Music', logo: '🍎' },
  'apple tv': { cost: 9.99, category: 'Entertainment', logo: '🍎' },
  'icloud': { cost: 2.99, category: 'Storage', logo: '☁️' },
  'dropbox': { cost: 11.99, category: 'Storage', logo: '📁' },
  'google one': { cost: 2.99, category: 'Storage', logo: '☁️' },
  'notion': { cost: 10.00, category: 'Productivity', logo: '📝' },
  'figma': { cost: 15.00, category: 'Design', logo: '✏️' },
  'canva': { cost: 12.99, category: 'Design', logo: '🖼️' },
  'grammarly': { cost: 12.00, category: 'Productivity', logo: '📖' },
  'linkedin': { cost: 29.99, category: 'Professional', logo: '💼' },
  'linkedin premium': { cost: 29.99, category: 'Professional', logo: '💼' },
  'headspace': { cost: 12.99, category: 'Health', logo: '🧘' },
  'calm': { cost: 14.99, category: 'Health', logo: '🌊' },
  'github': { cost: 4.00, category: 'Developer', logo: '💻' },
  'github copilot': { cost: 10.00, category: 'Developer', logo: '💻' },
  'aws': { cost: 45.00, category: 'Cloud', logo: '☁️' },
  'gym': { cost: 24.99, category: 'Fitness', logo: '🏋️' },
  'planet fitness': { cost: 24.99, category: 'Fitness', logo: '🏋️' },
  'hulu': { cost: 17.99, category: 'Entertainment', logo: '📺' },
  'twitch': { cost: 9.99, category: 'Entertainment', logo: '🎮' },
  'slack': { cost: 8.75, category: 'Productivity', logo: '💬' },
  'zoom': { cost: 13.33, category: 'Productivity', logo: '📹' },
  'microsoft 365': { cost: 9.99, category: 'Productivity', logo: '📊' },
  'office 365': { cost: 9.99, category: 'Productivity', logo: '📊' },
  'duolingo': { cost: 6.99, category: 'Education', logo: '🦉' },
  'crunchyroll': { cost: 7.99, category: 'Entertainment', logo: '🎌' },
  'paramount': { cost: 11.99, category: 'Entertainment', logo: '📺' },
  'peacock': { cost: 7.99, category: 'Entertainment', logo: '📺' },
  'nordvpn': { cost: 12.99, category: 'Security', logo: '🔒' },
  'expressvpn': { cost: 12.95, category: 'Security', logo: '🔒' },
  '1password': { cost: 2.99, category: 'Security', logo: '🔑' },
  'lastpass': { cost: 3.00, category: 'Security', logo: '🔑' },
  'vercel': { cost: 20.00, category: 'Developer', logo: '▲' },
  'heroku': { cost: 7.00, category: 'Cloud', logo: '☁️' },
  'digital ocean': { cost: 12.00, category: 'Cloud', logo: '☁️' },
  'supabase': { cost: 25.00, category: 'Developer', logo: '💻' },
  'linear': { cost: 8.00, category: 'Productivity', logo: '📋' },
  'obsidian': { cost: 8.00, category: 'Productivity', logo: '📝' },
  'todoist': { cost: 4.00, category: 'Productivity', logo: '✅' },
};

// Words to ignore when extracting subscription names from a list
const STOP_WORDS = new Set([
  'i', 'have', 'use', 'pay', 'for', 'got', 'my', 'the', 'a', 'an', 'am',
  'is', 'are', 'was', 'to', 'in', 'on', 'it', 'of', 'also', 'too', 'etc',
  'some', 'like', 'about', 'with', 'from', 'that', 'this', 'just', 'been',
  'up', 'signed', 'subscribe', 'subscribed', 'subscriptions', 'subscription',
  'paying', 'using', 'currently', 'right', 'now', 'think', 'maybe',
  'add', 'track', 'please', 'can', 'you', 'me', 'these', 'those',
]);

/**
 * Extract service names from natural language.
 * Handles patterns like:
 *   "I have Claude, Cursor, and Netflix"
 *   "Netflix, Spotify, Claude"
 *   "add Claude"
 */
function extractServiceNames(message: string): string[] {
  // Strip leading intent phrases to isolate the list of names
  const listText = message
    .replace(/^(i\s+(?:have|use|pay\s+for|got|subscribe\s+to|am\s+(?:using|paying\s+for|subscribed\s+to)))\s+/i, '')
    .replace(/^(add|track|include|please\s+add|can\s+you\s+add)\s+/i, '')
    .replace(/^(my\s+subscriptions?\s+(?:are|include))\s+/i, '')
    .trim();

  if (!listText) return [];

  // Split by comma, " and ", or " & "
  const rawItems = listText
    .split(/\s*,\s*|\s+and\s+|\s*&\s*/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const names: string[] = [];

  for (const item of rawItems) {
    // Remove cost mentions in all common formats:
    //   "$30", "$30/mo", "30$", "30$/month", "$30 per month", "30 dollars", etc.
    const cleaned = item
      .replace(/\$\s*\d+(?:\.\d{1,2})?/g, '')                  // $30, $30.00
      .replace(/\d+(?:\.\d{1,2})?\s*\$/g, '')                   // 30$, 30.00$
      .replace(/\d+(?:\.\d{1,2})?\s*dollars?/gi, '')            // 30 dollars
      .replace(/\s*(?:\/|per)\s*(?:mo(?:nth)?|yr|year|week|annual(?:ly)?)\b/gi, '') // /mo, per month, /year
      .replace(/\s*(?:a|each|every)\s+(?:month|year|week)\b/gi, '')  // a month, each month
      .replace(/\s*\b(?:monthly|yearly|annually|weekly)\b/gi, '')    // monthly, yearly
      .replace(/\b(?:at|for|costs?|priced?\s*at)\b\s*$/i, '')       // trailing "at", "for", "costs"
      .replace(/\s{2,}/g, ' ')                                      // collapse double spaces
      .trim();

    if (!cleaned) continue;

    // Filter out items that are entirely stop words
    const words = cleaned.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(w => !STOP_WORDS.has(w));
    if (meaningfulWords.length === 0) continue;

    names.push(cleaned);
  }

  return names;
}

/** Look up known service info. Returns match or null. */
function lookupKnownService(name: string): { key: string; info: { cost: number; category: string; logo: string } } | null {
  const lower = name.toLowerCase();

  // Exact match first
  if (knownServices[lower]) {
    return { key: lower, info: knownServices[lower] };
  }

  // Partial match — check if the name contains a known key or vice versa
  // Sort longest-first to prefer "amazon prime" over "prime"
  const sorted = Object.entries(knownServices).sort(([a], [b]) => b.length - a.length);
  for (const [key, info] of sorted) {
    if (lower.includes(key) || key.includes(lower)) {
      return { key, info };
    }
  }

  return null;
}

// Helper to parse subscriptions from text — works with ANY service name
function parseSubscriptionsFromMessage(message: string): Subscription[] {
  const names = extractServiceNames(message);
  if (names.length === 0) return [];

  const parsed: Subscription[] = [];
  const seen = new Set<string>(); // deduplicate

  for (const rawName of names) {
    const lookup = lookupKnownService(rawName);
    const dedupeKey = lookup?.key ?? rawName.toLowerCase();

    // Skip duplicates (e.g. "openai" and "chatgpt" both matching)
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    // Also deduplicate aliases: if "chatgpt" is seen, skip "openai"
    if (dedupeKey === 'openai' && seen.has('chatgpt')) continue;
    if (dedupeKey === 'chatgpt' && seen.has('openai')) continue;

    const info = lookup?.info ?? { cost: 9.99, category: 'Other', logo: '📦' };

    // Try to extract a custom cost from the original message near this name
    // Supports: "$30", "30$", "$30.00", "30.00$", "30 dollars"
    const escaped = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const costMatch = message.match(
      new RegExp(`${escaped}[^\\d]*(?:\\$\\s*(\\d+(?:\\.\\d{1,2})?)|(\\d+(?:\\.\\d{1,2})?)\\s*\\$|(\\d+(?:\\.\\d{1,2})?)\\s*dollars?)`, 'i')
    );
    const rawCost = costMatch
      ? parseFloat(costMatch[1] ?? costMatch[2] ?? costMatch[3])
      : null;

    // Detect billing period — if yearly, convert to monthly
    const isYearly = /\b(?:year(?:ly)?|annual(?:ly)?|\/\s*yr)\b/i.test(message);
    const isWeekly = /\b(?:week(?:ly)?|\/\s*wk)\b/i.test(message);
    let cost: number;
    if (rawCost != null) {
      if (isYearly) {
        cost = Math.round((rawCost / 12) * 100) / 100;
      } else if (isWeekly) {
        cost = Math.round(rawCost * 4.33 * 100) / 100;
      } else {
        cost = rawCost;
      }
    } else {
      cost = info.cost;
    }

    // Title-case the name
    const displayName = rawName
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    parsed.push({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: displayName,
      cost,
      status: 'active',
      logo: info.logo,
      category: info.category,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  return parsed;
}
