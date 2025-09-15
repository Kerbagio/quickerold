import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, MapPin, Clock, Heart, ExternalLink, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t, language } = useLanguage();
  const apiCredits = [
    { name: "Mapbox", description: "Map tiles and routing services", url: "https://mapbox.com" },
    { name: "OpenStreetMap", description: "Geographic data", url: "https://openstreetmap.org" },
    { name: "Real-time Traffic APIs", description: "Live traffic and ETA calculations", url: "#" }
  ];

  const emergencyNumbers = [
    { country: "United States", number: "911", description: "Police, Fire, Medical" },
    { country: "United Kingdom", number: "999", description: "Emergency Services" },
    { country: "European Union", number: "112", description: "Emergency Services" },
    { country: "Canada", number: "911", description: "Emergency Services" },
    { country: "Australia", number: "000", description: "Emergency Services" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link to="/home" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('about.backToHome')}
              </Link>
            </Button>
            <img 
              src="/logo-quicker.svg" 
              alt="QuickER Logo" 
              className="h-8 w-auto"
            />
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {t('about.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t('about.heroTitle')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('about.heroSubtitle')}
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* What We Do */}
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <MapPin className="w-6 h-6 mr-3 text-primary" />
              <h2 className="text-2xl font-bold">{t('about.whatWeDo')}</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-lg leading-relaxed mb-6">
                <strong>{t('about.whatWeDoDesc1')}</strong>
              </p>
              <p className="text-muted-foreground mb-6">
                {t('about.whatWeDoDesc2')}
              </p>
              <p className="text-muted-foreground">
                {t('about.whatWeDoDesc3')}
              </p>
            </div>
          </Card>

          {/* Important Disclaimer */}
          <Card className="p-8 border-2 border-destructive/20 bg-destructive/5">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 mr-3 text-destructive" />
              <h2 className="text-2xl font-bold text-destructive">{t('about.disclaimer')}</h2>
            </div>
            <div className="space-y-4 text-lg">
              <p className="font-semibold">
                {t('about.disclaimerTitle')}
              </p>
              <p className="text-muted-foreground">
                {t('about.disclaimerDesc')}
              </p>
            </div>
          </Card>

          {/* Emergency Numbers */}
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <Phone className="w-6 h-6 mr-3 text-primary" />
              <h2 className="text-2xl font-bold">{t('about.emergencyNumbers')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyNumbers.map((emergency) => (
                <div key={emergency.country} className="p-4 border border-border rounded-xl">
                  <div className="font-semibold text-lg">{t(`emergency.countries.${emergency.country.toLowerCase().replace(/\s+/g, '').substring(0,2)}`) || emergency.country}</div>
                  <div className="text-2xl font-bold text-primary my-2">{emergency.number}</div>
                  <div className="text-sm text-muted-foreground">{t(`emergency.services.${emergency.description.includes('Police') ? 'police' : 'general'}`) || emergency.description}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* How It Works */}
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 mr-3 text-primary" />
              <h2 className="text-2xl font-bold">{t('about.howItWorks')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('about.step1Title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about.step1Desc')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('about.step2Title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about.step2Desc')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('about.step3Title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about.step3Desc')}
                </p>
              </div>
            </div>
          </Card>

          {/* API Credits */}
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <ExternalLink className="w-6 h-6 mr-3 text-primary" />
              <h2 className="text-2xl font-bold">{t('about.techPartners')}</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              {t('about.techPartnersDesc')}
            </p>
            <div className="space-y-4">
              {apiCredits.map((credit) => (
                <div key={credit.name} className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <div className="font-semibold">{credit.name}</div>
                    <div className="text-sm text-muted-foreground">{credit.description}</div>
                  </div>
                  {credit.url !== "#" && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={credit.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Contact & Support */}
          <Card className="p-8 text-center bg-hero-gradient">
            <h2 className="text-2xl font-bold mb-4">{t('about.questionsTitle')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('about.questionsDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/settings">
                  {t('about.viewSettings')}
                </Link>
              </Button>
              <Button asChild>
                <a href="mailto:support@quicker.app">
                  {t('about.contactSupport')}
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;