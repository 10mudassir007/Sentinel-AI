import { Shield, Github, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Main footer content */}
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">Sentinel AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-sm">
                AI-powered emergency detection and response system. Built for smart cities, 
                security infrastructure, and critical safety applications.
              </p>
              <p className="text-xs text-muted-foreground/60">
                Built with AI for emergency response
              </p>
            </div>
            
            {/* Resources */}
            
          </div>
          
          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              2026 Sentinel AI. Open-source emergency response infrastructure.
            </p>
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
