import { Card } from "@/components/ui/card";
import { MapPin, Clock, Route, Phone, Heart, Shield } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Real-Time Location",
      description: "Instantly locate the nearest emergency facilities based on your current position and traffic conditions."
    },
    {
      icon: Clock,
      title: "Live Wait Times",
      description: "See current wait times and capacity status to choose the most efficient care option."
    },
    {
      icon: Route,
      title: "Optimized Routing",
      description: "Get the fastest route with real-time traffic updates and road condition alerts."
    },
    {
      icon: Heart,
      title: "Specialized Care",
      description: "Find facilities with specific services like cardiac care, trauma centers, or pediatric emergency."
    },
    {
      icon: Phone,
      title: "Emergency Contacts",
      description: "Quick access to emergency contacts and the ability to notify family members automatically."
    },
    {
      icon: Shield,
      title: "Verified Information",
      description: "All facility data is verified and updated in real-time for accuracy and reliability."
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Emergency care when you need it most
          </h2>
          <p className="text-xl text-muted-foreground">
            Our platform provides comprehensive emergency care routing with real-time data 
            to ensure you get the right care as quickly as possible.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-soft">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-6 mx-auto">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;