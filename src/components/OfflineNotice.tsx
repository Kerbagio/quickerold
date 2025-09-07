import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { WifiOff, Wifi } from "lucide-react";

const OfflineNotice = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show banner if already offline
    if (!navigator.onLine) {
      setShowOfflineBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineBanner) return null;

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 p-4 bg-warning text-warning-foreground border-warning shadow-lg">
      <div className="flex items-center justify-center">
        <WifiOff className="w-5 h-5 mr-2" />
        <span className="font-medium">
          You're offline. We'll retry when you're back.
        </span>
      </div>
    </Card>
  );
};

export default OfflineNotice;