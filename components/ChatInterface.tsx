"use client";

import { useState, useRef, useEffect } from "react";
import { Send, CalendarCheck, X, Check } from "lucide-react";

interface ChatInterfaceProps {
  onEventCreated: () => void;
}

interface EventProposal {
  title: string;
  start: string;
  end: string;
  description?: string;
}

interface EventUpdate {
  eventId: string;
  title?: string;
  start: string;
  end: string;
  description?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  eventProposal?: EventProposal;
  eventProposals?: EventProposal[];
}

export default function ChatInterface({ onEventCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load user timezone from preferences
    const loadTimezone = async () => {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.timezone) {
            setTimezone(data.timezone);
          }
        }
      } catch (error) {
        console.error("Failed to load timezone", error);
      }
    };
    loadTimezone();
  }, []);

  const formatDateTime = (isoString: string, timezone: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formatTime = (isoString: string, timezone: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history (only user and assistant messages, no event proposals)
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentInput,
          conversationHistory: conversationHistory,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      // Handle update actions
      if (data.action === "update" && data.updates && Array.isArray(data.updates) && data.updates.length > 0) {
        // Automatically apply updates
        const updatePromises = data.updates.map((update: EventUpdate) => handleUpdateEvent(update));
        await Promise.all(updatePromises);
        
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I've updated ${data.updates.length} event(s).`,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        onEventCreated();
      } 
      // Handle both create and update
      else if (data.action === "both") {
        // Handle updates first
        if (data.updates && Array.isArray(data.updates) && data.updates.length > 0) {
          const updatePromises = data.updates.map((update: EventUpdate) => handleUpdateEvent(update));
          await Promise.all(updatePromises);
        }
        
        // Handle new events
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          const events = data.events.filter((e: EventProposal) => e.title && e.start && e.end);
          
          if (events.length === 1) {
            const assistantMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "I've updated the event and prepared a new one for you:",
              eventProposal: events[0],
            };
            setMessages((prev) => [...prev, assistantMsg]);
          } else if (events.length > 1) {
            const assistantMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `I've updated the event(s) and prepared ${events.length} new event(s) for you:`,
              eventProposals: events,
            };
            setMessages((prev) => [...prev, assistantMsg]);
          } else {
            const assistantMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "I've updated the event(s).",
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        } else {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I've updated the event(s).",
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
        
        if (data.updates && data.updates.length > 0) {
          onEventCreated();
        }
      }
      // Handle create actions (existing logic)
      else if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        const events = data.events.filter((e: EventProposal) => e.title && e.start && e.end);
        
        if (events.length === 0) {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.error || "I couldn't understand that request.",
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else if (events.length === 1) {
          // Single event - use the old format for backward compatibility
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I've prepared this event for you:",
            eventProposal: events[0],
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Multiple events
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I've prepared ${events.length} events for you:`,
            eventProposals: events,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } else if (data.title && data.start && data.end) {
        // Backward compatibility: single event in old format
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I've prepared this event for you:",
          eventProposal: data,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Just text or error
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "I couldn't understand that request.",
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEvent = async (proposal: EventProposal) => {
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Event "${proposal.title}" added to calendar.`,
          },
        ]);
        onEventCreated();
      } else {
        throw new Error("Failed to create event");
      }
    } catch (error) {
      alert("Failed to add event to calendar.");
    }
  };

  const handleConfirmAllEvents = async (proposals: EventProposal[]) => {
    try {
      // Create all events in parallel
      const promises = proposals.map((proposal) =>
        fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proposal),
        })
      );

      const results = await Promise.all(promises);
      const successful: EventProposal[] = [];
      const failed: EventProposal[] = [];

      results.forEach((res, index) => {
        if (res.ok) {
          successful.push(proposals[index]);
        } else {
          failed.push(proposals[index]);
        }
      });

      // Show confirmation messages for all successful events
      successful.forEach((proposal) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            role: "assistant",
            content: `Event "${proposal.title}" added to calendar.`,
          },
        ]);
      });

      if (failed.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            role: "assistant",
            content: `Failed to add ${failed.length} event(s) to calendar.`,
          },
        ]);
      }

      if (successful.length > 0) {
        onEventCreated();
      }
    } catch (error) {
      alert("Failed to add events to calendar.");
    }
  };

  const handleUpdateEvent = async (update: EventUpdate) => {
    try {
      const res = await fetch("/api/calendar/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: update.eventId,
          title: update.title,
          start: update.start,
          end: update.end,
          description: update.description,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update event");
      }
    } catch (error) {
      console.error("Failed to update event:", error);
      throw error;
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#2B2B2B]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center text-[#B3B3B3] dark:text-[#A0A0A0] space-y-2">
                <CalendarCheck className="h-12 w-12" />
                <p>Chat to create events...</p>
            </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-[#2B2B2B] text-white"
                  : "bg-[#F0F0F0] text-[#2B2B2B] dark:bg-[#404040] dark:text-white"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.eventProposal && (
                <div className="mt-3 rounded bg-white p-3 shadow-sm border border-[#D4D4D4] dark:bg-[#1a1a1a] dark:border-[#404040]">
                  <div className="font-semibold text-[#2B2B2B] dark:text-white">{msg.eventProposal.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(msg.eventProposal.start, timezone)} -{" "}
                    {formatTime(msg.eventProposal.end, timezone)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => msg.eventProposal && handleConfirmEvent(msg.eventProposal)}
                      className="flex items-center gap-1 rounded bg-[#2B2B2B] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#404040] dark:bg-white dark:text-[#2B2B2B] dark:hover:bg-[#e5e5e5]"
                    >
                      <Check className="h-3 w-3" /> Confirm
                    </button>
                    <button
                      onClick={() => {
                         // In a real app, allow editing. For now, just cancel/ignore.
                         setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, eventProposal: undefined, content: "Event creation cancelled." } : m));
                      }}
                      className="flex items-center gap-1 rounded bg-[#D4D4D4] px-3 py-1.5 text-xs font-medium text-[#2B2B2B] hover:bg-[#C0C0C0] dark:bg-[#525252] dark:text-white dark:hover:bg-[#666666]"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                </div>
              )}
              {msg.eventProposals && msg.eventProposals.length > 0 && (
                <div className="mt-3 space-y-3">
                  {msg.eventProposals.map((proposal, index) => (
                    <div key={index} className="rounded bg-white p-3 shadow-sm border border-[#D4D4D4] dark:bg-[#1a1a1a] dark:border-[#404040]">
                      <div className="font-semibold text-[#2B2B2B] dark:text-white">{proposal.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(proposal.start, timezone)} -{" "}
                        {formatTime(proposal.end, timezone)}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleConfirmEvent(proposal)}
                          className="flex items-center gap-1 rounded bg-[#2B2B2B] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#404040] dark:bg-white dark:text-[#2B2B2B] dark:hover:bg-[#e5e5e5]"
                        >
                          <Check className="h-3 w-3" /> Confirm
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleConfirmAllEvents(msg.eventProposals!)}
                      className="flex items-center gap-1 rounded bg-[#2B2B2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#404040] dark:bg-white dark:text-[#2B2B2B] dark:hover:bg-[#e5e5e5]"
                    >
                      <Check className="h-4 w-4" /> Confirm All ({msg.eventProposals.length})
                    </button>
                    <button
                      onClick={() => {
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, eventProposals: undefined, content: "Event creation cancelled." } : m));
                      }}
                      className="flex items-center gap-1 rounded bg-[#D4D4D4] px-4 py-2 text-sm font-medium text-[#2B2B2B] hover:bg-[#C0C0C0] dark:bg-[#525252] dark:text-white dark:hover:bg-[#666666]"
                    >
                      <X className="h-4 w-4" /> Cancel All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-3 bg-[#F0F0F0] text-[#2B2B2B] dark:bg-[#404040] dark:text-white">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-[#2B2B2B] dark:bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-[#2B2B2B] dark:bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-[#2B2B2B] dark:bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-[#6B7280] dark:text-[#A0A0A0]">Processing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#D4D4D4] p-4 dark:border-[#404040]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Remind me to..."
            className="w-full resize-none rounded-md border border-[#D4D4D4] bg-[#F9F9F9] py-3 pl-4 pr-12 text-[#2B2B2B] placeholder:text-[#B3B3B3] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:placeholder:text-[#666666] dark:focus:border-white"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2.5 rounded-full p-1.5 text-[#2B2B2B] hover:bg-[#D4D4D4] disabled:opacity-50 dark:text-white dark:hover:bg-[#404040]"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

