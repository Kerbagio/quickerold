import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, AlertTriangle, Heart, Stethoscope, Pill, Phone, Search, Lightbulb, BookOpen, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'emergency' | 'general' | 'symptom' | 'medication' | 'education' | 'science' | 'technology' | 'lifestyle';
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

  // Comprehensive AI Knowledge Base - ChatGPT-like responses
  const aiKnowledge = {
    // Emergency conditions
    emergency: {
      keywords: ['emergency', 'urgent', 'severe', 'critical', 'life threatening', 'dying', 'help me', '911'],
      response: (context: string) => {
        return `I understand you're experiencing a serious medical situation. This requires immediate professional medical attention.

**Call emergency services right now:**
- **911** (US/Canada)
- **112** (Europe)
- **999** (UK)

**While waiting for help:**
- Stay calm and follow operator instructions
- Keep airways clear
- Don't move if you suspect injury
- Have someone stay with you

I cannot provide emergency medical advice - this needs immediate professional attention. Please call emergency services now.`
      },
      type: 'emergency' as const,
      followUp: "Are you able to call emergency services? I can help you find the nearest hospital once you're stable."
    },

    // Sexual health and education
    sex: {
      keywords: ['sex', 'sexual', 'intercourse', 'intimacy', 'reproduction', 'sexuality', 'sexual health'],
      response: (context: string) => {
        return `I'm happy to discuss sexual health and education in a mature, informative way.

**Sexual Health Basics:**
Sex is a natural part of human life involving physical intimacy between consenting adults. It's important to approach it with knowledge, respect, and safety.

**Key Aspects:**
- **Consent** - Always enthusiastic, ongoing, and clear consent from all parties
- **Safety** - Use protection to prevent STIs and unwanted pregnancy
- **Communication** - Open, honest discussion about boundaries and preferences
- **Health** - Regular check-ups and honest discussions with healthcare providers

**Safe Sex Practices:**
- Use condoms consistently and correctly
- Get tested regularly for STIs
- Discuss sexual history with partners
- Consider birth control options if pregnancy prevention is desired

**When to Seek Help:**
- Concerns about sexual function or satisfaction
- Questions about contraception or family planning
- STI symptoms or exposure
- Sexual health concerns

Would you like me to elaborate on any specific aspect of sexual health?`
      },
      type: 'education' as const,
      followUp: "Is there a specific aspect of sexual health you'd like to know more about?"
    },

    // Contraception and protection
    condom: {
      keywords: ['condom', 'contraception', 'birth control', 'protection', 'safe sex', 'prevent pregnancy', 'sti prevention'],
      response: (context: string) => {
        return `Condoms are an essential tool for safe sex and preventing both STIs and unwanted pregnancy.

**What are condoms?**
Condoms are thin sheaths (usually made of latex, polyurethane, or lambskin) that cover the penis during sex to prevent sperm from reaching the egg and to reduce STI transmission.

**Types of condoms:**
- **Male condoms** - Worn on the penis
- **Female condoms** - Inserted into the vagina
- **Latex** - Most common, effective against STIs
- **Polyurethane** - For latex allergies
- **Lambskin** - Natural but less effective against STIs

**How to use condoms correctly:**
1. Check expiration date and package integrity
2. Open carefully (don't use teeth)
3. Pinch the tip to leave space for semen
4. Roll down completely over erect penis
5. Use water-based lubricant if needed
6. Hold base when withdrawing
7. Dispose of properly after use

**Effectiveness:**
- **Perfect use**: 98% effective against pregnancy
- **Typical use**: 85% effective against pregnancy
- **STI protection**: Significantly reduces risk of most STIs

**When to use:**
- Every time you have vaginal, anal, or oral sex
- From start to finish of sexual activity
- Even if using other birth control methods

**Common mistakes:**
- Not checking expiration date
- Using oil-based lubricants with latex
- Not leaving space at the tip
- Putting on too late or removing too early

Do you have specific questions about condom use or other contraception methods?`
      },
      type: 'education' as const,
      followUp: "Would you like to know about other types of contraception or safe sex practices?"
    },

    // Headaches and pain
    headache: {
      keywords: ['headache', 'head pain', 'migraine', 'head ache', 'head pounding', 'tension headache', 'head hurts'],
      response: (context: string) => {
        return `Headaches are one of the most common health complaints. Let me help you understand the different types and what you can do about them.

**Types of Headaches:**

**1. Tension Headaches (Most Common)**
- Dull, pressure-like pain on both sides
- Often described as a "tight band" around the head
- Usually mild to moderate intensity
- Can last 30 minutes to several days

**2. Migraine Headaches**
- Throbbing pain, often on one side
- Can include nausea, vomiting, sensitivity to light/sound
- May have visual disturbances (aura) before pain starts
- Can last 4-72 hours

**3. Cluster Headaches**
- Severe, burning pain around one eye
- Often occur in "clusters" over weeks/months
- More common in men
- Can cause eye watering and nasal congestion

**4. Sinus Headaches**
- Pressure and pain around eyes, cheeks, forehead
- Often worse when bending forward
- Usually accompanied by nasal congestion

**Immediate Relief:**
- Rest in a quiet, dark room
- Apply cold compress to forehead or neck
- Stay hydrated (dehydration causes headaches)
- Gentle massage of temples and neck
- Over-the-counter pain relievers (acetaminophen, ibuprofen, aspirin)

**Lifestyle Factors:**
- **Sleep**: 7-9 hours consistently
- **Hydration**: 8 glasses of water daily
- **Stress management**: Deep breathing, meditation, exercise
- **Regular meals**: Don't skip meals
- **Caffeine**: Limit intake (withdrawal can cause headaches)

**When to Seek Medical Help:**
- Sudden, severe headache (worst of your life)
- Headache with fever, stiff neck, or rash
- Headache after head injury
- Headache with vision changes, confusion, or weakness
- Frequent headaches that interfere with daily life
- New headache pattern after age 50

**Prevention:**
- Identify and avoid triggers
- Maintain regular sleep schedule
- Manage stress effectively
- Stay hydrated
- Regular exercise
- Limit alcohol and processed foods

What type of headache are you experiencing? I can provide more specific guidance based on your symptoms.`
      },
      type: 'general' as const,
      followUp: "Can you describe your headache - is it throbbing, pressure, or sharp? Any other symptoms?"
    },

    // General health and wellness
    health: {
      keywords: ['health', 'wellness', 'healthy', 'diet', 'exercise', 'fitness', 'nutrition', 'lifestyle'],
      response: (context: string) => {
        return `I'm here to help with all aspects of health and wellness! Let me share some comprehensive guidance.

**Physical Health:**
- **Exercise**: 150 minutes moderate activity weekly (walking, swimming, cycling)
- **Strength training**: 2-3 times per week for all major muscle groups
- **Flexibility**: Daily stretching or yoga
- **Sleep**: 7-9 hours of quality sleep nightly
- **Hydration**: 8-10 glasses of water daily

**Nutrition:**
- **Balanced diet**: Fruits, vegetables, whole grains, lean proteins
- **Portion control**: Use smaller plates, eat slowly
- **Limit processed foods**: Focus on whole, unprocessed foods
- **Healthy fats**: Avocados, nuts, olive oil, fatty fish
- **Fiber**: 25-35g daily from fruits, vegetables, whole grains

**Mental Health:**
- **Stress management**: Meditation, deep breathing, hobbies
- **Social connections**: Maintain relationships with family and friends
- **Mindfulness**: Practice being present in the moment
- **Professional help**: Don't hesitate to seek therapy if needed

**Preventive Care:**
- **Regular check-ups**: Annual physical exams
- **Screenings**: Age-appropriate cancer and health screenings
- **Vaccinations**: Stay up-to-date with recommended vaccines
- **Dental care**: Regular cleanings and check-ups
- **Eye exams**: Regular vision checks

**Lifestyle Factors:**
- **Avoid smoking**: Quit if you smoke, avoid secondhand smoke
- **Limit alcohol**: Moderation is key (1 drink/day women, 2 men)
- **Sun protection**: Use sunscreen, avoid peak sun hours
- **Safety**: Wear seatbelts, helmets, practice safe sex

**Warning Signs to Watch:**
- Unexplained weight loss or gain
- Persistent fatigue
- Changes in sleep patterns
- Mood changes lasting more than 2 weeks
- New or unusual symptoms

What specific aspect of health would you like to focus on? I can provide more detailed guidance on any topic.`
      },
      type: 'lifestyle' as const,
      followUp: "What health goals are you working towards? I can help create a personalized plan."
    },

    // Technology and science
    technology: {
      keywords: ['technology', 'computer', 'phone', 'internet', 'ai', 'artificial intelligence', 'software', 'programming'],
      response: (context: string) => {
        return `Technology is fascinating! I'd be happy to discuss any tech topics you're curious about.

**Current Tech Trends:**
- **Artificial Intelligence**: Machine learning, neural networks, ChatGPT, automation
- **Mobile Technology**: Smartphones, apps, 5G networks, mobile payments
- **Cloud Computing**: Remote storage, software as a service, scalability
- **Internet of Things**: Smart homes, connected devices, sensors
- **Cybersecurity**: Data protection, privacy, encryption, safe browsing

**Programming & Development:**
- **Languages**: Python, JavaScript, Java, C++, Rust, Go
- **Web Development**: HTML, CSS, React, Node.js, databases
- **Mobile Apps**: iOS (Swift), Android (Kotlin/Java), cross-platform
- **Data Science**: Python, R, machine learning, statistics
- **DevOps**: Cloud platforms, containers, CI/CD, monitoring

**Emerging Technologies:**
- **Quantum Computing**: Revolutionary processing power
- **Blockchain**: Cryptocurrency, smart contracts, decentralized systems
- **Virtual/Augmented Reality**: Immersive experiences, training, gaming
- **Robotics**: Automation, AI integration, human-robot interaction
- **Biotechnology**: Gene editing, personalized medicine, synthetic biology

**Tech in Healthcare:**
- **Telemedicine**: Remote consultations, health monitoring
- **Wearables**: Fitness trackers, health monitoring devices
- **AI Diagnostics**: Medical imaging, pattern recognition
- **Electronic Health Records**: Digital patient data management
- **Precision Medicine**: Personalized treatments based on genetics

**Learning Resources:**
- **Online Courses**: Coursera, edX, Udemy, Khan Academy
- **Documentation**: Official docs, Stack Overflow, GitHub
- **Communities**: Reddit, Discord, professional networks
- **Practice**: Coding challenges, personal projects, open source

What specific technology topic interests you? I can dive deeper into any area!`
      },
      type: 'technology' as const,
      followUp: "Are you interested in learning about a specific technology or looking for career guidance in tech?"
    },

    // Science and education
    science: {
      keywords: ['science', 'physics', 'chemistry', 'biology', 'math', 'mathematics', 'research', 'experiment'],
      response: (context: string) => {
        return `Science is incredible! I love discussing scientific concepts and discoveries.

**Major Scientific Fields:**

**Physics:**
- **Classical Mechanics**: Motion, forces, energy, momentum
- **Thermodynamics**: Heat, temperature, energy transfer
- **Electromagnetism**: Electric and magnetic fields, waves
- **Quantum Mechanics**: Subatomic particles, wave-particle duality
- **Relativity**: Space-time, gravity, cosmic phenomena

**Chemistry:**
- **Organic Chemistry**: Carbon-based compounds, reactions
- **Inorganic Chemistry**: Metals, minerals, non-carbon compounds
- **Physical Chemistry**: Thermodynamics, kinetics, quantum chemistry
- **Biochemistry**: Chemical processes in living organisms
- **Analytical Chemistry**: Measurement and analysis techniques

**Biology:**
- **Cell Biology**: Structure and function of cells
- **Genetics**: DNA, inheritance, gene expression
- **Evolution**: Natural selection, adaptation, speciation
- **Ecology**: Ecosystems, biodiversity, environmental interactions
- **Human Biology**: Anatomy, physiology, health

**Mathematics:**
- **Algebra**: Equations, functions, graphing
- **Calculus**: Derivatives, integrals, limits
- **Statistics**: Data analysis, probability, hypothesis testing
- **Geometry**: Shapes, spatial relationships, proofs
- **Number Theory**: Prime numbers, divisibility, patterns

**Scientific Method:**
1. **Observation**: Notice something interesting
2. **Question**: Ask "why" or "how"
3. **Hypothesis**: Make an educated guess
4. **Experiment**: Test your hypothesis
5. **Analysis**: Examine the results
6. **Conclusion**: Determine if hypothesis was correct
7. **Communication**: Share findings with others

**Recent Scientific Discoveries:**
- **CRISPR Gene Editing**: Precise DNA modification
- **Gravitational Waves**: Ripples in space-time
- **Exoplanets**: Planets outside our solar system
- **Quantum Supremacy**: Quantum computers solving complex problems
- **COVID-19 Vaccines**: mRNA technology breakthrough

**Learning Science:**
- **Hands-on experiments**: Kitchen chemistry, physics demos
- **Online resources**: Khan Academy, Coursera, MIT OpenCourseWare
- **Documentaries**: Nature, Nova, Cosmos
- **Books**: Popular science, textbooks, biographies
- **Museums**: Science centers, planetariums, natural history

What scientific topic would you like to explore? I can explain complex concepts in simple terms!`
      },
      type: 'science' as const,
      followUp: "Are you interested in a specific scientific field or looking for help with a particular concept?"
    },

    // General knowledge and questions
    general: {
      keywords: ['hello', 'hi', 'help', 'what is', 'how does', 'explain', 'tell me about', 'question'],
      response: (context: string) => {
        return `Hello! I'm your AI assistant, and I'm here to help with any questions you have. I can discuss a wide range of topics including:

**Health & Medicine:**
- Symptoms, conditions, treatments
- Sexual health, contraception, relationships
- Mental health, wellness, lifestyle
- Emergency situations, first aid

**Science & Technology:**
- Physics, chemistry, biology, mathematics
- Computers, programming, artificial intelligence
- Space, environment, climate
- Research, experiments, discoveries

**General Knowledge:**
- History, geography, culture
- Current events, politics, economics
- Arts, literature, philosophy
- Sports, entertainment, hobbies

**Practical Advice:**
- Problem-solving, decision-making
- Learning strategies, study tips
- Career guidance, skill development
- Life skills, relationships, communication

**How I can help:**
- Answer specific questions with detailed explanations
- Provide step-by-step guidance for complex topics
- Offer multiple perspectives on controversial subjects
- Suggest resources for deeper learning
- Help you think through problems logically

**My approach:**
- I provide accurate, evidence-based information
- I'm respectful and inclusive in all discussions
- I encourage critical thinking and further research
- I'm honest about limitations and uncertainties
- I prioritize your safety and well-being

What would you like to know about? Feel free to ask me anything - no topic is off-limits for respectful, educational discussion!`
      },
      type: 'general' as const,
      followUp: "What specific topic or question would you like to explore? I'm here to help with anything you're curious about."
    }
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for specific topics first
    for (const [key, knowledge] of Object.entries(aiKnowledge)) {
      if (knowledge.keywords.some(keyword => message.includes(keyword))) {
        return knowledge.response(userMessage);
      }
    }
    
    // Default intelligent response for any question
    return `I understand you have a question! I'm designed to help with a wide range of topics including health, science, technology, relationships, and general knowledge.

**To give you the best answer, could you:**
- Be more specific about what you'd like to know?
- Provide more context about your question?
- Let me know if this is about health, technology, science, or something else?

**I can help with:**
- **Health questions**: Symptoms, treatments, sexual health, mental health
- **Educational topics**: Science, math, history, literature
- **Technology**: Programming, AI, computers, internet
- **Life advice**: Relationships, career, personal development
- **General knowledge**: Any topic you're curious about

**Examples of questions I can answer:**
- "What causes headaches and how can I treat them?"
- "How does artificial intelligence work?"
- "What are the different types of contraception?"
- "Explain quantum physics in simple terms"
- "How do I improve my study habits?"

What specific topic would you like to explore? I'm here to provide comprehensive, helpful information on just about anything!`
  };

  const getMessageType = (userMessage: string): Message['type'] => {
    const message = userMessage.toLowerCase();
    
    for (const [key, knowledge] of Object.entries(aiKnowledge)) {
      if (knowledge.keywords.some(keyword => message.includes(keyword))) {
        return knowledge.type;
      }
    }
    
    return 'general';
  };

  const getFollowUpQuestion = (userMessage: string): string | null => {
    const message = userMessage.toLowerCase();
    
    for (const [key, knowledge] of Object.entries(aiKnowledge)) {
      if (knowledge.keywords.some(keyword => message.includes(keyword))) {
        return knowledge.followUp || null;
      }
    }
    
    return null;
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

    // Simulate realistic AI thinking time
    const thinkingTime = 600 + Math.random() * 800; // 0.6-1.4 seconds
    
    setTimeout(() => {
      const botResponse = getBotResponse(inputText);
      const messageType = getMessageType(inputText);
      const followUp = getFollowUpQuestion(inputText);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Add follow-up question if available
      if (followUp) {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: followUp,
            sender: 'bot',
            timestamp: new Date(),
            type: 'general'
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 800);
      }
      
      setIsTyping(false);
    }, thinkingTime);
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
      case 'education':
        return <BookOpen className="w-5 h-5 text-purple-500" />;
      case 'science':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'technology':
        return <Zap className="w-5 h-5 text-blue-600" />;
      case 'lifestyle':
        return <Heart className="w-5 h-5 text-pink-500" />;
      default:
        return <Bot className="w-5 h-5 text-primary" />;
    }
  };

  const getMessageBadge = (type?: Message['type']) => {
    switch (type) {
      case 'emergency':
        return <Badge variant="destructive" className="text-xs">Emergency</Badge>;
      case 'symptom':
        return <Badge variant="secondary" className="text-xs">Health</Badge>;
      case 'medication':
        return <Badge variant="outline" className="text-xs">Medication</Badge>;
      case 'education':
        return <Badge variant="outline" className="text-xs">Education</Badge>;
      case 'science':
        return <Badge variant="outline" className="text-xs">Science</Badge>;
      case 'technology':
        return <Badge variant="outline" className="text-xs">Technology</Badge>;
      case 'lifestyle':
        return <Badge variant="outline" className="text-xs">Lifestyle</Badge>;
      default:
        return null;
    }
  };

  const quickActions = [
    { text: "What is sex?", icon: Heart, category: "education" },
    { text: "How do condoms work?", icon: Pill, category: "education" },
    { text: "I have a headache", icon: Stethoscope, category: "general" },
    { text: "Explain AI to me", icon: Zap, category: "technology" },
    { text: "How does gravity work?", icon: Lightbulb, category: "science" },
    { text: "Health and wellness tips", icon: Heart, category: "lifestyle" },
    { text: "Emergency help", icon: AlertTriangle, category: "emergency" },
    { text: "Ask me anything", icon: Bot, category: "general" }
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
            <h2 className="font-semibold text-lg">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Ask me anything - I'm here to help!</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Welcome to Your AI Assistant</h3>
            <p className="text-muted-foreground mb-4">
              I'm here to help with any questions you have! I can discuss health, science, technology, relationships, and much more.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Try asking me about:</p>
              <div className="space-y-2">
                {/* Education Topics */}
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">📚 Education & Health</p>
                  <div className="flex flex-wrap gap-1">
                    {quickActions.filter(a => a.category === 'education').map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInputText(action.text)}
                        className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <action.icon className="w-3 h-3 mr-1" />
                        {action.text}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Science & Tech */}
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1">🔬 Science & Technology</p>
                  <div className="flex flex-wrap gap-1">
                    {quickActions.filter(a => a.category === 'science' || a.category === 'technology').map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInputText(action.text)}
                        className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <action.icon className="w-3 h-3 mr-1" />
                        {action.text}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* General & Emergency */}
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">💬 General & Emergency</p>
                  <div className="flex flex-wrap gap-1">
                    {quickActions.filter(a => a.category === 'general' || a.category === 'emergency' || a.category === 'lifestyle').map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInputText(action.text)}
                        className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <action.icon className="w-3 h-3 mr-1" />
                        {action.text}
                      </Button>
                    ))}
                  </div>
                </div>
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
            
            <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-first' : ''}`}>
              <div
                className={`p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
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
            <div className="bg-muted p-4 rounded-2xl">
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
            placeholder="Ask me anything - health, science, technology, relationships..."
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
          <Search className="w-3 h-3 inline mr-1" />
          I can discuss any topic respectfully and informatively. Ask me anything!
        </div>
      </div>
    </div>
  );
};

export default HealthChatbot;