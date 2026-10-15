import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

let messageCounter = 0;
function createMessageId(prefix) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

const INITIAL_MESSAGE = {
  id: "welcome",

  sender: "bot",
  text: "👋 Hi! I'm your **SmartEvent AI Assistant**.\n\nI can help you discover events, check tickets, track bookings, and answer platform questions. What would you like to explore?",
  quickReplies: [
    "Trending Events",
    "Music This Weekend",
    "My Bookings",
    "My Tickets",
    "Ticket Help",
    "How to Book?",
  ],
  events: [],
};

function formatBotText(rawText, navigate) {
  if (!rawText) return null;

  // Split into lines for formatting
  const lines = rawText.split("\n");

  return lines.map((line, lineIdx) => {
    // Empty line -> spacing
    if (!line.trim()) {
      return <div key={lineIdx} className="chatbot-line-break" />;
    }

    // Markdown Headers: ### Header
    if (line.startsWith("### ")) {
      return (
        <h4 key={lineIdx} className="chatbot-msg-h4">
          {renderInlineFormatting(line.replace("### ", ""), navigate)}
        </h4>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3 key={lineIdx} className="chatbot-msg-h3">
          {renderInlineFormatting(line.replace("## ", ""), navigate)}
        </h3>
      );
    }

    // Bullet items: - Item or * Item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <div key={lineIdx} className="chatbot-bullet-item">
          <span className="chatbot-bullet-dot">•</span>
          <span>{renderInlineFormatting(line.substring(2), navigate)}</span>
        </div>
      );
    }

    // Numbered items: 1. Item
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={lineIdx} className="chatbot-num-item">
          <span className="chatbot-num-badge">{numMatch[1]}.</span>
          <span>{renderInlineFormatting(numMatch[2], navigate)}</span>
        </div>
      );
    }

    // Standard paragraph line
    return (
      <p key={lineIdx} className="chatbot-msg-p">
        {renderInlineFormatting(line, navigate)}
      </p>
    );
  });
}

function renderInlineFormatting(text, navigate) {
  // Regex to match markdown links [label](url), bold **bold**, and code `code`
  const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2];
      return (
        <button
          key={idx}
          className="chatbot-inline-link"
          type="button"
          onClick={() => {
            if (url.startsWith("/")) {
              navigate(url);
            } else {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }}
        >
          {label}
        </button>
      );
    }

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return <strong key={idx}>{renderInlineFormatting(inner, navigate)}</strong>;
    }


    // Code / pill: `code`
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="chatbot-inline-code">{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: createMessageId("user"),
      sender: "user",
      text: text,
      events: [],
      quickReplies: [],
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/chatbot/message", { message: text });
      const data = response.data;

      const botMsg = {
        id: createMessageId("bot"),
        sender: "bot",
        text: data.reply,
        events: data.events || [],
        quickReplies: data.quick_replies || [],
        action: data.action,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot request error:", error);
      const errorMsg = {
        id: createMessageId("error"),
        sender: "bot",
        text: "⚠️ Sorry, I encountered an issue connecting to the server. Please check your connection and try again.",
        events: [],
        quickReplies: ["Trending Events", "Ticket Help", "How to Book?"],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  const handleEventCardClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="chatbot-widget-container">
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          className="chatbot-launcher"
          onClick={() => setIsOpen(true)}
          title="Open SmartEvent AI Assistant"
          aria-label="Open SmartEvent AI Assistant"
        >
          <span className="chatbot-launcher-icon">🤖</span>
          <span className="chatbot-launcher-label">Ask AI</span>
          <span className="chatbot-launcher-pulse" />
        </button>
      )}

      {/* Floating chat dialog */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">✨</div>
              <div>
                <h3 className="chatbot-title">SmartEvent AI</h3>
                <span className="chatbot-status">
                  <span className="chatbot-status-dot" /> Online • Assistant
                </span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={handleClearChat}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                🔄
              </button>
              <button
                type="button"
                className="chatbot-header-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message-group ${
                  msg.sender === "user" ? "user-group" : "bot-group"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="chatbot-msg-avatar">🤖</div>
                )}

                <div className="chatbot-message-content">
                  {/* Message Bubble */}
                  <div
                    className={`chatbot-bubble ${
                      msg.sender === "user" ? "user-bubble" : "bot-bubble"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <p className="chatbot-msg-p">{msg.text}</p>
                    ) : (
                      formatBotText(msg.text, navigate)
                    )}
                  </div>

                  {/* Event cards if any */}
                  {msg.events && msg.events.length > 0 && (
                    <div className="chatbot-events-container">
                      {msg.events.map((evt) => (
                        <div
                          key={evt.id}
                          className="chatbot-event-card"
                          onClick={() => handleEventCardClick(evt.id)}
                        >
                          {evt.banner_image ? (
                            <img
                              src={evt.banner_image}
                              alt={evt.title}
                              className="chatbot-event-card-img"
                              onError={(e) => {
                                e.target.style.display = "none";
                                const placeholder = e.target.parentElement.querySelector(
                                  ".chatbot-event-card-img-placeholder"
                                );
                                if (placeholder) placeholder.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="chatbot-event-card-img-placeholder"
                            style={{ display: evt.banner_image ? "none" : "flex" }}
                          >
                            🎉 {evt.category}
                          </div>
                          <div className="chatbot-event-card-body">
                            <span className="chatbot-event-card-category">
                              {evt.category}
                            </span>
                            <h4 className="chatbot-event-card-title">
                              {evt.title}
                            </h4>
                            <p className="chatbot-event-card-detail">
                              📍 {evt.location}
                            </p>
                            <p className="chatbot-event-card-detail">
                              📅 {new Date(evt.event_date).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                            <div className="chatbot-event-card-footer">
                              <span className="chatbot-event-card-price">
                                ₹{evt.ticket_price}
                              </span>
                              <button
                                type="button"
                                className="chatbot-event-card-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventCardClick(evt.id);
                                }}
                              >
                                View Details →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick reply pills */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="chatbot-quick-replies">
                      {msg.quickReplies.map((pill, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="chatbot-quick-pill"
                          onClick={() => handleSendMessage(pill)}
                          disabled={isLoading}
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading typing indicator */}
            {isLoading && (
              <div className="chatbot-message-group bot-group">
                <div className="chatbot-msg-avatar">🤖</div>
                <div className="chatbot-bubble bot-bubble chatbot-typing-indicator">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            className="chatbot-input-container"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Ask about events, tickets, bookings..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={1000}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatbotWidget;
