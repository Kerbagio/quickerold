import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, AlertTriangle, Heart, Stethoscope, Pill, Phone, Search, Lightbulb, BookOpen, Zap, Mic, MicOff, Volume2, VolumeX, MoreVertical, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mobile-specific effects
  useEffect(() => {
    // Initialize speech recognition for mobile
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Could not process voice input. Please try typing instead.",
          variant: "destructive"
        });
      };
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Auto-focus input on mobile when component mounts
    if (isMobile && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [language, isMobile, toast]);

  // Handle mobile keyboard events
  useEffect(() => {
    const handleResize = () => {
      // Scroll to bottom when keyboard appears/disappears on mobile
      if (isMobile) {
        setTimeout(scrollToBottom, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Comprehensive AI Knowledge Base - Enhanced with hospital decision logic
  const aiKnowledge = {
    // Emergency conditions
    emergency: {
      keywords: ['emergency', 'urgent', 'severe', 'critical', 'life threatening', 'dying', 'help me', '911', 'chest pain', 'can\'t breathe', 'unconscious', 'severe bleeding'],
      response: (context: string) => {
        return `🚨 **EMERGENCY SITUATION DETECTED** 🚨

This requires **IMMEDIATE** professional medical attention. You should go to the hospital right now.

**Call emergency services immediately:**
- **911** (US/Canada)
- **112** (Europe)
- **999** (UK)
- **000** (Australia)

**While waiting for help:**
- Stay calm and follow operator instructions
- Keep airways clear
- Don't move if you suspect injury
- Have someone stay with you
- If alone, unlock your door for emergency responders

**This is NOT something to wait on or treat at home. Go to the hospital immediately.**

I cannot provide emergency medical advice - this needs immediate professional attention. Please call emergency services now.`
      },
      type: 'emergency' as const,
      followUp: "Are you able to call emergency services? I can help you find the nearest hospital once you're stable."
    },

    // Fever and infections
    fever: {
      keywords: ['fever', 'temperature', 'hot', 'burning up', 'chills', 'sweating', 'infection', 'flu', 'cold'],
      response: (context: string) => {
        return `Fever is your body's natural response to infection or illness. Here's what you need to know:

**What is a fever?**
- Normal body temperature: 98.6°F (37°C)
- Fever: 100.4°F (38°C) or higher
- High fever: 103°F (39.4°C) or higher

**When to go to the hospital:**
- **Temperature above 104°F (40°C)**
- **Fever lasting more than 3 days**
- **Fever with severe headache, stiff neck, or rash**
- **Fever with difficulty breathing**
- **Fever in infants under 3 months**
- **Fever with confusion or seizures**

**Home care for mild fever:**
- Rest and stay hydrated
- Take acetaminophen or ibuprofen
- Use cool compresses
- Wear light clothing
- Monitor temperature regularly

**Seek medical care if:**
- Fever persists despite treatment
- You have other concerning symptoms
- You feel very unwell
- Fever returns after improving

**When to call your doctor:**
- Fever over 102°F (38.9°C) in adults
- Fever with other symptoms
- Fever that doesn't respond to medication
- Concerns about your condition

What's your current temperature and how long have you had the fever?`
      },
      type: 'symptom' as const,
      followUp: "What's your temperature reading and are you experiencing any other symptoms?"
    },

    // Chest pain and heart issues
    chestPain: {
      keywords: ['chest pain', 'heart pain', 'chest tightness', 'heart attack', 'angina', 'chest pressure', 'heartburn', 'chest discomfort'],
      response: (context: string) => {
        return `⚠️ **CHEST PAIN REQUIRES IMMEDIATE ATTENTION** ⚠️

**Go to the hospital immediately if you have:**
- **Severe chest pain or pressure**
- **Pain spreading to arm, neck, jaw, or back**
- **Shortness of breath**
- **Nausea, sweating, or dizziness with chest pain**
- **Pain lasting more than 15 minutes**

**Call 911 immediately - this could be a heart attack!**

**Less urgent chest pain causes:**
- **Heartburn/acid reflux** - Burning sensation, worse after eating
- **Muscle strain** - Pain with movement, tender to touch
- **Anxiety** - Tightness, often with rapid breathing
- **Costochondritis** - Sharp pain, worse with deep breaths

**When to go to ER:**
- Any severe chest pain
- Pain with shortness of breath
- Pain radiating to other areas
- Pain with nausea/vomiting
- Pain lasting more than 15 minutes
- Pain that's different from usual

**When to see doctor soon:**
- Mild chest pain that persists
- Pain with certain activities
- Recurring chest discomfort
- Pain that worries you

**This is serious - if in doubt, go to the hospital immediately.**

Are you experiencing any of the severe symptoms I mentioned?`
      },
      type: 'emergency' as const,
      followUp: "Are you having any shortness of breath or pain in your arms, neck, or jaw?"
    },

    // Breathing problems
    breathing: {
      keywords: ['can\'t breathe', 'shortness of breath', 'breathing problems', 'wheezing', 'asthma', 'choking', 'suffocating', 'chest tightness'],
      response: (context: string) => {
        return `🚨 **BREATHING PROBLEMS ARE SERIOUS** 🚨

**Go to the hospital immediately if you have:**
- **Severe shortness of breath**
- **Can't speak in full sentences**
- **Lips or fingernails turning blue**
- **Chest pain with breathing**
- **Rapid breathing (over 30 breaths per minute)**
- **Feeling like you're suffocating**

**Call 911 immediately!**

**Common causes of breathing problems:**
- **Asthma attack** - Wheezing, tight chest, difficulty exhaling
- **Anxiety/panic attack** - Rapid breathing, feeling of suffocation
- **Allergic reaction** - Swelling, hives, difficulty breathing
- **Pneumonia** - Fever, cough, chest pain with breathing
- **Heart problems** - Chest pain, fatigue, swelling

**When to go to ER:**
- Any severe breathing difficulty
- Blue lips or fingernails
- Can't speak normally
- Chest pain with breathing
- Rapid breathing
- Feeling of suffocation

**When to see doctor soon:**
- Mild breathing problems that persist
- Wheezing that doesn't improve
- Breathing problems with other symptoms
- Recurring breathing issues

**This is an emergency - go to the hospital now if you're having severe trouble breathing.**

Are you able to speak in full sentences right now?`
      },
      type: 'emergency' as const,
      followUp: "Are you experiencing any chest pain or do your lips look blue?"
    },

    // Headaches and pain
    headache: {
      keywords: ['headache', 'head pain', 'migraine', 'head ache', 'head pounding', 'tension headache', 'head hurts'],
      response: (context: string) => {
        return `Headaches are one of the most common health complaints. Let me help you understand when to seek help.

**When to go to the hospital immediately:**
- **Sudden, severe headache (worst of your life)**
- **Headache with fever, stiff neck, or rash**
- **Headache after head injury**
- **Headache with vision changes, confusion, or weakness**
- **Headache with difficulty speaking or walking**
- **Headache that wakes you from sleep**

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

**Home care for mild headaches:**
- Rest in a quiet, dark room
- Apply cold compress to forehead or neck
- Stay hydrated (dehydration causes headaches)
- Gentle massage of temples and neck
- Over-the-counter pain relievers (acetaminophen, ibuprofen, aspirin)

**When to see a doctor:**
- Frequent headaches that interfere with daily life
- New headache pattern after age 50
- Headaches that don't respond to over-the-counter medication
- Headaches with other concerning symptoms

**Prevention:**
- Identify and avoid triggers
- Maintain regular sleep schedule
- Manage stress effectively
- Stay hydrated
- Regular exercise
- Limit alcohol and processed foods

What type of headache are you experiencing? Are you having any of the severe symptoms I mentioned?`
      },
      type: 'symptom' as const,
      followUp: "Can you describe your headache - is it throbbing, pressure, or sharp? Any other symptoms?"
    },

    // Stomach and digestive issues
    stomach: {
      keywords: ['stomach pain', 'stomach ache', 'abdominal pain', 'belly pain', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'stomach upset'],
      response: (context: string) => {
        return `Stomach and digestive issues are common but can range from mild to serious. Here's when to seek help:

**When to go to the hospital immediately:**
- **Severe abdominal pain that comes on suddenly**
- **Pain with fever, nausea, and vomiting**
- **Pain with bloody or black stools**
- **Pain with difficulty breathing**
- **Pain that prevents you from moving**
- **Signs of dehydration (dizziness, no urination)**
- **Severe vomiting that lasts more than 24 hours**

**Common causes of stomach pain:**
- **Indigestion** - Burning sensation, bloating, fullness
- **Food poisoning** - Nausea, vomiting, diarrhea, fever
- **Stomach flu** - Nausea, vomiting, diarrhea, mild fever
- **Constipation** - Hard stools, bloating, discomfort
- **Gas** - Cramping, bloating, relief with passing gas
- **Stress/anxiety** - Nervous stomach, butterflies

**When to see a doctor soon:**
- Pain that persists for more than a few days
- Pain that gets worse
- Pain with other symptoms
- Unexplained weight loss
- Changes in bowel habits
- Blood in stool or vomit

**Home care for mild stomach issues:**
- Rest and stay hydrated
- Eat bland foods (bananas, rice, toast)
- Avoid dairy, spicy, or fatty foods
- Use heating pad for cramps
- Over-the-counter antacids for heartburn

**Signs of dehydration:**
- Dry mouth and throat
- Dizziness when standing
- Dark urine or no urination
- Fatigue and weakness

Are you experiencing any of the severe symptoms I mentioned?`
      },
      type: 'symptom' as const,
      followUp: "How long have you had the stomach pain and are you experiencing any vomiting or fever?"
    },

    // Cold and flu symptoms
    coldFlu: {
      keywords: ['cold', 'flu', 'cough', 'sore throat', 'runny nose', 'congestion', 'sneezing', 'influenza', 'respiratory infection'],
      response: (context: string) => {
        return `Cold and flu are common respiratory infections. Here's how to tell the difference and when to seek help:

**When to go to the hospital:**
- **Difficulty breathing or shortness of breath**
- **High fever (over 103°F/39.4°C) that doesn't respond to medication**
- **Severe dehydration (can't keep fluids down)**
- **Confusion or altered mental state**
- **Chest pain with breathing**
- **Blue lips or fingernails**

**Cold vs Flu symptoms:**

**Common Cold:**
- Gradual onset
- Runny/stuffy nose
- Sneezing
- Sore throat
- Mild cough
- Usually no fever or mild fever
- Lasts 3-7 days

**Influenza (Flu):**
- Sudden onset
- High fever (100-102°F)
- Body aches and chills
- Fatigue and weakness
- Dry cough
- Headache
- Can last 1-2 weeks

**When to see a doctor:**
- Symptoms lasting more than 10 days
- High fever that persists
- Severe sore throat with difficulty swallowing
- Ear pain or sinus pressure
- Wheezing or difficulty breathing
- Symptoms that improve then worsen

**Home care:**
- Rest and stay hydrated
- Use humidifier or steam
- Gargle with salt water for sore throat
- Over-the-counter medications for symptoms
- Stay home to avoid spreading illness

**Prevention:**
- Wash hands frequently
- Avoid close contact with sick people
- Get annual flu vaccine
- Don't touch your face
- Clean and disinfect surfaces

Are you experiencing any breathing difficulties or high fever?`
      },
      type: 'symptom' as const,
      followUp: "What symptoms are you experiencing and how long have you had them?"
    },

    // Skin problems
    skin: {
      keywords: ['rash', 'skin rash', 'hives', 'itching', 'skin irritation', 'allergic reaction', 'dermatitis', 'eczema', 'skin infection'],
      response: (context: string) => {
        return `Skin problems can range from mild irritation to serious conditions. Here's when to seek help:

**When to go to the hospital immediately:**
- **Rash with difficulty breathing or swallowing**
- **Rash with fever and feeling very unwell**
- **Rash that spreads quickly over large areas**
- **Rash with signs of infection (warmth, pus, red streaks)**
- **Rash with joint pain or swelling**
- **Rash that looks like bruises or doesn't fade when pressed**

**Common skin conditions:**
- **Allergic reaction** - Red, itchy rash, often with hives
- **Eczema** - Dry, itchy, red patches
- **Contact dermatitis** - Red, itchy rash from irritants
- **Fungal infection** - Red, scaly patches, often in folds
- **Viral rash** - Often with fever, can be various patterns
- **Heat rash** - Small red bumps, often in hot weather

**When to see a doctor:**
- Rash that doesn't improve with home care
- Rash that spreads or gets worse
- Rash with fever or other symptoms
- Rash that's painful or interferes with daily life
- Rash in sensitive areas (face, genitals)
- Signs of infection

**Home care for mild rashes:**
- Keep skin clean and dry
- Use gentle, fragrance-free products
- Apply cool compresses
- Use over-the-counter hydrocortisone cream
- Avoid scratching
- Wear loose, breathable clothing

**Signs of serious allergic reaction:**
- Difficulty breathing
- Swelling of face, lips, or tongue
- Dizziness or fainting
- Rapid heartbeat
- Nausea or vomiting

Are you experiencing any breathing difficulties or signs of a serious allergic reaction?`
      },
      type: 'symptom' as const,
      followUp: "What does the rash look like and are you experiencing any other symptoms?"
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
- **Safety**: Wear seatbelts, helmets, practice safe habits

**Warning Signs to Watch:**
- Unexplained weight loss or gain
- Persistent fatigue
- Changes in sleep patterns
- Mood changes lasting more than 2 weeks
- New or unusual symptoms

**When to see a doctor:**
- Any concerning symptoms that persist
- Changes in your normal health patterns
- Preventive care and regular check-ups
- Questions about your health

What specific aspect of health would you like to focus on? I can provide more detailed guidance on any topic.`
      },
      type: 'lifestyle' as const,
      followUp: "What health goals are you working towards? I can help create a personalized plan."
    },

    // Back pain
    backPain: {
      keywords: ['back pain', 'backache', 'lower back pain', 'upper back pain', 'spine pain', 'back injury'],
      response: (context: string) => {
        return `Back pain is very common and can range from mild to severe. Here's when to seek help:

**When to go to the hospital immediately:**
- **Severe pain after injury (fall, accident)**
- **Pain with numbness or weakness in legs**
- **Loss of bladder or bowel control**
- **Severe pain that prevents movement**
- **Pain with fever and weight loss**
- **Pain that radiates down both legs**

**Common causes of back pain:**
- **Muscle strain** - Most common, from lifting or twisting
- **Poor posture** - Sitting or standing incorrectly
- **Herniated disc** - Disc pressing on nerve
- **Arthritis** - Joint inflammation in spine
- **Osteoporosis** - Weakened bones
- **Stress** - Tension causing muscle tightness

**When to see a doctor:**
- Pain lasting more than a few weeks
- Pain that gets worse
- Pain with other symptoms
- Numbness or tingling in legs
- Difficulty walking or standing
- Pain that interferes with sleep

**Home care for mild back pain:**
- Rest for 1-2 days (not longer)
- Apply ice for first 48 hours, then heat
- Gentle stretching and movement
- Over-the-counter pain relievers
- Maintain good posture
- Sleep on firm mattress

**Prevention:**
- Regular exercise to strengthen core
- Proper lifting techniques
- Good posture when sitting/standing
- Maintain healthy weight
- Stretch regularly
- Use ergonomic furniture

Are you experiencing any numbness, weakness, or loss of bladder control?`
      },
      type: 'symptom' as const,
      followUp: "How long have you had the back pain and did it start after an injury?"
    },

    // Joint pain and arthritis
    jointPain: {
      keywords: ['joint pain', 'arthritis', 'knee pain', 'hip pain', 'shoulder pain', 'elbow pain', 'wrist pain', 'ankle pain'],
      response: (context: string) => {
        return `Joint pain can affect any joint in your body. Here's when to seek help:

**When to go to the hospital:**
- **Severe joint pain with swelling and redness**
- **Joint pain with fever and feeling unwell**
- **Inability to move the joint**
- **Joint deformity or severe swelling**
- **Pain after serious injury**

**Common causes of joint pain:**
- **Osteoarthritis** - Wear and tear on joints
- **Rheumatoid arthritis** - Autoimmune condition
- **Gout** - Uric acid crystals in joints
- **Bursitis** - Inflammation of fluid-filled sacs
- **Tendonitis** - Inflammation of tendons
- **Injury** - Sprains, strains, fractures

**When to see a doctor:**
- Joint pain lasting more than a few weeks
- Pain that gets worse over time
- Swelling, redness, or warmth in joint
- Stiffness lasting more than 30 minutes
- Pain that interferes with daily activities
- Joint pain with other symptoms

**Home care for mild joint pain:**
- Rest the affected joint
- Apply ice for 15-20 minutes
- Use compression bandage
- Elevate the joint
- Over-the-counter pain relievers
- Gentle range-of-motion exercises

**Prevention:**
- Maintain healthy weight
- Regular low-impact exercise
- Proper warm-up before activity
- Use proper equipment and technique
- Avoid repetitive stress on joints
- Eat anti-inflammatory foods

Are you experiencing any swelling, redness, or fever with the joint pain?`
      },
      type: 'symptom' as const,
      followUp: "Which joint is affected and how long have you had the pain?"
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
    // Input validation and sanitization
    if (!inputText.trim() || inputText.length > 1000) return;

    // Sanitize input to prevent basic XSS attempts
    const sanitizedText = inputText.trim().replace(/[<>]/g, '');

    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitizedText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate realistic AI thinking time
    const thinkingTime = 600 + Math.random() * 800; // 0.6-1.4 seconds
    
    setTimeout(() => {
      const botResponse = getBotResponse(sanitizedText);
      const messageType = getMessageType(sanitizedText);
      const followUp = getFollowUpQuestion(sanitizedText);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response on mobile if not muted
      if (isMobile && !isMuted) {
        speakText(botResponse);
      }
      
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
          
          // Speak follow-up on mobile if not muted
          if (isMobile && !isMuted) {
            speakText(followUp);
          }
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

  // Mobile-specific functions
  const startVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (synthRef.current && !isMuted) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthRef.current.speak(utterance);
    }
  };

  const handleMobileInputFocus = () => {
    if (isMobile) {
      // Scroll to bottom when input is focused on mobile
      setTimeout(scrollToBottom, 300);
    }
  };

  const handleQuickActionClick = (actionText: string) => {
    setInputText(actionText);
    setShowQuickActions(false);
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
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
    { text: "I have a headache", icon: Stethoscope, category: "symptom" },
    { text: "I have a fever", icon: Heart, category: "symptom" },
    { text: "Chest pain", icon: AlertTriangle, category: "emergency" },
    { text: "Stomach pain", icon: Stethoscope, category: "symptom" },
    { text: "Back pain", icon: Stethoscope, category: "symptom" },
    { text: "Joint pain", icon: Stethoscope, category: "symptom" },
    { text: "Health and wellness tips", icon: Heart, category: "lifestyle" },
    { text: "Emergency help", icon: AlertTriangle, category: "emergency" }
  ];

  return (
    <div className={`flex flex-col h-full ${isMobile ? 'min-h-screen' : ''}`}>
      {/* Header - Mobile Optimized */}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-b border-border bg-primary/5 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-primary/10 rounded-full flex items-center justify-center`}>
              <Bot className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-primary`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`${isMobile ? 'font-semibold text-base' : 'font-semibold text-lg'} truncate`}>AI Assistant</h2>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground truncate`}>Ask me anything - I'm here to help!</p>
            </div>
          </div>
          
          {/* Mobile Controls */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="w-8 h-8"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Quick Actions Overlay */}
      {isMobile && showQuickActions && (
        <div className="absolute top-16 right-3 z-20 bg-background border border-border rounded-lg shadow-lg p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Quick Actions</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQuickActions(false)}
              className="w-6 h-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {quickActions.slice(0, 6).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickActionClick(action.text)}
                className="w-full justify-start text-xs h-8"
              >
                <action.icon className="w-3 h-3 mr-2" />
                {action.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages - Mobile Optimized */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-4'} space-y-3`}>
        {messages.length === 0 && (
          <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
            <Bot className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-muted-foreground mx-auto mb-4 opacity-50`} />
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-2`}>Welcome to Your Health Assistant</h3>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mb-4`}>
              I'm here to help with your health questions and concerns! I can assess symptoms, provide health guidance, and help you decide when to seek medical care.
            </p>
            
            {!isMobile && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">Try asking me about:</p>
                <div className="space-y-2">
                  {/* Health Symptoms */}
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">🏥 Health Symptoms</p>
                    <div className="flex flex-wrap gap-1">
                      {quickActions.filter(a => a.category === 'symptom').map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setInputText(action.text)}
                          className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <action.icon className="w-3 h-3 mr-1" />
                          {action.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Emergency & General */}
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-1">🚨 Emergency & General</p>
                    <div className="flex flex-wrap gap-1">
                      {quickActions.filter(a => a.category === 'emergency' || a.category === 'general' || a.category === 'lifestyle').map((action, index) => (
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
            )}
            
            {isMobile && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Tap the menu button above for quick actions</p>
                <p className="text-xs text-muted-foreground">Or use voice input with the mic button below</p>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${isMobile ? 'mb-2' : ''}`}
          >
            {message.sender === 'bot' && (
              <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0`}>
                {getMessageIcon(message.type)}
              </div>
            )}
            
            <div className={`${isMobile ? 'max-w-[80%]' : 'max-w-[85%]'} ${message.sender === 'user' ? 'order-first' : ''}`}>
              <div
                className={`${isMobile ? 'p-3' : 'p-4'} rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed`}>{message.text}</div>
                    {message.type && message.sender === 'bot' && (
                      <div className="mt-2">
                        {getMessageBadge(message.type)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.sender === 'user' && (
              <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0`}>
                <User className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className={`flex ${isMobile ? 'gap-2' : 'gap-3'} justify-start`}>
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-primary/10 rounded-full flex items-center justify-center`}>
              <Bot className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary`} />
            </div>
            <div className={`bg-muted ${isMobile ? 'p-3' : 'p-4'} rounded-2xl`}>
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

      {/* Input - Mobile Optimized */}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-border bg-background sticky bottom-0`}>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleMobileInputFocus}
            placeholder={isMobile ? "Ask me anything..." : "Ask me anything - health, science, technology, relationships..."}
            className="flex-1"
            disabled={isTyping}
          />
          
          {/* Voice Input Button - Mobile */}
          {isMobile && (
            <Button
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isTyping}
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              className="flex-shrink-0"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className={`mt-2 ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground text-center`}>
          {isMobile ? (
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center">
                <Mic className="w-3 h-3 inline mr-1" />
                Voice input
              </span>
              <span className="flex items-center">
                <Search className="w-3 h-3 inline mr-1" />
                Ask anything
              </span>
            </div>
          ) : (
            <span className="flex items-center justify-center">
              <Search className="w-3 h-3 inline mr-1" />
              I can discuss any topic respectfully and informatively. Ask me anything!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthChatbot;