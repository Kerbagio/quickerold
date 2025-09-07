import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Navigation, Shield, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import Map, { MapRef } from "@/components/Map";
import { useToast } from "@/hooks/use-toast";
import { useHospitals, Hospital } from "@/hooks/useHospitals";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { toast } = useToast();
  const { hospitals, loading, error, fetchHospitals, bestOption } = useHospitals();
  const { t, language } = useLanguage();
  const mapRef = useRef<MapRef>(null);

  const requestLocation = () => {
    console.log('Requesting location...');
    if (!navigator.geolocation) {
      toast({
        title: t('error.permissionDenied'),
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location obtained:', latitude, longitude);
        setUserLocation({ lat: latitude, lng: longitude });
        setPermissionDenied(false);
        
        // Fetch hospitals using the hook
        console.log('Fetching hospitals...');
        fetchHospitals(latitude, longitude, { 
          radius: 8, 
          emergencyType: localStorage.getItem('defaultEmergencyType') || 'general' 
        });
      },
      (error) => {
        console.error('Location error:', error);
        setPermissionDenied(true);
        toast({
          title: t('error.permissionDenied'),
          description: t('error.permissionDenied'),
          variant: "destructive"
        });
      }
    );
  };

  const onLocationSelect = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
  };

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 space-y-8 ${language === 'ar' ? 'rtl' : ''}`}>
        {/* Hero Card */}
        <Card className="p-8 text-center bg-hero-gradient border-2">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              {t('btn.emergency')}
            </div>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('hero.title')}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          
          {!userLocation && !loading && (
            <Button 
              size="lg" 
              onClick={requestLocation}
              className="text-lg px-8 py-6 shadow-emergency"
              disabled={loading}
            >
              <MapPin className="w-5 h-5 mr-2" />
              {t('btn.shareLocation')}
            </Button>
          )}
          
          {loading && (
            <div className="flex items-center justify-center text-muted-foreground">
              <Clock className="w-5 h-5 mr-2 animate-spin" />
              {t('hero.loading')}
            </div>
          )}
          
          {permissionDenied && (
            <div className="flex items-center justify-center text-destructive bg-destructive/10 p-4 rounded-xl">
              <AlertCircle className="w-5 h-5 mr-2" />
              {t('error.permissionDenied')}
            </div>
          )}
        </Card>

        {/* Map Section */}
        {userLocation && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Status: {hospitals.length} hospitals found | {loading ? 'Loading...' : 'Successful'}
            </div>
            <Map 
              ref={mapRef}
              className="h-64 lg:h-80"
              hospitals={hospitals}
              onLocationSelect={onLocationSelect}
            />
          </>
        )}

        {/* Best Option Card */}
        {bestOption && (
          <Card className="p-6 border-2 border-primary/20 bg-primary/5">
            <div className={`flex items-center justify-between mb-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Badge variant="secondary" className="bg-success text-success-foreground">
                {t('hero.bestOption')}
              </Badge>
              <div className="flex gap-2">
                <Badge variant="outline">{t('metrics.eta')} {bestOption.eta}</Badge>
                <Badge variant="outline">{bestOption.distance}</Badge>
                <Badge variant="outline" className="text-success">{t('metrics.lowTraffic')}</Badge>
              </div>
            </div>
            
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-xl font-semibold mb-2">{bestOption.name}</h3>
                {bestOption.specialty && (
                  <Badge variant="secondary">{bestOption.specialty}</Badge>
                )}
              </div>
              
              <Button 
                size="lg" 
                className="shadow-emergency"
                onClick={() => {
                  if (mapRef.current && bestOption) {
                    mapRef.current.showRoutes(bestOption.lat, bestOption.lng, bestOption.name);
                  }
                }}
              >
                <Navigation className="w-5 h-5 mr-2" />
                {t('hero.startNavigation')}
              </Button>
            </div>
          </Card>
        )}

        {/* Hospital List */}
        {hospitals.length > 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Other nearby options</h2>
            <div className="space-y-4">
              {hospitals.slice(1).map((hospital) => (
                <div 
                  key={hospital.id}
                  className={`flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{hospital.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{hospital.distance}</span>
                      {hospital.specialty && (
                        <Badge variant="outline" className="text-xs">
                          {hospital.specialty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className={`text-right ${language === 'ar' ? 'text-left' : ''}`}>
                    <div className="text-2xl font-bold text-primary">
                      {hospital.eta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {userLocation && hospitals.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('hero.noHospitals')}</h3>
            <p className="text-muted-foreground">
              {t('hero.noHospitals')}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Index;
