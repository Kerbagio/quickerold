import { Button } from "@/components/ui/button";
import { MapPin, Clock, Shield } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-hero-gradient py-20 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Trusted Emergency Routing
            </div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Get to the right hospital,{" "}
            <span className="text-primary">faster</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Because in emergencies, minutes matter. Find the nearest emergency care facility 
            with real-time routing, wait times, and specialized services.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-6 shadow-emergency">
              <MapPin className="w-5 h-5 mr-2" />
              Find Emergency Care
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Clock className="w-5 h-5 mr-2" />
              Check Wait Times
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">&lt;2min</div>
              <div className="text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Partner Hospitals</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;