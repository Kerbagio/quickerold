import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin, Shield, Globe, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const slides = [
    {
      icon: MapPin,
      title: t('onboarding.slide1.title'),
      description: t('onboarding.slide1.desc'),
      gradient: "bg-gradient-to-br from-primary/10 to-accent/10"
    },
    {
      icon: Shield,
      title: t('onboarding.slide2.title'),
      description: t('onboarding.slide2.desc'),
      gradient: "bg-gradient-to-br from-success/10 to-primary/10"
    },
    {
      icon: Globe,
      title: t('onboarding.slide3.title'),
      description: t('onboarding.slide3.desc'),
      gradient: "bg-gradient-to-br from-accent/10 to-success/10"
    },
    {
      icon: MapPin,
      title: t('onboarding.slide4.title'),
      description: t('onboarding.slide4.desc'),
      gradient: "bg-gradient-to-br from-primary/10 to-warning/10"
    },
    {
      icon: Globe,
      title: t('onboarding.slide5.title'),
      description: t('onboarding.slide5.desc'),
      gradient: "bg-gradient-to-br from-accent/10 to-primary/10"
    }
  ];

  const enableLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      setLocationEnabled(true);
      toast({
        title: "Location enabled",
        description: "You're all set! Location access has been granted."
      });
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "You can still explore the app with the clearly labelled Beirut demo point.",
        variant: "destructive"
      });
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboardingDone', 'true');
    localStorage.setItem('preferredLanguage', language);
    navigate('/home');
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card className={`p-8 text-center ${currentSlideData.gradient} border-2`}>
          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full mx-1 transition-colors ${
                  index === currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Slide Content */}
          <div className="mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mx-auto mb-6">
              <currentSlideData.icon className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {currentSlideData.title}
            </h1>
            
            <p className="text-muted-foreground leading-relaxed">
              {currentSlideData.description}
            </p>
          </div>

          {/* Controls for Location Slide */}
          {currentSlide === 3 && (
            <div className="mb-8">
              <Button 
                onClick={enableLocation}
                variant={locationEnabled ? "success" : "default"}
                size="lg"
                className="w-full"
                disabled={locationEnabled}
              >
                <MapPin className="w-5 h-5 mr-2" />
                {locationEnabled ? t('onboarding.locationEnabled') : t('onboarding.enableLocation')}
              </Button>
            </div>
          )}

          {/* Controls for Language Slide */}
          {currentSlide === 4 && (
            <div className="mb-8 space-y-4">
              <div className="text-center mb-6">
                <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                <span className="font-medium text-lg">{t('onboarding.selectLanguage')}</span>
              </div>
              
              <div className="space-y-3">
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  size="lg"
                  className="w-full justify-start"
                  onClick={() => setLanguage("en")}
                >
                  🇺🇸 English
                </Button>
                
                <Button
                  variant={language === "ar" ? "default" : "outline"}
                  size="lg"
                  className="w-full justify-start"
                  onClick={() => setLanguage("ar")}
                >
                  🇸🇦 العربية
                </Button>
                
                <Button
                  variant={language === "fr" ? "default" : "outline"}
                  size="lg"
                  className="w-full justify-start"
                  onClick={() => setLanguage("fr")}
                >
                  🇫🇷 Français
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="opacity-50 disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('onboarding.back')}
            </Button>

            {currentSlide < slides.length - 1 ? (
              <Button onClick={nextSlide}>
                {t('onboarding.next')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={completeOnboarding} variant="emergency">
                {t('onboarding.getStarted')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </Card>

        {/* Legal Notice */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>
            {t('onboarding.privacyNotice')}
          </p>
          <p className="mt-2">
            <strong>{t('onboarding.disclaimer')}</strong> {t('onboarding.medicalDisclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
