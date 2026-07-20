import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Globe, ChevronRight, ChevronLeft, Route, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePageMemory } from "@/hooks/usePageMemory";
import { useLanguage } from "@/contexts/LanguageContext";
import BrandLogo from "@/components/BrandLogo";

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = usePageMemory(
    "onboarding.currentSlide",
    0,
  );
  const [locationEnabled, setLocationEnabled] = usePageMemory(
    "onboarding.locationEnabled",
    false,
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const slides = [
    {
      icon: Route,
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
    <main
      className={`relative flex min-h-screen-dvh items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6 ${
        language === "ar" ? "rtl" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-4 px-1">
          <BrandLogo className="h-10" />
          <Badge variant="outline" className="border-primary/25 bg-background/80 text-primary">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Free-first
          </Badge>
        </div>
        <Card className={`overflow-hidden border p-0 text-center shadow-strong ${currentSlideData.gradient}`}>
          <div className="border-b bg-background/75 px-6 py-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>QuickER setup</span>
              <span>{currentSlide + 1} / {slides.length}</span>
            </div>
          {/* Progress Indicator */}
          <div className="flex gap-2" aria-label={`Step ${currentSlide + 1} of ${slides.length}`}>
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          </div>

          {/* Slide Content */}
          <div className="px-6 py-9 sm:px-9">
            <div className="mb-7">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-background/80 shadow-soft">
              <currentSlideData.icon className="h-9 w-9 text-primary" />
            </div>
            
            <h1 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              {currentSlideData.title}
            </h1>
            
            <p className="mx-auto max-w-md leading-relaxed text-muted-foreground">
              {currentSlideData.description}
            </p>
          </div>

          {/* Controls for Location Slide */}
          {currentSlide === 3 && (
            <div className="mb-8 rounded-2xl border bg-background/70 p-4">
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
            <div className="mb-8 space-y-4 rounded-2xl border bg-background/70 p-4">
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
          <div className="flex items-center justify-between border-t border-border/60 pt-5">
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
          </div>
        </Card>

        {/* Legal Notice */}
        <div className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          <p>
            {t('onboarding.privacyNotice')}
          </p>
          <p className="mt-2">
            <strong>{t('onboarding.disclaimer')}</strong> {t('onboarding.medicalDisclaimer')}
          </p>
        </div>
      </div>
    </main>
  );
};

export default Onboarding;
