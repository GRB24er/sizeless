/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Package, X, MessageCircle, User, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types for chat messages
type MessageType = "user" | "agent";

interface ChatMessage {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  options?: string[];
}

// Query types for categorization
type QueryCategory =
  | "shipping"
  | "delivery"
  | "returns"
  | "payment"
  | "general";

// Bot response data
interface BotResponse {
  content: string;
  options?: string[];
  followUp?: string;
}

// Knowledge base for responses
const responseMap: Record<string, BotResponse> = {
  greeting: {
    content: "Hello! I'm your Logi assistant. How may I help you today?",
    options: [
      "Track my package",
      "Shipping rates",
      "Delivery times",
      "Report an issue",
    ],
  },
  default: {
    content:
      "I'm not sure I understand. Could you please provide more details about your inquiry?",
    options: ["Talk to a human agent", "Start over", "Send an email instead"],
  },
  shipping_rates: {
    content:
      "Our shipping rates vary based on package weight, dimensions, and destination. Would you like to calculate shipping costs for a specific package?",
    options: [
      "Calculate shipping",
      "View rate table",
      "International shipping",
    ],
  },
  delivery_times: {
    content:
      "Our standard delivery times are:\n• Standard: 3-5 business days\n• Express: 1-2 business days\n• Same-day: Available in select metropolitan areas\n\nDelivery times may vary based on destination and weather conditions.",
    options: [
      "Check my delivery ETA",
      "Upgrade shipping",
      "Delivery guarantees",
    ],
  },
  damaged_item: {
    content:
      "I'm sorry to hear about your damaged item. To process a claim, we'll need:\n1. Order number\n2. Photos of the damaged item\n3. Description of the damage\n\nWould you like to start the claim process now?",
    options: ["Start claim process", "Speak to claims dept", "Return policy"],
  },
  address_change: {
    content:
      "Address changes can be processed if the package hasn't been dispatched yet. Could you provide your order number so I can check the status?",
    options: [
      "Provide order number",
      "Too late to change?",
      "Contact dispatch",
    ],
  },
  order_tracking: {
    content:
      "I'd be happy to help you track your package. Please provide your tracking number or order ID.",
    options: ["Where's my tracking number?", "Track by email", "Recent orders"],
  },
  returns: {
    content:
      "Our return policy allows returns within 30 days of delivery. Would you like to initiate a return or learn more about the process?",
    options: [
      "Start return process",
      "Return policy details",
      "Exchange instead",
    ],
  },
  international_shipping: {
    content:
      "We ship to over 150 countries worldwide. International shipping typically takes 7-14 business days plus customs clearance time. Would you like information about a specific country?",
    options: ["Customs information", "Restricted items", "International rates"],
  },
  payment_issues: {
    content:
      "I can help with payment-related inquiries. What specific payment issue are you experiencing?",
    options: ["Payment declined", "Billing address issue", "Payment methods"],
  },
  thanks: {
    content:
      "You're welcome! Is there anything else I can assist you with today?",
    options: ["Yes, another question", "No, that's all"],
  },
  goodbye: {
    content:
      "Thank you for contacting our customer service. If you have any more questions, feel free to chat with us again. Have a great day!",
    options: ["Start new inquiry", "Send feedback"],
  },
};

// Function to categorize queries
const categorizeQuery = (query: string): QueryCategory => {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.match(/(ship|send|cost|rate|price|package)/i))
    return "shipping";
  if (lowerQuery.match(/(deliver|when|arrive|time|schedule|eta|status)/i))
    return "delivery";
  if (lowerQuery.match(/(return|refund|exchange|broken|damaged|wrong)/i))
    return "returns";
  if (lowerQuery.match(/(pay|charge|bill|credit|debit|invoice|transaction)/i))
    return "payment";
  return "general";
};

export default function ChatWidget() {
  const [content, setContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<
    { category: QueryCategory; count: number }[]
  >([]);
  const [customerStatus, setCustomerStatus] = useState<
    "new" | "returning" | "priority"
  >("new");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle chat opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();

      // Show welcome message when opening
      if (messages.length === 0) {
        setIsTyping(true);
        setTimeout(() => {
          addAgentMessage(responseMap.greeting);
          setIsTyping(false);
        }, 800);
      }
    }
  }, [isOpen]);

  // Handle order number persistence
  useEffect(() => {
    if (orderNumber) {
      localStorage.setItem("lastOrderNumber", orderNumber);
    }
  }, [orderNumber]);

  // Retrieve last order number from localStorage
  useEffect(() => {
    const lastOrder = localStorage.getItem("lastOrderNumber");
    if (lastOrder) {
      setOrderNumber(lastOrder);
      setCustomerStatus("returning");
    }
  }, []);

  const addAgentMessage = (response: BotResponse) => {
    const newAgentMessage: ChatMessage = {
      id: Date.now().toString(),
      content: response.content,
      type: "agent",
      timestamp: new Date(),
      options: response.options,
    };

    setMessages((prev) => [...prev, newAgentMessage]);

    // If there's a follow-up message, queue it
    if (response.followUp) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          addAgentMessage({ content: response.followUp || "" });
          setIsTyping(false);
        }, 1000);
      }, 2000);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!content.trim()) return;

    const userMessage = content.trim();

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setContent("");

    // Add to query history
    const category = categorizeQuery(userMessage);
    setQueryHistory((prev) => [...prev, { category, count: 1 }]);

    // Check if user provided an order number
    const orderNumberMatch = userMessage.match(/order[:#\s-]*(\w{6,})/i);
    if (orderNumberMatch) {
      setOrderNumber(orderNumberMatch[1]);
    }

    // Simulate agent typing
    setIsTyping(true);

    // Process message with delay to simulate thinking
    setTimeout(() => {
      handleAgentResponse(userMessage);
      setIsTyping(false);
    }, Math.random() * 800 + 600);
  };

  const handleAgentResponse = (userMessage: string) => {
    const lowerMsg = userMessage.toLowerCase();
    const category = categorizeQuery(userMessage);

    // Upgrade status if this is a recurring issue
    if (queryHistory.filter((q) => q.category === category).length > 2) {
      setCustomerStatus("priority");
    }

    // Check for specific keywords
    if (lowerMsg.match(/^(hi|hello|hey|howdy|greetings).*/i)) {
      addAgentMessage(responseMap.greeting);
      return;
    }

    if (
      lowerMsg.match(
        /(track|where|status|locate|find).*(package|order|shipment|delivery)/i
      )
    ) {
      addAgentMessage(responseMap.order_tracking);
      return;
    }

    if (lowerMsg.match(/(how much|cost|price|rate).*(ship|deliver|send)/i)) {
      addAgentMessage(responseMap.shipping_rates);
      return;
    }

    if (lowerMsg.match(/(how long|when|time|arrive|eta|estimate)/i)) {
      addAgentMessage(responseMap.delivery_times);
      return;
    }

    if (lowerMsg.match(/(damage|broken|wrong|issue|problem)/i)) {
      addAgentMessage(responseMap.damaged_item);
      return;
    }

    if (lowerMsg.match(/(change|update|wrong).*(address|location)/i)) {
      addAgentMessage(responseMap.address_change);
      return;
    }

    if (lowerMsg.match(/(return|refund|exchange|send back)/i)) {
      addAgentMessage(responseMap.returns);
      return;
    }

    if (lowerMsg.match(/(international|overseas|another country|global)/i)) {
      addAgentMessage(responseMap.international_shipping);
      return;
    }

    if (lowerMsg.match(/(payment|charge|bill|credit|debit|card)/i)) {
      addAgentMessage(responseMap.payment_issues);
      return;
    }

    // Check for thanks
    if (lowerMsg.match(/(thank|thanks|thx|ty|appreciate).*/i)) {
      addAgentMessage(responseMap.thanks);
      return;
    }

    // Check for goodbyes
    if (lowerMsg.match(/(bye|goodbye|see you|farewell|end chat).*/i)) {
      addAgentMessage(responseMap.goodbye);
      return;
    }

    // Default response if no matches
    addAgentMessage(responseMap.default);
  };

  const handleQuickOption = (option: string) => {
    // Add user message
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: option,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    // Handle option
    setIsTyping(true);

    setTimeout(() => {
      const lowerOption = option.toLowerCase();

      if (lowerOption.includes("track")) {
        addAgentMessage(responseMap.order_tracking);
      } else if (
        lowerOption.includes("rate") ||
        lowerOption.includes("shipping")
      ) {
        addAgentMessage(responseMap.shipping_rates);
      } else if (
        lowerOption.includes("delivery") ||
        lowerOption.includes("time")
      ) {
        addAgentMessage(responseMap.delivery_times);
      } else if (
        lowerOption.includes("issue") ||
        lowerOption.includes("damage")
      ) {
        addAgentMessage(responseMap.damaged_item);
      } else if (lowerOption.includes("return")) {
        addAgentMessage(responseMap.returns);
      } else if (lowerOption.includes("international")) {
        addAgentMessage(responseMap.international_shipping);
      } else if (lowerOption.includes("payment")) {
        addAgentMessage(responseMap.payment_issues);
      } else if (
        lowerOption.includes("human") ||
        lowerOption.includes("agent")
      ) {
        addAgentMessage({
          content:
            "I'll connect you with a customer service representative. Please wait a moment while I transfer your chat.",
          followUp:
            "A representative will join the conversation shortly. Your reference number is CS-" +
            Math.floor(Math.random() * 10000),
        });
      } else {
        addAgentMessage(responseMap.default);
      }

      setIsTyping(false);
    }, Math.random() * 800 + 600);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Agent avatar component
  const AgentAvatar = () => (
    <div className="relative w-8 h-8">
      <div className="absolute inset-0 bg-emerald-100 rounded-full"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Bot className="h-5 w-5 text-emerald-600" />
      </div>
    </div>
  );

  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    // Add initial greeting
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        addAgentMessage(responseMap.greeting);
        setIsTyping(false);
      }, 800);
    }, 200);
  };

  return (
    <div className="fixed bottom-10 right-5 flex flex-col items-end z-50">
      {/* Chat widget toggle button */}
      {!isOpen && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-emerald-600 text-white rounded-full p-4 hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 rounded-full"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="mt-3 bg-white rounded-lg shadow-xl w-80 sm:w-96 overflow-hidden flex flex-col border border-gray-200 max-h-[550px]">
          {/* Chat header */}
          <div className="bg-emerald-600 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-full p-2 flex items-center justify-center">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold">Customer Support</h3>
                  <div className="flex items-center">
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-400 mr-1.5"></span>
                    <p className="text-xs text-emerald-50">Online</p>
                  </div>
                </div>
              </div>
              <button
                className="p-1.5 bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className="flex-1 p-4 overflow-y-auto bg-slate-50 h-80"
            ref={chatContainerRef}
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 items-start",
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  {message.type === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                  ) : (
                    <AgentAvatar />
                  )}

                  {/* Message content */}
                  <div className="flex flex-col max-w-[75%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 inline-block",
                        message.type === "user"
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-white text-gray-800 shadow-sm rounded-tl-none border border-gray-100"
                      )}
                    >
                      <p className="whitespace-pre-line text-sm">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 px-2">
                      {formatTime(message.timestamp)}
                    </span>

                    {/* Quick Options */}
                    {message.type === "agent" && message.options && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleQuickOption(option)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-3 py-1 text-xs transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Agent typing indicator */}
              {isTyping && (
                <div className="flex gap-2 items-start">
                  <AgentAvatar />
                  <div className="bg-white text-gray-800 rounded-lg rounded-tl-none px-4 py-2 shadow-sm inline-block border border-gray-100">
                    <div className="flex space-x-1 items-center h-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference for scrolling to bottom */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat input */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center space-x-2"
            >
              <Input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your inquiry..."
                className="flex-1 border text-sm"
                ref={inputRef}
              />
              <Button
                size="icon"
                type="submit"
                disabled={content.trim() === ""}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleClearChat}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
