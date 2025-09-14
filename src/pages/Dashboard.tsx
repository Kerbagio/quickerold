import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Clock, MapPin, TrendingUp, Download, FileText, Users } from "lucide-react";
import Layout from "@/components/Layout";
import Map, { MapRef } from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHospitals, Hospital } from "@/hooks/useHospitals";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { hospitals, loading, error, fetchHospitals } = useHospitals();
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const mapRef = useRef<MapRef>(null);

  // Get user's location for dashboard
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          // Fetch hospitals for the dashboard map
          fetchHospitals(latitude, longitude, { radius: 15, emergencyType: 'general' });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  }, [fetchHospitals]);

  // Load user analytics from localStorage
  useEffect(() => {
    const savedAnalytics = localStorage.getItem('userAnalytics');
    if (savedAnalytics) {
      setUserAnalytics(JSON.parse(savedAnalytics));
    }
  }, []);

  // Calculate user-specific KPIs
  const calculateKPIs = () => {
    if (!hospitals.length) return {
      citywideAverage: "Loading...",
      peakHour: "Loading...",
      bestHour: "Loading...",
      totalHospitals: 0,
      avgDistance: "0 km"
    };

    const avgEta = Math.round(
      hospitals.reduce((sum, h) => {
        const eta = parseInt(h.eta?.replace(' min', '') || '0');
        return sum + eta;
      }, 0) / hospitals.length
    );

    const avgDistance = (
      hospitals.reduce((sum, h) => {
        const dist = parseFloat(h.distance?.replace(' km', '') || '0');
        return sum + dist;
      }, 0) / hospitals.length
    ).toFixed(1);

    return {
      citywideAverage: `${avgEta} ${t('dashboard.minutes')}`,
      peakHour: "5:00 PM", // This could be calculated from user's search history
      bestHour: "3:00 AM",
      totalHospitals: hospitals.length,
      avgDistance: `${avgDistance} km`
    };
  };

  const kpiData = calculateKPIs();

  // Generate user-specific areas based on actual hospital data
  const generateUserAreas = () => {
    if (!hospitals.length) return [];
    
    return hospitals.slice(0, 5).map((hospital, index) => {
      const eta = parseInt(hospital.eta?.replace(' min', '') || '0');
      const change = Math.random() > 0.5 ? '+' : '-';
      const changeValue = Math.floor(Math.random() * 3) + 1;
      
      return {
        area: hospital.name,
        avgEta: `${eta} ${t('dashboard.minutes')}`,
        change: `${change}${changeValue} ${t('dashboard.minutes')}`,
        distance: hospital.distance || '0 km',
        specialty: hospital.specialty || 'General'
      };
    });
  };

  const userAreas = generateUserAreas();

  // CSV Export functionality
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast({
        title: "No data to export",
        description: "Please ensure hospitals are loaded first.",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Data exported",
      description: `${filename} has been downloaded successfully.`,
    });
  };

  const exportHospitalData = () => {
    const hospitalData = hospitals.map(h => ({
      Name: h.name,
      Distance: h.distance,
      ETA: h.eta,
      Specialty: h.specialty,
      Latitude: h.lat,
      Longitude: h.lng
    }));
    exportToCSV(hospitalData, `hospitals_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportAnalyticsData = () => {
    const analyticsData = [
      {
        Metric: 'Total Hospitals Found',
        Value: hospitals.length,
        Timestamp: new Date().toISOString()
      },
      {
        Metric: 'Average ETA',
        Value: kpiData.citywideAverage,
        Timestamp: new Date().toISOString()
      },
      {
        Metric: 'Average Distance',
        Value: kpiData.avgDistance,
        Timestamp: new Date().toISOString()
      }
    ];
    exportToCSV(analyticsData, `analytics_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generateSampleData = () => {
    const sampleAnalytics = {
      totalSearches: Math.floor(Math.random() * 50) + 10,
      avgResponseTime: Math.floor(Math.random() * 5) + 2,
      lastSearch: new Date().toISOString(),
      favoriteEmergencyType: 'general'
    };
    
    setUserAnalytics(sampleAnalytics);
    localStorage.setItem('userAnalytics', JSON.stringify(sampleAnalytics));
    
    toast({
      title: "Sample data generated",
      description: "Dashboard now shows sample analytics data.",
    });
  };

  return (
    <Layout>
      <div className={`container mx-auto px-6 py-8 space-y-8 ${language === 'ar' ? 'rtl' : ''}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('dashboard.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">
              {kpiData.citywideAverage}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('dashboard.avgETA')}
            </div>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-xl mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {kpiData.totalHospitals}
            </div>
            <div className="text-sm text-muted-foreground">
              Nearby Hospitals
            </div>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-xl mx-auto mb-4">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500 mb-2">
              {kpiData.avgDistance}
            </div>
            <div className="text-sm text-muted-foreground">
              Avg Distance
            </div>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-xl mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {userAnalytics?.totalSearches || '0'}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Searches
            </div>
          </Card>
        </div>

        {/* Chart Placeholder */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {t('dashboard.avgETAByHour')} {t('dashboard.hour')}
            </h2>
            <Badge variant="outline">{t('dashboard.last7Days')}</Badge>
          </div>
          <div className="h-64 bg-muted/30 rounded-xl flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">{t('dashboard.noData')}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={generateSampleData}
              >
                {t('dashboard.generateSample')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Interactive Map with Hospitals */}
        <Card className="p-6">
          <div className={`flex items-center justify-between mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-semibold">
              {t('dashboard.neighborhoodTimes')}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportHospitalData}>
                <Download className="w-4 h-4 mr-2" />
                Export Hospitals
              </Button>
              <Button variant="outline" size="sm" onClick={exportAnalyticsData}>
                <FileText className="w-4 h-4 mr-2" />
                Export Analytics
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="h-80 bg-muted/30 rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p className="text-sm">Loading hospitals...</p>
              </div>
            </div>
          ) : hospitals.length > 0 ? (
            <Map 
              ref={mapRef}
              className="h-80" 
              hospitals={hospitals}
              showUserLocation={true}
              showIsochrones={true}
            />
          ) : (
            <div className="h-80 bg-muted/30 rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No hospitals found. Enable location access to see nearby hospitals.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords;
                          setUserLocation({ lat: latitude, lng: longitude });
                          fetchHospitals(latitude, longitude, { radius: 15, emergencyType: 'general' });
                        }
                      );
                    }
                  }}
                >
                  Enable Location
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* User-Specific Hospital Data */}
        <Card className="p-6">
          <div className={`flex items-center justify-between mb-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-semibold">
              Nearby Hospitals Analysis
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generateSampleData}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Sample Data
              </Button>
              <Button variant="outline" size="sm" onClick={exportHospitalData}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          
          {userAreas.length > 0 ? (
            <div className="space-y-4">
              {userAreas.map((area, index) => (
                <div 
                  key={area.area}
                  className={`flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-semibold mr-4">
                      🏥
                    </div>
                    <div>
                      <div className="font-semibold">{area.area}</div>
                      <div className="text-sm text-muted-foreground">
                        {area.specialty} • {area.distance}
                      </div>
                    </div>
                  </div>
                  <div className={`text-right ${language === 'ar' ? 'text-left' : ''}`}>
                    <div className="text-lg font-bold text-primary">{area.avgEta}</div>
                    <Badge 
                      variant="outline" 
                      className={
                        area.change.startsWith('+') ? 'text-destructive border-destructive' :
                        area.change.startsWith('-') ? 'text-success border-success' :
                        'text-muted-foreground'
                      }
                    >
                      {area.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No hospital data available. Enable location access to see nearby hospitals.</p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;