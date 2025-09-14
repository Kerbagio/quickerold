import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, AlertTriangle, Heart, Stethoscope, Pill, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'emergency' | 'general' | 'symptom' | 'medication';
}

const HealthChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Health knowledge base
  const healthResponses = {
    emergency: {
      keywords: ['emergency', 'urgent', 'severe', 'critical', 'life threatening', 'can\'t breathe', 'chest pain', 'unconscious', 'bleeding heavily'],
      response: "🚨 **EMERGENCY ALERT** 🚨\n\nThis sounds like a medical emergency. Please:\n\n1. **Call emergency services immediately** (911, 112, or your local emergency number)\n2. **Don't wait** - get professional help right away\n3. **Use QuickER** to find the nearest hospital\n\nI cannot provide emergency medical advice. Please seek immediate professional help.",
      type: 'emergency' as const
    },
    chestPain: {
      keywords: ['chest pain', 'heart pain', 'chest tightness', 'heart attack', 'angina'],
      response: "🫀 **Chest Pain - Seek Immediate Help**\n\nChest pain can be serious. Please:\n\n1. **Call emergency services** if pain is severe or sudden\n2. **Stop all activity** and rest\n3. **Use QuickER** to find the nearest cardiac center\n4. **Don't drive yourself** to the hospital\n\n**Red flags:** Pain spreading to arm/jaw, shortness of breath, nausea, sweating",
      type: 'emergency' as const
    },
    breathing: {
      keywords: ['can\'t breathe', 'shortness of breath', 'breathing difficulty', 'wheezing', 'asthma attack'],
      response: "🫁 **Breathing Difficulty - Get Help Now**\n\nDifficulty breathing is serious. Please:\n\n1. **Call emergency services** immediately\n2. **Sit upright** and try to stay calm\n3. **Use QuickER** to find the nearest emergency room\n4. **If you have an inhaler**, use it as prescribed\n\n**Don't delay** - breathing problems can become life-threatening quickly.",
      type: 'emergency' as const
    },
    fever: {
      keywords: ['fever', 'high temperature', 'hot', 'burning up'],
      response: "🌡️ **Fever Management**\n\nFor fever:\n\n1. **Rest** and stay hydrated\n2. **Take temperature** - if over 103°F (39.4°C), seek medical help\n3. **Use fever reducers** like acetaminophen or ibuprofen (follow package instructions)\n4. **Cool compresses** on forehead and neck\n5. **Monitor symptoms** - if fever persists >3 days, see a doctor\n\n**Seek immediate help if:** Fever with rash, stiff neck, confusion, or difficulty breathing",
      type: 'general' as const
    },
    headache: {
      keywords: ['headache', 'head pain', 'migraine', 'head ache'],
      response: "🤕 **Headache Relief**\n\nFor headaches:\n\n1. **Rest** in a quiet, dark room\n2. **Stay hydrated** - drink plenty of water\n3. **Apply cold compress** to forehead\n4. **Over-the-counter pain relievers** (acetaminophen, ibuprofen)\n5. **Avoid triggers** like bright lights, loud noises\n\n**Seek medical help if:** Sudden severe headache, headache with fever/stiff neck, or headache after head injury",
      type: 'general' as const
    },
    stomach: {
      keywords: ['stomach pain', 'stomach ache', 'nausea', 'vomiting', 'diarrhea', 'stomach bug'],
      response: "🤢 **Stomach Issues**\n\nFor stomach problems:\n\n1. **Stay hydrated** - drink clear fluids\n2. **Eat bland foods** (rice, bananas, toast)\n3. **Avoid** dairy, spicy, or fatty foods\n4. **Rest** and avoid strenuous activity\n5. **Over-the-counter** anti-nausea or anti-diarrheal medications\n\n**Seek medical help if:** Severe pain, blood in vomit/stool, dehydration, or symptoms persist >48 hours",
      type: 'general' as const
    },
    medication: {
      keywords: ['medication', 'medicine', 'drug', 'pill', 'prescription', 'side effects'],
      response: "💊 **Medication Information**\n\nFor medication questions:\n\n1. **Read the label** and package insert carefully\n2. **Follow dosage** instructions exactly\n3. **Check interactions** with other medications\n4. **Contact your pharmacist** for specific questions\n5. **Call your doctor** for prescription concerns\n\n**Never stop taking prescribed medication** without consulting your doctor first.",
      type: 'medication' as const
    },
    general: {
      keywords: ['hello', 'hi', 'help', 'health', 'sick', 'not feeling well'],
      response: "👋 **Health Assistant**\n\nI'm here to help with general health questions! I can assist with:\n\n• **Symptom guidance** and when to seek help\n• **First aid** information\n• **Medication** questions\n• **Emergency** situations\n• **Finding hospitals** using QuickER\n\n**Remember:** I provide general information only. For medical emergencies, call emergency services immediately.",
      type: 'general' as const
    }
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for emergency keywords first
    for (const [key, response] of Object.entries(healthResponses)) {
      if (response.keywords.some(keyword => message.includes(keyword))) {
        return response.response;
      }
    }
    
    // Default response
    return "I understand you're not feeling well. Could you describe your symptoms more specifically? I can help guide you on whether you need immediate medical attention or general care advice. For emergencies, please call emergency services immediately.";
  };

  const getMessageType = (userMessage: string): Message['type'] => {
    const message = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(healthResponses)) {
      if (response.keywords.some(keyword => message.includes(keyword))) {
        return response.type;
      }
    }
    
    return 'general';
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = getBotResponse(inputText);
      const messageType = getMessageType(inputText);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (type?: Message['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'symptom':
        return <Stethoscope className="w-5 h-5 text-blue-500" />;
      case 'medication':
        return <Pill className="w-5 h-5 text-green-500" />;
      default:
        return <Bot className="w-5 h-5 text-primary" />;
    }
  };

  const getMessageBadge = (type?: Message['type']) => {
    switch (type) {
      case 'emergency':
        return <Badge variant="destructive" className="text-xs">Emergency</Badge>;
      case 'symptom':
        return <Badge variant="secondary" className="text-xs">Symptom Check</Badge>;
      case 'medication':
        return <Badge variant="outline" className="text-xs">Medication</Badge>;
      default:
        return null;
    }
  };

  const quickActions = [
    { text: "I have chest pain", icon: Heart },
    { text: "I can't breathe properly", icon: AlertTriangle },
    { text: "I have a fever", icon: Stethoscope },
    { text: "I have a headache", icon: Bot },
    { text: "Find nearest hospital", icon: Phone }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Health Assistant</h2>
            <p className="text-sm text-muted-foreground">Ask me about your health concerns</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Welcome to Health Assistant</h3>
            <p className="text-muted-foreground mb-4">
              I'm here to help with your health questions. Ask me about symptoms, medications, or emergencies.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Quick actions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText(action.text)}
                    className="text-xs"
                  >
                    <action.icon className="w-3 h-3 mr-1" />
                    {action.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                {getMessageIcon(message.type)}
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
              <div
                className={`p-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                    {message.type && message.sender === 'bot' && (
                      <div className="mt-2">
                        {getMessageBadge(message.type)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-xs text-muted-foreground mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.sender === 'user' && (
              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="bg-muted p-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your health concerns..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          For medical emergencies, call emergency services immediately
        </div>
      </div>
    </div>
  );
};

export default HealthChatbot;
