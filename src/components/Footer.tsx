const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo-quicker.svg" 
                alt="QuickER Logo" 
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <p className="text-secondary-foreground/80 mb-6 max-w-md">
              Get to the right hospital, faster. Because in emergencies, minutes matter.
            </p>
            <div className="text-sm text-secondary-foreground/60">
              © 2024 QuickER. All rights reserved.
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Service</h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Find Emergency Care</a></li>
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Wait Times</a></li>
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Specialized Care</a></li>
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Emergency Contacts</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-secondary-foreground transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-secondary-foreground/60">
            <strong>Important:</strong> QuickER provides routing assistance only. Always call 911 for life-threatening emergencies.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;