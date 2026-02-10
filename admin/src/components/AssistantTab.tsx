import React, { useState, useRef, useEffect } from "react";
import { chatService } from "../services/chatService";

const AssistantTab: React.FC = () => {
    const [messages, setMessages] = useState<
        { role: "user" | "assistant"; text: string }[]
    >([
        {
            role: "assistant",
            text: "Hello! I'm your Careon Gym AI Assistant. How can I help you optimize your gym business today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [currentState, setCurrentState] = useState("");
    const [sessionId, setSessionId] = useState<number | null>(null);
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

        // Add placeholder for AI response
        setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

        try {
            await chatService.sendMessage(
                sessionId,
                userMessage,
                (token) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last && last.role === "assistant") {
                            last.text += token;
                        }
                        return updated;
                    });
                },
                (state) => {
                    setCurrentState(state);
                },
            );
        } catch (e) {
            console.error(e);
            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant" && last.text === "") {
                    last.text =
                        "Service error. Please check your backend connection at 192.168.1.150:6000.";
                }
                return updated;
            });
        } finally {
            setIsTyping(false);
            setCurrentState("");
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-xl">
                        🤖
                    </div>
                    <div>
                        <h3 className="font-bold">Careon Gym AI Hub</h3>
                        <p className="text-xs text-slate-400">
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
                            chatService
                                .createChat()
                                .then((s) => setSessionId(s.id));
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                    >
                        New Chat
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50"
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl shadow-sm leading-relaxed ${
                                msg.role === "user"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                            }`}
                        >
                            <p className="text-sm whitespace-pre-line">
                                {msg.text ||
                                    (msg.role === "assistant" &&
                                    isTyping &&
                                    i === messages.length - 1
                                        ? "..."
                                        : "")}
                            </p>
                        </div>
                    </div>
                ))}
                {(isTyping || currentState) && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {currentState || "Thinking"}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
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
                        className="flex-1 bg-slate-100 border-none px-6 py-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isTyping || !sessionId || !input.trim()}
                        className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all disabled:opacity-50"
                    >
                        🚀
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
                    Streaming via Careon Gym Backend (192.168.1.150)
                </p>
            </div>
        </div>
    );
};

export default AssistantTab;
