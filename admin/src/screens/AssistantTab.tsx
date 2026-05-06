import React, { useState, useRef, useEffect } from "react";
import { chatService } from "../services/ai.service";
import { Send } from "lucide-react";

type UiMessage = {
  role: "user" | "assistant" | "system";
  text: string;
};

const AssistantTab: React.FC = () => {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      text: "Hello! I'm your Careon Gym AI Assistant. How can I help you optimize your gym business today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentState, setCurrentState] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const activeAssistantIndexRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a session when component mounts if one doesn't exist
    const initSession = async () => {
      try {
        const session = await chatService.createChat();
        setSessionId(session.id);
      } catch (err) {
        console.error("Failed to init chat session", err);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentState]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !sessionId) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsTyping(true);
    setStreamError(null);
    activeAssistantIndexRef.current = null;

    try {
      await chatService.sendMessage(
        sessionId,
        userMessage,
        (token) => {
          const activeIndex = activeAssistantIndexRef.current;
          if (activeIndex === null) return;

          setMessages((prev) => {
            const updated = [...prev];
            const target = updated[activeIndex];
            if (target && target.role === "assistant") {
              target.text += token;
            }
            return updated;
          });
        },
        (state) => {
          setCurrentState(state);
        },
        () => {
          setMessages((prev) => {
            const nextIndex = prev.length;
            activeAssistantIndexRef.current = nextIndex;
            return [...prev, { role: "assistant", text: "" }];
          });
        },
      );
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : `Service error. Please check your backend connection at ${import.meta.env.VITE_SERVER_URL}.`;
      setStreamError(message);
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `Assistant error: ${message}` },
      ]);
    } finally {
      setIsTyping(false);
      setCurrentState("");
      activeAssistantIndexRef.current = null;
    }
  };

  return (
    <div className=" h-[calc(100vh-160px)] flex flex-col bg-background border border-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="bg-surface text-text-primary p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-dark rounded-full flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h3 className="font-bold">Careon Gym AI Assistant</h3>
            <p className="text-xs text-text-secondary">
              Gym Strategy & Support Engine
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMessages([
                {
                  role: "assistant",
                  text: "Chat cleared. How else can I help?",
                },
              ]);
              chatService.createChat().then((s) => setSessionId(s.id));
            }}
            className="text-xs bg-border hover:bg-primary/20 px-3 py-1.5 border border-border transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto space-y-6 bg-background"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 shadow-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-surface text-text-secondary rounded-tr-none"
                  : msg.role === "system"
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                    : "text-text-primary"
              }`}
            >
              <p className="text-sm whitespace-pre-line">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        {(isTyping || currentState) && (
          <div className="flex justify-start">
            <div className="bg-background px-4 py-2 rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                {currentState || "Processing request"}
              </span>
            </div>
          </div>
        )}
        {streamError && (
          <p className="text-xs text-rose-400">{streamError}</p>
        )}
      </div>

      <div className="p-6 bg-background">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              sessionId
                ? "Ask about marketing strategy, member retention..."
                : "Connecting to AI..."
            }
            disabled={!sessionId || isTyping}
            className="flex-1 bg-surface border-none px-6 py-4 text-sm rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !sessionId || !input.trim()}
            className="bg-surface text-text-primary p-4 rounded-full hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <Send className="stroke-text-primary" />
          </button>
        </div>
        <p className="text-center text-[10px] text-text-secondary mt-4 uppercase tracking-widest font-bold">
          Streaming via Careon Gym Backend
        </p>
      </div>
    </div>
  );
};

export default AssistantTab;
