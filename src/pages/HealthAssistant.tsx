import Layout from "@/components/Layout";
import HealthChatbot from "@/components/HealthChatbot";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Heart, AlertTriangle, Stethoscope, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HealthAssistant = () => {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: AlertTriangle,
      title: "Emergency Guidance",
      description: "Get immediate help for urgent medical situations",
      color: "text-red-500"
    },
    {
      icon: Stethoscope,
      title: "Symptom Checker",
      description: "Understand your symptoms and when to seek help",
      color: "text-blue-500"
    },
    {
      icon: Heart,
      title: "Health Advice",
      description: "General health information and wellness tips",
      color: "text-green-500"
    },
    {
      icon: Phone,
      title: "Hospital Finder",
      description: "Quick access to find nearby medical facilities",
      color: "text-purple-500"
    }
  ];

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 space-y-8 ${language === 'ar' ? 'rtl' : ''}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Health Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant health guidance and answers to your medical questions. 
            Our AI assistant can help with symptoms, emergencies, and general health advice.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Important Notice */}
        <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Important Medical Disclaimer
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                This health assistant provides general information only and is not a substitute for professional medical advice, diagnosis, or treatment. 
                Always seek the advice of qualified health providers with questions about medical conditions.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  Not for emergencies
                </Badge>
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  General guidance only
                </Badge>
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  Consult professionals
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Chatbot Interface */}
        <Card className="h-[600px] overflow-hidden">
          <HealthChatbot />
        </Card>

        {/* Emergency Contact Info */}
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-6 h-6 text-red-600" />
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              Emergency Contacts
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong className="text-red-800 dark:text-red-200">United States</strong>
              <p className="text-red-700 dark:text-red-300">911</p>
            </div>
            <div>
              <strong className="text-red-800 dark:text-red-200">United Kingdom</strong>
              <p className="text-red-700 dark:text-red-300">999 or 112</p>
            </div>
            <div>
              <strong className="text-red-800 dark:text-red-200">European Union</strong>
              <p className="text-red-700 dark:text-red-300">112</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default HealthAssistant;
