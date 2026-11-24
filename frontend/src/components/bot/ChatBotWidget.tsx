import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, X, Send, Sparkles, Bot, User as UserIcon,
  RefreshCw, ChevronDown, ExternalLink, AlertCircle, Phone,
  FileText, CheckCircle2, Minimize2, Trash2
} from "lucide-react";
import { api } from "../../services/api";
import { ChatMessage, ChatAction, QuickPrompt } from "../../types";

export const ChatBotWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem("campuscare_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      {
        id: "welcome-1",
        role: "assistant",
        content: "👋 Hello! I am the **CampusCare AI Assistant**.\n\nI can help you:\n- ⚡ **Diagnose & pre-fill** a new complaint\n- 🔍 **Track tickets** in real-time (e.g. `CMP-2026-0001`)\n- 📋 **Check your active issues**\n- 🚨 **Provide emergency campus contacts**\n\nHow can I help you today?",
        suggested_replies: [
          "Wi-Fi down in hostel",
          "Track ticket CMP-2026-0001",
          "Show my complaints",
          "Emergency numbers"
        ]
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem("campuscare_chat_history", JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, loading]);

  // Fetch quick prompts on mount
  useEffect(() => {
    api.getBotQuickPrompts()
      .then((res) => setQuickPrompts(res.prompts))
      .catch(() => {});
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.chatWithBot(text, historyPayload);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        actions: res.actions,
        suggested_replies: res.suggested_replies,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "assistant",
        content: "⚠️ I encountered an error communicating with the AI service. Please make sure the backend server is running and try again.",
        suggested_replies: ["Check backend health", "Emergency contacts"]
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.action_type === "VIEW_TICKET" || action.action_type === "NAVIGATE" || action.action_type === "FILE_COMPLAINT") {
      if (action.payload?.url) {
        navigate(action.payload.url);
        // On mobile, collapse widget on navigation
        if (window.innerWidth < 768) {
          setIsOpen(false);
        }
      }
    } else if (action.action_type === "QUICK_REPLY") {
      handleSendMessage(action.label);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Conversation cleared. How can I assist you now?",
        suggested_replies: ["Report Wi-Fi issue", "Track ticket CMP-2026-0001", "Department directory"]
      }
    ]);
  };

  // Render markdown-like text nicely
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="font-bold text-sm text-slate-900 mt-2 mb-1">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("#### ")) {
        return <h5 key={idx} className="font-semibold text-xs text-slate-800 mt-2 mb-0.5">{line.replace("#### ", "")}</h5>;
      }
      if (line.startsWith("- ")) {
        return (
          <div key={idx} className="flex items-start space-x-1.5 my-0.5 pl-1 text-xs">
            <span className="text-teal-600 font-bold">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p
          key={idx}
          className="text-xs leading-relaxed my-0.5"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    let formatted = text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      // Code
      .replace(/`(.*?)`/g, '<code class="bg-slate-200 text-teal-800 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');
    return formatted;
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2">
          {/* Pulsing Helper Bubble */}
          <div className="hidden sm:flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full shadow-lg border border-slate-200 text-xs font-medium text-slate-700 animate-bounce duration-1000">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>AI Instant Help</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setHasUnread(false);
            }}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-hidden focus:ring-4 focus:ring-teal-300"
            aria-label="Open AI Helpdesk"
          >
            <Bot className="w-7 h-7 transition-transform group-hover:rotate-6" />
            {/* Live Indicator Dot */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white" />
            </span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden ${
            isMinimized
              ? "bottom-6 right-6 w-80 h-14"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white px-4 py-3 flex items-center justify-between shrink-0 select-none shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="relative bg-white/20 p-2 rounded-xl backdrop-blur-xs">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight flex items-center space-x-1.5">
                  <span>CampusCare AI</span>
                  <span className="text-[10px] bg-teal-800/80 text-teal-100 px-1.5 py-0.5 rounded-full font-normal">
                    Online
                  </span>
                </h3>
                <p className="text-[11px] text-teal-100">Smart Helpdesk & Ticket Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {!isMinimized && (
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear chat history"
                  className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body (only if not minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[88%] ${
                        msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                          msg.role === "user"
                            ? "bg-slate-800 text-white"
                            : "bg-teal-600 text-white shadow-xs"
                        }`}
                      >
                        {msg.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`p-3 rounded-2xl text-slate-800 shadow-xs ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-xs"
                            : "bg-white border border-slate-200/80 rounded-tl-xs"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div>{renderMessageContent(msg.content)}</div>
                        )}

                        {/* Interactive Action Buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {msg.actions.map((act, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleActionClick(act)}
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-medium transition-colors active:scale-95 shadow-2xs"
                              >
                                {act.action_type === "FILE_COMPLAINT" ? (
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                ) : act.action_type === "VIEW_TICKET" ? (
                                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                                ) : (
                                  <ExternalLink className="w-3 h-3 text-teal-600" />
                                )}
                                <span>{act.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Suggested Replies */}
                    <div className="mt-1 flex flex-col space-y-1 text-[10px] text-slate-400 px-1">
                      {msg.timestamp && <span>{msg.timestamp}</span>}

                      {/* Suggested Chips from Bot */}
                      {msg.suggested_replies && msg.suggested_replies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.suggested_replies.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(chip)}
                              className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 px-2 py-1 rounded-full border border-slate-200 transition-colors"
                            >
                              💬 {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading / Typing Indicator */}
                {loading && (
                  <div className="flex items-center space-x-2 text-slate-400">
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-tl-xs flex items-center space-x-1.5 shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-[11px] text-slate-500 ml-1 font-medium">Analyzing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              {quickPrompts.length > 0 && (
                <div className="px-3 py-1.5 bg-slate-100/90 border-t border-slate-200 flex items-center space-x-1.5 overflow-x-auto text-[11px] no-scrollbar">
                  <span className="text-slate-400 font-medium shrink-0 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Quick:</span>
                  </span>
                  {quickPrompts.slice(0, 5).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(p.query)}
                      className="shrink-0 bg-white hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 transition-colors truncate max-w-[170px]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question or describe an issue..."
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
