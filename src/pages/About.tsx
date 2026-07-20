import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Shield,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";

const About = () => {
  const { language } = useLanguage();

  const providers = [
    {
      name: "OpenStreetMap / Overpass",
      purpose: "Hospital locations and public map data",
      mode: "Free, best-effort",
      url: "https://www.openstreetmap.org",
    },
    {
      name: "OSRM",
      purpose: "Road-network ETA matrix and route geometry",
      mode: "Free public demo service",
      url: "https://project-osrm.org",
    },
    {
      name: "TomTom",
      purpose: "Future organization-managed live-traffic ETA matrix",
      mode: "Not active on static demo",
    },
    {
      name: "openrouteservice",
      purpose: "Future organization-managed 5/10/15-minute road contours",
      mode: "Not active on static demo",
    },
  ];

  return (
    <Layout>
      <main
        className={`container mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 ${
          language === "ar" ? "rtl" : ""
        }`}
      >
        <Button variant="ghost" asChild>
          <Link to="/home">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>

        <div className="text-center">
          <Badge className="mb-4" variant="secondary">
            Free-first emergency access project
          </Badge>
          <h1 className="mb-5 text-4xl font-bold lg:text-5xl">
            Not the nearest hospital—the fastest suitable option
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            QuickER compares nearby hospitals by travel time, specialty metadata and availability status while showing exactly which information is live, estimated or simulated.
          </p>
        </div>

        <Card className="p-7">
          <div className="mb-5 flex items-center gap-3">
            <WalletCards className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">The $0 promise</h2>
          </div>
          <p className="mb-5 text-muted-foreground">
            The core app does not require a payment method. If a free provider reaches its limit, QuickER falls back to a less precise mode instead of creating a charge.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "No automatic paid overages",
              "No precise coordinates in decision history",
              "Provider and timestamp shown with each ETA",
              "Usable road estimates when live traffic is unavailable",
            ].map((item) => (
              <div key={item} className="flex gap-2 rounded-xl bg-muted/40 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-7">
          <div className="mb-5 flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">How a search works</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <MapPin className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">1. Discover</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Find nearby hospitals from OpenStreetMap and apply the selected emergency filter.
              </p>
            </div>
            <div>
              <Clock className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">2. Compare</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Narrow candidates by road ETA and optionally compare the fastest five with live traffic.
              </p>
            </div>
            <div>
              <Shield className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">3. Explain</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Prefer eligible facilities, show the recommendation and disclose every uncertainty.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-7">
          <h2 className="mb-5 text-2xl font-semibold">Free data providers</h2>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.name}
                className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">{provider.purpose}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{provider.mode}</Badge>
                  {provider.url ? (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={provider.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5 p-7">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-destructive" />
            <h2 className="text-2xl font-semibold text-destructive">Important limitations</h2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>QuickER is not an ambulance dispatcher and does not provide medical advice.</li>
            <li>Hospital specialties from public map data may be incomplete or outdated.</li>
            <li>Availability is simulated unless connected to an authorized operational feed.</li>
            <li>Free public providers offer no guaranteed uptime.</li>
            <li>For urgent situations, call local emergency services and do not delay care to use the app.</li>
          </ul>
        </Card>
      </main>
    </Layout>
  );
};

export default About;
