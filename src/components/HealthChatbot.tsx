import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, AlertTriangle, Heart, Stethoscope, Pill, Phone, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { pipeline } from "@huggingface/transformers";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'emergency' | 'general' | 'symptom' | 'medication';
  isStreaming?: boolean;
}

const HealthChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generator, setGenerator] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize AI model
  useEffect(() => {
    const initializeAI = async () => {
      try {
        setIsLoading(true);
        const textGenerator = await pipeline('text-generation', 'Xenova/distilgpt2', {
          device: 'webgpu', // Use WebGPU for better performance, fallback to CPU
        });
        setGenerator(textGenerator);
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: `👋 Hello! I'm your AI Health Assistant powered by advanced language models. I can help you with health questions, symptoms analysis, medication information, and wellness guidance. How can I assist you today?`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'general'
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to initialize AI model:', error);
        // Fallback welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: `👋 Hello! I'm your AI Health Assistant. I can help you with health questions, symptoms analysis, medication information, and wellness guidance. How can I assist you today?`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'general'
        };
        setMessages([welcomeMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAI();
  }, []);

  // Add the AI response generation and intelligent fallback functions after the existing useEffect
  // Generate AI response using local model or intelligent fallback
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Check for emergency keywords first
      const emergencyKeywords = ['emergency', 'urgent', 'severe', 'critical', 'life threatening', 'dying', 'help me', '911', 'can\'t breathe', 'chest pain', 'heart attack'];
      const isEmergency = emergencyKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
      
      if (isEmergency) {
        return `🚨 **MEDICAL EMERGENCY DETECTED** 🚨

I understand you're experiencing a serious medical situation. Here's what you need to do **immediately**:

**IMMEDIATE ACTIONS:**
1. **Call emergency services NOW** (911, 112, or your local emergency number)
2. **Stay calm** and follow operator instructions
3. **Don't hang up** until help arrives
4. **Use QuickER** to find the nearest emergency room

**WHILE WAITING FOR HELP:**
- Stay in a safe position
- Keep airways clear
- Don't move if you suspect injury
- Have someone stay with you

**I cannot provide emergency medical advice.** This requires immediate professional medical attention. Please call emergency services right now.

*QuickER can help you find the nearest hospital once you're stable.*`;
      }

      // Create a health-focused prompt
      const healthPrompt = `You are a knowledgeable and caring AI health assistant. A user asks: "${userMessage}"

Provide a helpful, accurate, and empathetic response that:
- Addresses their health concern professionally
- Offers practical guidance and information
- Suggests when to seek medical attention
- Maintains a caring and supportive tone
- Includes relevant health tips when appropriate
- Always disclaims that this is not a substitute for professional medical advice

Response:`;

      if (generator) {
        try {
          const result = await generator(healthPrompt, {
            max_new_tokens: 200,
            temperature: 0.7,
            top_p: 0.9,
            repetition_penalty: 1.1,
          });
          
          // Extract the generated text
          let response = result[0].generated_text.replace(healthPrompt, '').trim();
          
          // Clean up and enhance the response
          if (response.length < 50) {
            throw new Error('Response too short');
          }
          
          return response;
        } catch (error) {
          console.error('AI generation error:', error);
          // Fall through to intelligent fallback
        }
      }

      // Intelligent fallback responses based on keywords
      return getIntelligentFallbackResponse(userMessage);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      return getIntelligentFallbackResponse(userMessage);
    }
  };

  // Intelligent fallback with contextual responses
  const getIntelligentFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Symptom-based responses
    if (message.includes('fever') || message.includes('temperature')) {
      return `🌡️ **Fever Management**

I understand you're dealing with a fever. Here's what I recommend:

**Immediate Care:**
- Rest and stay hydrated with water and clear fluids
- Take acetaminophen or ibuprofen as directed on the package
- Use cool compresses on your forehead
- Dress lightly and keep your environment cool

**Monitor your symptoms:**
- Normal: 98.6°F (37°C)
- Fever: 100.4°F (38°C) or higher
- Seek medical attention if fever exceeds 103°F (39.4°C)

**When to see a doctor:**
- Fever persists for more than 3 days
- Accompanied by severe headache, stiff neck, or rash
- Difficulty breathing or persistent cough
- Signs of dehydration

Would you like specific advice based on your current temperature?`;
    }
    
    if (message.includes('headache') || message.includes('head pain')) {
      return `🤕 **Headache Relief**

I'm sorry you're experiencing a headache. Let me help you find relief:

**Immediate Relief:**
- Rest in a quiet, dark room
- Apply a cold compress to your forehead or neck
- Stay hydrated - drink plenty of water
- Gently massage your temples and neck
- Take over-the-counter pain relievers (acetaminophen, ibuprofen)

**Common Causes:**
- Tension and stress
- Dehydration
- Lack of sleep
- Eye strain from screens
- Skipping meals

**Prevention Tips:**
- Maintain regular sleep schedule (7-9 hours)
- Stay hydrated throughout the day
- Take breaks from screens
- Manage stress with relaxation techniques

**Seek medical attention if:**
- Sudden, severe headache (worst of your life)
- Headache with fever and stiff neck
- Headache after head injury
- Changes in vision or speech

What type of headache are you experiencing?`;
    }
    
    if (message.includes('stomach') || message.includes('nausea') || message.includes('vomiting')) {
      return `🤢 **Stomach Issues Support**

I understand you're feeling unwell. Here's how to care for stomach problems:

**Immediate Care:**
- Sip small amounts of clear fluids (water, clear broth, flat ginger ale)
- Try the BRAT diet: Bananas, Rice, Applesauce, Toast
- Rest and avoid solid foods if vomiting
- Use over-the-counter medications sparingly

**Stay Hydrated:**
- Take small, frequent sips
- Try ice chips if you can't keep liquids down
- Oral rehydration solutions can help
- Avoid dairy, caffeine, and alcohol

**When to Seek Help:**
- Persistent vomiting for more than 24 hours
- Signs of dehydration (dry mouth, dizziness, no urination)
- Severe abdominal pain
- Blood in vomit or stool
- High fever with stomach symptoms

Most stomach bugs resolve within 2-3 days with proper care. How long have you been experiencing these symptoms?`;
    }
    
    if (message.includes('cough') || message.includes('cold') || message.includes('flu')) {
      return `🤧 **Cold & Flu Care**

I'm here to help you feel better. Here's comprehensive care for respiratory symptoms:

**Symptom Relief:**
- Rest is crucial - your body needs energy to fight infection
- Stay hydrated with water, warm tea, or clear broths
- Use a humidifier or breathe steam from a hot shower
- Honey can soothe throat irritation (not for children under 1 year)
- Saline nasal rinses can clear congestion

**Over-the-Counter Options:**
- Pain relievers for aches and fever
- Cough suppressants for dry coughs
- Expectorants to loosen mucus
- Decongestants for stuffy nose

**Home Remedies:**
- Warm salt water gargles for sore throat
- Chicken soup provides hydration and comfort
- Elevate your head while sleeping
- Get plenty of vitamin C and zinc

**See a Doctor If:**
- Symptoms worsen after a week
- High fever (over 101.3°F)
- Difficulty breathing or chest pain
- Persistent cough with blood
- Severe headache or sinus pain

Are you experiencing any specific cold or flu symptoms I can help address?`;
    }
    
    // Default intelligent response
    return `🤖 **AI Health Assistant**

Thank you for reaching out! I'm here to provide helpful health guidance and support.

**I can help you with:**
- Symptom assessment and care recommendations
- General health questions and wellness tips
- Medication information and safety
- When to seek medical attention
- First aid and emergency guidance
- Chronic condition management support

**Please remember:**
- This is educational information, not medical diagnosis
- Always consult healthcare professionals for serious concerns
- Call emergency services (911) for medical emergencies
- Trust your instincts about your health

**About your question:** "${userMessage}"

To give you the most helpful response, could you provide more details about:
- What specific symptoms you're experiencing
- How long you've had these symptoms
- Any other relevant health information

I'm here to support you with evidence-based health information. What would you like to know more about?`;
  };
  const healthKnowledge = {
    // Emergency conditions with detailed responses
    emergency: {
      keywords: ['emergency', 'urgent', 'severe', 'critical', 'life threatening', 'dying', 'help me', '911'],
      response: (context: string) => {
        return `🚨 **MEDICAL EMERGENCY DETECTED** 🚨

I understand you're experiencing a serious medical situation. Here's what you need to do **immediately**:

**IMMEDIATE ACTIONS:**
1. **Call emergency services NOW** (911, 112, or your local emergency number)
2. **Stay calm** and follow operator instructions
3. **Don't hang up** until help arrives
4. **Use QuickER** to find the nearest emergency room

**WHILE WAITING FOR HELP:**
- Stay in a safe position
- Keep airways clear
- Don't move if you suspect injury
- Have someone stay with you

**I cannot provide emergency medical advice.** This requires immediate professional medical attention. Please call emergency services right now.

*QuickER can help you find the nearest hospital once you're stable.*`
      },
      type: 'emergency' as const,
      followUp: "Are you able to call emergency services? Do you need help finding the nearest hospital?"
    },

    // Cardiovascular issues
    chestPain: {
      keywords: ['chest pain', 'heart pain', 'chest tightness', 'heart attack', 'angina', 'chest pressure', 'heartburn', 'chest discomfort'],
      response: (context: string) => {
        const isSevere = context.includes('severe') || context.includes('crushing') || context.includes('intense');
        const hasOtherSymptoms = context.includes('breath') || context.includes('nausea') || context.includes('sweat');
        
        if (isSevere || hasOtherSymptoms) {
          return `🫀 **CHEST PAIN - POTENTIAL HEART EMERGENCY** 🚨

**This could be a heart attack. Take immediate action:**

**CALL 911 IMMEDIATELY** - Don't wait, don't drive yourself

**SYMPTOMS OF HEART ATTACK:**
- Chest pain or pressure (crushing, squeezing, burning)
- Pain spreading to arm, shoulder, neck, jaw, or back
- Shortness of breath
- Nausea or vomiting
- Cold sweat
- Lightheadedness or fainting

**WHILE WAITING FOR HELP:**
- Sit down and rest
- Take aspirin if available (unless allergic)
- Loosen tight clothing
- Stay calm and breathe slowly

**Use QuickER to find the nearest cardiac center** for immediate treatment.

*Time is critical - every minute counts in a heart attack.*`;
        } else {
          return `🫀 **Chest Pain Assessment**

Chest pain can have many causes. Let me help you understand:

**POSSIBLE CAUSES:**
- Heart-related (angina, heart attack)
- Digestive (acid reflux, GERD)
- Musculoskeletal (muscle strain, costochondritis)
- Respiratory (pneumonia, pleurisy)
- Anxiety or stress

**QUESTIONS TO CONSIDER:**
- How would you describe the pain? (sharp, dull, burning, pressure)
- When did it start?
- Does it worsen with breathing or movement?
- Any other symptoms?

**SEEK IMMEDIATE HELP IF:**
- Pain is severe or crushing
- Pain spreads to arm, neck, or jaw
- You have shortness of breath
- You feel nauseous or sweaty

**For non-emergency chest pain:**
- Rest and monitor symptoms
- Consider over-the-counter antacids if it feels like heartburn
- See a doctor if it persists or worsens

Would you like me to help you assess your specific symptoms?`;
        }
      },
      type: 'emergency' as const,
      followUp: "Can you describe the chest pain in more detail? Is it sharp, dull, or crushing? Any other symptoms?"
    },

    // Respiratory issues
    breathing: {
      keywords: ['can\'t breathe', 'shortness of breath', 'breathing difficulty', 'wheezing', 'asthma attack', 'choking', 'suffocating', 'breathless'],
      response: (context: string) => {
        const isSevere = context.includes('can\'t breathe') || context.includes('choking') || context.includes('suffocating');
        
        if (isSevere) {
          return `🫁 **BREATHING EMERGENCY** 🚨

**This is a medical emergency. Call 911 immediately.**

**IMMEDIATE ACTIONS:**
1. **Call emergency services NOW**
2. **Sit upright** - don't lie down
3. **Stay calm** - panic makes breathing worse
4. **Use QuickER** to find nearest emergency room

**POSSIBLE CAUSES:**
- Asthma attack
- Allergic reaction (anaphylaxis)
- Heart attack
- Pulmonary embolism
- Pneumonia
- Panic attack

**IF YOU HAVE AN INHALER:**
- Use it as prescribed
- Take 2-4 puffs
- Wait 4 minutes, repeat if needed

**SIGNS OF SEVERE BREATHING PROBLEMS:**
- Can't speak in full sentences
- Blue lips or fingernails
- Chest retractions
- Confusion or drowsiness

*Don't delay - breathing problems can become life-threatening quickly.*`;
        } else {
          return `🫁 **Breathing Difficulty Assessment**

Let me help you understand your breathing issues:

**COMMON CAUSES:**
- **Asthma** - wheezing, tight chest, triggered by allergens
- **Anxiety/Panic** - rapid breathing, chest tightness
- **Allergies** - seasonal or environmental triggers
- **Respiratory infections** - cold, flu, COVID-19
- **Heart conditions** - especially with chest pain
- **Anemia** - fatigue with shortness of breath

**ASSESSMENT QUESTIONS:**
- When did this start?
- What were you doing when it began?
- Any known allergies or asthma?
- Recent illness or exposure?
- Any chest pain or pressure?

**HOME CARE (if mild):**
- Sit upright and rest
- Practice slow, deep breathing
- Use inhaler if prescribed
- Avoid triggers (smoke, allergens)
- Stay hydrated

**SEEK MEDICAL HELP IF:**
- Symptoms worsen or persist
- You have chest pain
- Lips or nails turn blue
- You feel confused or dizzy

Can you tell me more about when this breathing difficulty started?`;
        }
      },
      type: 'emergency' as const,
      followUp: "Are you able to speak in full sentences? Any chest pain or other symptoms?"
    },

    // Fever and infections
    fever: {
      keywords: ['fever', 'high temperature', 'hot', 'burning up', 'temperature', 'chills', 'sweating'],
      response: (context: string) => {
        const hasHighFever = context.includes('high') || context.includes('very hot') || context.includes('burning');
        const hasOtherSymptoms = context.includes('rash') || context.includes('stiff') || context.includes('confusion');
        
        return `🌡️ **Fever Management & Assessment**

**CURRENT GUIDELINES:**
- **Normal:** 98.6°F (37°C)
- **Low-grade fever:** 99-100.4°F (37.2-38°C)
- **Fever:** 100.4-103°F (38-39.4°C)
- **High fever:** Over 103°F (39.4°C)

**IMMEDIATE CARE:**
1. **Rest** - your body needs energy to fight infection
2. **Stay hydrated** - drink water, clear fluids, or electrolyte solutions
3. **Dress lightly** - don't over-bundle
4. **Cool compresses** - on forehead, neck, and armpits
5. **Fever reducers** - acetaminophen or ibuprofen (follow dosing instructions)

**WHEN TO SEEK MEDICAL HELP:**
- Fever over 103°F (39.4°C)
- Fever lasting more than 3 days
- Fever with rash, stiff neck, or confusion
- Difficulty breathing or chest pain
- Severe headache or neck stiffness
- Signs of dehydration (dry mouth, no urination)

**RED FLAGS - SEEK IMMEDIATE HELP:**
- Fever with rash that doesn't fade when pressed
- Stiff neck with fever
- Confusion or difficulty waking up
- Severe headache with fever
- Difficulty breathing

**HOME MONITORING:**
- Check temperature every 4-6 hours
- Monitor for new symptoms
- Ensure adequate fluid intake
- Get plenty of rest

What's your current temperature, and are you experiencing any other symptoms?`;
      },
      type: 'general' as const,
      followUp: "What's your temperature reading? Any other symptoms like rash, headache, or body aches?"
    },

    // Headaches and neurological
    headache: {
      keywords: ['headache', 'head pain', 'migraine', 'head ache', 'head pounding', 'tension headache'],
      response: (context: string) => {
        const isSevere = context.includes('severe') || context.includes('worst') || context.includes('unbearable');
        const hasOtherSymptoms = context.includes('fever') || context.includes('stiff') || context.includes('vision');
        
        if (isSevere || hasOtherSymptoms) {
          return `🤕 **SEVERE HEADACHE - MEDICAL ATTENTION NEEDED**

**This could be serious. Seek medical help if:**
- Sudden, severe headache (worst of your life)
- Headache with fever and stiff neck
- Headache after head injury
- Headache with vision changes, confusion, or weakness
- Headache with nausea and vomiting

**POSSIBLE SERIOUS CAUSES:**
- Meningitis (fever + stiff neck)
- Stroke (sudden onset + neurological symptoms)
- Brain aneurysm (sudden severe pain)
- Concussion (after head injury)
- High blood pressure crisis

**IMMEDIATE ACTIONS:**
- Call emergency services if severe
- Use QuickER to find nearest hospital
- Don't drive yourself
- Stay with someone if possible

**For severe headaches, don't wait - seek medical attention immediately.**`;
        } else {
          return `🤕 **Headache Relief & Management**

**TYPES OF HEADACHES:**
- **Tension:** Dull, pressure-like pain, both sides
- **Migraine:** Throbbing, often one side, with nausea/sensitivity
- **Cluster:** Severe, one-sided, around eye
- **Sinus:** Pressure around eyes/cheeks, worse when bending

**IMMEDIATE RELIEF:**
1. **Rest** in a quiet, dark room
2. **Cold compress** on forehead or neck
3. **Stay hydrated** - dehydration causes headaches
4. **Gentle massage** of temples and neck
5. **Over-the-counter pain relievers** (acetaminophen, ibuprofen, aspirin)

**LIFESTYLE FACTORS:**
- **Sleep:** 7-9 hours consistently
- **Hydration:** 8 glasses of water daily
- **Stress management:** Deep breathing, meditation
- **Regular meals:** Don't skip meals
- **Limit caffeine:** Too much or withdrawal causes headaches

**TRIGGERS TO AVOID:**
- Bright lights and loud noises
- Strong smells
- Certain foods (chocolate, cheese, processed meats)
- Weather changes
- Poor posture

**SEEK MEDICAL HELP IF:**
- Headaches are frequent or severe
- Over-the-counter meds don't help
- Headaches interfere with daily life
- New headache pattern after age 50

What type of headache are you experiencing, and what seems to trigger it?`;
        }
      },
      type: 'general' as const,
      followUp: "Can you describe the headache - is it throbbing, pressure, or sharp? Any triggers you've noticed?"
    },

    // Digestive issues
    stomach: {
      keywords: ['stomach pain', 'stomach ache', 'nausea', 'vomiting', 'diarrhea', 'stomach bug', 'food poisoning', 'indigestion', 'bloating'],
      response: (context: string) => {
        const hasSevereSymptoms = context.includes('severe') || context.includes('blood') || context.includes('dehydration');
        
        if (hasSevereSymptoms) {
          return `🤢 **SEVERE STOMACH ISSUES - MEDICAL ATTENTION NEEDED**

**Seek immediate medical help if:**
- Severe abdominal pain
- Blood in vomit or stool
- Signs of dehydration (dry mouth, no urination, dizziness)
- High fever with stomach symptoms
- Severe pain that doesn't improve

**SIGNS OF DEHYDRATION:**
- Dry mouth and throat
- Dark urine or no urination
- Dizziness or lightheadedness
- Rapid heartbeat
- Sunken eyes

**IMMEDIATE CARE:**
- Sip small amounts of clear fluids
- Use QuickER to find nearest urgent care
- Don't eat solid foods if vomiting
- Rest and stay warm

**For severe symptoms, don't wait - seek medical attention.**`;
        } else {
          return `🤢 **Stomach Issues - Home Care Guide**

**COMMON CAUSES:**
- **Viral gastroenteritis** (stomach flu)
- **Food poisoning** (bacteria, toxins)
- **Indigestion** (overeating, spicy foods)
- **Stress or anxiety**
- **Medication side effects**
- **Food intolerances**

**HOME TREATMENT:**
1. **Stay hydrated** - small sips of water, clear fluids, or electrolyte solutions
2. **BRAT diet** - Bananas, Rice, Applesauce, Toast (bland foods)
3. **Avoid** - dairy, spicy, fatty, or fried foods
4. **Rest** - your digestive system needs time to recover
5. **Over-the-counter** - anti-nausea or anti-diarrheal medications as directed

**HYDRATION TIPS:**
- Sip small amounts frequently
- Try ice chips if you can't keep liquids down
- Oral rehydration solutions (Pedialyte, Gatorade)
- Avoid alcohol and caffeine

**WHEN TO SEE A DOCTOR:**
- Symptoms last more than 48 hours
- High fever (over 101°F)
- Severe dehydration
- Blood in vomit or stool
- Severe abdominal pain

**PREVENTION:**
- Wash hands frequently
- Cook food thoroughly
- Avoid contaminated water
- Don't share utensils or drinks

What specific stomach symptoms are you experiencing?`;
        }
      },
      type: 'general' as const,
      followUp: "Are you able to keep fluids down? Any fever or other symptoms?"
    },

    // Medication and drug information
    medication: {
      keywords: ['medication', 'medicine', 'drug', 'pill', 'prescription', 'side effects', 'dosage', 'interaction'],
      response: (context: string) => {
        return `💊 **Medication Safety & Information**

**GENERAL MEDICATION GUIDELINES:**
- **Read labels carefully** - dosage, timing, warnings
- **Follow instructions exactly** - don't skip doses or double up
- **Check expiration dates** - don't use expired medications
- **Store properly** - cool, dry place, away from children
- **Know your medications** - keep a list with names and dosages

**COMMON MEDICATION CATEGORIES:**
- **Pain relievers:** Acetaminophen, ibuprofen, aspirin
- **Antibiotics:** Complete full course as prescribed
- **Blood pressure:** Take at same time daily
- **Diabetes:** Monitor blood sugar with medications
- **Mental health:** Don't stop abruptly, consult doctor

**SIDE EFFECTS TO WATCH:**
- Allergic reactions (rash, swelling, difficulty breathing)
- Severe nausea or vomiting
- Dizziness or confusion
- Unusual bleeding or bruising
- Changes in mood or behavior

**DRUG INTERACTIONS:**
- Always inform doctors of ALL medications
- Check with pharmacist about new medications
- Be cautious with alcohol and medications
- Some foods can affect medication absorption

**WHEN TO CALL YOUR DOCTOR:**
- Severe side effects
- Medication not working as expected
- Questions about dosage or timing
- Planning to stop or change medications

**EMERGENCY SITUATIONS:**
- Allergic reaction (call 911)
- Overdose (call poison control: 1-800-222-1222)
- Severe side effects

What specific medication questions do you have?`;
      },
      type: 'medication' as const,
      followUp: "What medication are you asking about? Are you experiencing any side effects?"
    },

    // General health and wellness
    general: {
      keywords: ['hello', 'hi', 'help', 'health', 'sick', 'not feeling well', 'general', 'wellness'],
      response: (context: string) => {
        return `👋 **Welcome to Your AI Health Assistant** 🤖

I'm here to provide comprehensive health guidance and support! I can help with:

**🩺 HEALTH ASSESSMENT:**
- Symptom analysis and guidance
- When to seek medical attention
- First aid and emergency response
- Chronic condition management

**💊 MEDICATION SUPPORT:**
- Drug information and interactions
- Dosage and timing questions
- Side effect monitoring
- Prescription guidance

**🏥 HEALTHCARE NAVIGATION:**
- Finding appropriate care
- Understanding medical procedures
- Preparing for doctor visits
- Healthcare decision support

**🌡️ COMMON CONDITIONS:**
- Colds, flu, and infections
- Digestive issues
- Headaches and migraines
- Skin problems
- Mental health support

**🚨 EMERGENCY GUIDANCE:**
- Recognizing medical emergencies
- First aid instructions
- When to call 911
- Hospital location services

**💡 WELLNESS TIPS:**
- Preventive care
- Healthy lifestyle choices
- Stress management
- Nutrition guidance

**How can I help you today?** Feel free to describe your symptoms, ask about medications, or discuss any health concerns. I'm here to provide accurate, helpful information while always encouraging professional medical care when needed.

*Remember: I provide general health information only. For medical emergencies, call emergency services immediately.*`;
      },
      type: 'general' as const,
      followUp: "What health concern would you like to discuss? I'm here to help with any questions you have."
    }
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for emergency keywords first
    for (const [key, knowledge] of Object.entries(healthKnowledge)) {
      if (knowledge.keywords.some(keyword => message.includes(keyword))) {
        return knowledge.response(userMessage);
      }
    }
    
    // Default intelligent response
    return `I understand you're not feeling well. Let me help you get the right guidance.

**To provide the best assistance, could you tell me:**
- What specific symptoms are you experiencing?
- When did they start?
- How severe would you rate them (1-10)?
- Any other symptoms you've noticed?

**I can help with:**
- Symptom assessment and guidance
- When to seek medical attention
- Home care recommendations
- Emergency situation recognition
- Medication questions
- Finding appropriate healthcare

**For immediate emergencies:**
- Call 911 if you're experiencing severe symptoms
- Use QuickER to find the nearest hospital
- Don't delay seeking professional help

What would you like to discuss? I'm here to provide comprehensive health guidance while always encouraging professional medical care when needed.`;
  };

  const getMessageType = (userMessage: string): Message['type'] => {
    const message = userMessage.toLowerCase();
    
    for (const [key, knowledge] of Object.entries(healthKnowledge)) {
      if (knowledge.keywords.some(keyword => message.includes(keyword))) {
        return knowledge.type;
      }
    }
    
    return 'general';
  };

  const getFollowUpQuestion = (userMessage: string): string | null => {
    const message = userMessage.toLowerCase();
    
    for (const [key, knowledge] of Object.entries(healthKnowledge)) {
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
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(currentInput);
      const messageType = getMessageType(currentInput);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question. For medical emergencies, please call 911 immediately.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
    { text: "I have chest pain", icon: Heart, category: "emergency" },
    { text: "I can't breathe properly", icon: AlertTriangle, category: "emergency" },
    { text: "I have a fever", icon: Stethoscope, category: "general" },
    { text: "I have a headache", icon: Bot, category: "general" },
    { text: "Stomach pain and nausea", icon: Stethoscope, category: "general" },
    { text: "Medication questions", icon: Pill, category: "medication" },
    { text: "Find nearest hospital", icon: Phone, category: "emergency" },
    { text: "General health advice", icon: Bot, category: "general" }
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
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Quick actions:</p>
              <div className="space-y-2">
                {/* Emergency Actions */}
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">🚨 Emergency</p>
                  <div className="flex flex-wrap gap-1">
                    {quickActions.filter(a => a.category === 'emergency').map((action, index) => (
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
                
                {/* General Health */}
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1">🩺 General Health</p>
                  <div className="flex flex-wrap gap-1">
                    {quickActions.filter(a => a.category === 'general').map((action, index) => (
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
                
                {/* Medication */}
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">💊 Medication</p>
                  <div className="flex flex-wrap gap-1">
                    {quickActions.filter(a => a.category === 'medication').map((action, index) => (
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
        {isLoading && (
          <div className="flex items-center justify-center p-4 mb-4">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading AI model...</span>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your health concerns... (powered by AI)"
            className="flex-1"
            disabled={isTyping || isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping || isLoading}
            size="icon"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          For medical emergencies, call emergency services immediately. This AI assistant provides educational information only.
        </div>
      </div>
    </div>
  );
};

export default HealthChatbot;
