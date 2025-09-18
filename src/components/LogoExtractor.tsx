import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Image } from "lucide-react";
import { toast } from "sonner";

const LogoExtractor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Static version of your logo without animations
  const StaticLogo = ({ width = 180, height = 40 }: { width?: number; height?: number }) => (
    <svg width={width} height={height} viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:"#EF4444", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#DC2626", stopOpacity:1}} />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000020"/>
        </filter>
      </defs>
      
      <g filter="url(#shadow)">
        <path d="M20 8C20 12.4183 16.4183 16 12 16C7.58172 16 4 12.4183 4 8C4 3.58172 7.58172 0 12 0C16.4183 0 20 3.58172 20 8Z" fill="url(#pinGradient)"/>
        <path d="M12 16L8 24H16L12 16Z" fill="url(#pinGradient)"/>
        <rect x="10.5" y="4" width="3" height="8" rx="0.5" fill="white"/>
        <rect x="7" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
      </g>
      
      <g transform="translate(36, 4)">
        <text x="0" y="16" fontFamily="Poppins, system-ui, sans-serif" fontSize="20" fontWeight="700" fill="#111827" letterSpacing="-0.02em">
          Quick
        </text>
        <text x="60" y="16" fontFamily="Poppins, system-ui, sans-serif" fontSize="20" fontWeight="700" fill="#DC2626" letterSpacing="-0.02em">
          ER
        </text>
        <text x="0" y="30" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="400" fill="#6B7280" letterSpacing="0.02em">
          Get to the right hospital, faster.
        </text>
      </g>
      
      <g opacity="0.4">
        <line x1="24" y1="6" x2="30" y2="6" stroke="#DC2626" strokeWidth="1" strokeLinecap="round"/>
        <line x1="26" y1="10" x2="32" y2="10" stroke="#DC2626" strokeWidth="1" strokeLinecap="round"/>
        <line x1="24" y1="14" x2="28" y2="14" stroke="#DC2626" strokeWidth="1" strokeLinecap="round"/>
      </g>
    </svg>
  );

  // Icon version (just the medical pin)
  const IconLogo = ({ size = 32 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:"#EF4444", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#DC2626", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <path d="M20 8C20 12.4183 16.4183 16 12 16C7.58172 16 4 12.4183 4 8C4 3.58172 7.58172 0 12 0C16.4183 0 20 3.58172 20 8Z" fill="url(#iconGradient)"/>
      <path d="M12 16L8 24H16L12 16Z" fill="url(#iconGradient)"/>
      <rect x="10.5" y="4" width="3" height="8" rx="0.5" fill="white"/>
      <rect x="7" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
    </svg>
  );

  const svgToPng = async (svgElement: SVGElement, width: number, height: number, filename: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, width, height);
      
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
          }
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png');
      };
      img.src = url;
    });
  };

  const generatePng = async (type: 'logo' | 'logo-2x' | 'logo-3x' | 'icon' | 'favicon') => {
    setIsGenerating(true);
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      let svgElement: SVGElement;
      let width: number, height: number, filename: string;
      
      switch (type) {
        case 'logo':
          tempDiv.innerHTML = '<div id="temp-logo"></div>';
          const logoContainer = tempDiv.querySelector('#temp-logo')!;
          const logoComponent = <StaticLogo width={180} height={40} />;
          // Create SVG manually for better control
          svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgElement.innerHTML = `<defs>
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000020"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <path d="M20 8C20 12.4183 16.4183 16 12 16C7.58172 16 4 12.4183 4 8C4 3.58172 7.58172 0 12 0C16.4183 0 20 3.58172 20 8Z" fill="url(#pinGradient)"/>
            <path d="M12 16L8 24H16L12 16Z" fill="url(#pinGradient)"/>
            <rect x="10.5" y="4" width="3" height="8" rx="0.5" fill="white"/>
            <rect x="7" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
          </g>
          <g transform="translate(36, 4)">
            <text x="0" y="16" font-family="Poppins, system-ui, sans-serif" font-size="20" font-weight="700" fill="#111827" letter-spacing="-0.02em">Quick</text>
            <text x="60" y="16" font-family="Poppins, system-ui, sans-serif" font-size="20" font-weight="700" fill="#DC2626" letter-spacing="-0.02em">ER</text>
            <text x="0" y="30" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="400" fill="#6B7280" letter-spacing="0.02em">Get to the right hospital, faster.</text>
          </g>
          <g opacity="0.4">
            <line x1="24" y1="6" x2="30" y2="6" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
            <line x1="26" y1="10" x2="32" y2="10" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
            <line x1="24" y1="14" x2="28" y2="14" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
          </g>`;
          svgElement.setAttribute('viewBox', '0 0 180 40');
          width = 180; height = 40; filename = 'quicker-logo.png';
          break;
        case 'logo-2x':
          svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgElement.innerHTML = `<defs>
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000020"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <path d="M20 8C20 12.4183 16.4183 16 12 16C7.58172 16 4 12.4183 4 8C4 3.58172 7.58172 0 12 0C16.4183 0 20 3.58172 20 8Z" fill="url(#pinGradient)"/>
            <path d="M12 16L8 24H16L12 16Z" fill="url(#pinGradient)"/>
            <rect x="10.5" y="4" width="3" height="8" rx="0.5" fill="white"/>
            <rect x="7" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
          </g>
          <g transform="translate(36, 4)">
            <text x="0" y="16" font-family="Poppins, system-ui, sans-serif" font-size="20" font-weight="700" fill="#111827" letter-spacing="-0.02em">Quick</text>
            <text x="60" y="16" font-family="Poppins, system-ui, sans-serif" font-size="20" font-weight="700" fill="#DC2626" letter-spacing="-0.02em">ER</text>
            <text x="0" y="30" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="400" fill="#6B7280" letter-spacing="0.02em">Get to the right hospital, faster.</text>
          </g>
          <g opacity="0.4">
            <line x1="24" y1="6" x2="30" y2="6" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
            <line x1="26" y1="10" x2="32" y2="10" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
            <line x1="24" y1="14" x2="28" y2="14" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
          </g>`;
          svgElement.setAttribute('viewBox', '0 0 180 40');
          width = 360; height = 80; filename = 'quicker-logo-2x.png';
          break;
        case 'logo-3x':
          svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgElement.innerHTML = `<defs>
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000020"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <path d="M20 8C20 12.4183 16.4183 16 12 16C7.58172 16 4 12.4183 4 8C4 3.58172 7.58172 0 12 0C16.4183 0 20 3.58172 20 8Z" fill="url(#pinGradient)"/>
            <path d="M12 16L8 24H16L12 16Z" fill="url(#pinGradient)"/>
            <rect x="10.5" y="4" width="3" height="8" rx="0.5" fill="white"/>
            <rect x="7" y="6.5" width="10" height="3" rx="0.5" fill="white"/>
          </g>
          <g transform="translate(36, 4)">
            <text x="0" y="16" font-family="Poppins, system-ui, sans-serif" font-size="20" font-weight="700" fill="#111827" letter-spacing="-0.02em">Quick</text>
            <text x="60" y="16" font-family="Poppins, system-ui, sans-serif" font-size="20" font-weight="700" fill="#DC2626" letter-spacing="-0.02em">ER</text>
            <text x="0" y="30" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="400" fill="#6B7280" letter-spacing="0.02em">Get to the right hospital, faster.</text>
          </g>
          <g opacity="0.4">
            <line x1="24" y1="6" x2="30" y2="6" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
            <line x1="26" y1="10" x2="32" y2="10" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
            <line x1="24" y1="14" x2="28" y2="14" stroke="#DC2626" stroke-width="1" stroke-linecap="round"/>
          </g>`;
          svgElement.setAttribute('viewBox', '0 0 180 40');
          width = 540; height = 120; filename = 'quicker-logo-3x.png';
          break;
        case 'icon':
          svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgElement.innerHTML = `<defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path d="M20 8C20 12.4183 16.4183 16 12 16C7.58172 16 4 12.4183 4 8C4 3.58172 7.58172 0 12 0C16.4183 0 20 3.58172 20 8Z" fill="url(#iconGradient)"/>
          <path d="M12 16L8 24H16L12 16Z" fill="url(#iconGradient)"/>
          <rect x="10.5" y="4" width="3" height="8" rx="0.5" fill="white"/>
          <rect x="7" y="6.5" width="10" height="3" rx="0.5" fill="white"/>`;
          svgElement.setAttribute('viewBox', '0 0 24 24');
          width = 64; height = 64; filename = 'quicker-icon.png';
          break;
        case 'favicon':
          svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgElement.innerHTML = `<defs>
            <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path d="M20 8C20 12.4183 16.4183 16 12 16C7.58172 16 4 12.4183 4 8C4 3.58172 7.58172 0 12 0C16.4183 0 20 3.58172 20 8Z" fill="url(#faviconGradient)"/>
          <path d="M12 16L8 24H16L12 16Z" fill="url(#faviconGradient)"/>
          <rect x="10.5" y="4" width="3" height="8" rx="0.5" fill="white"/>
          <rect x="7" y="6.5" width="10" height="3" rx="0.5" fill="white"/>`;
          svgElement.setAttribute('viewBox', '0 0 24 24');
          width = 32; height = 32; filename = 'quicker-favicon.png';
          break;
        default:
          return;
      }
      
      await svgToPng(svgElement, width, height, filename);
      toast(`${filename} downloaded successfully!`);
      
      document.body.removeChild(tempDiv);
    } catch (error) {
      toast("Error generating PNG. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">QuickER Logo Extractor</h1>
        <p className="text-muted-foreground">Download your logo in various PNG formats</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Full Logo Previews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Full Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center">
              <StaticLogo />
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => generatePng('logo')} 
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Standard (180×40px)
              </Button>
              <Button 
                onClick={() => generatePng('logo-2x')} 
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                2x Resolution (360×80px)
              </Button>
              <Button 
                onClick={() => generatePng('logo-3x')} 
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                3x Resolution (540×120px)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Icon Previews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Icon Only
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center">
              <IconLogo size={64} />
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => generatePng('icon')} 
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Icon (64×64px)
              </Button>
              <Button 
                onClick={() => generatePng('favicon')} 
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Favicon (32×32px)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for PNG generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>All PNGs are generated with transparent backgrounds and preserve the original design elements including gradients and shadows.</p>
      </div>
    </div>
  );
};

export default LogoExtractor;