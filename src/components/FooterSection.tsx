import React, { useState } from 'react';
import { Shield, Mail, Phone, MapPin, Github, Twitter, Linkedin, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';

export const FooterSection = () => {
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "How it Works", href: "#how-it-works" },
      { name: "Use Cases", href: "#use-cases" }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" }
  ];

  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">PrivacyGuard</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Advanced PII risk assessment and privacy protection tools for individuals and enterprises. 
              Secure your digital identity with real-time monitoring and actionable insights.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">UA</span>
                </div>
                <span>Research and Developed by professionals of University of Arkansas at Little Rock</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              
              {/* Delete Account Link - Only show if user is authenticated */}
              {user && (
                <li className="pt-2 border-t border-border/50">
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-sm text-muted-foreground hover:text-destructive transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <Trash2 className="w-3 h-3 group-hover:text-destructive" />
                    Delete Account
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Spacer for alignment */}
          <div></div>
        </div>

        {/* Security Certifications */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="text-center mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-4">Security & Compliance</h4>
            <div className="flex justify-center items-center gap-6 flex-wrap">
              <div className="glass-card p-3 px-4 text-xs font-medium">
                🛡️ SOC 2 Type II
              </div>
              <div className="glass-card p-3 px-4 text-xs font-medium">
                🔒 GDPR Compliant
              </div>
              <div className="glass-card p-3 px-4 text-xs font-medium">
                ⭐ ISO 27001
              </div>
              <div className="glass-card p-3 px-4 text-xs font-medium">
                🎯 CCPA Ready
              </div>
              <div className="glass-card p-3 px-4 text-xs font-medium">
                🔐 Zero Data Retention
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 PrivacyGuard. All rights reserved.
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="w-10 h-10 glass-card flex items-center justify-center interactive-hover"
              >
                <social.icon className="w-5 h-5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center">
          <div className="glass-card p-4 max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground">
              <span className="text-secondary font-medium">Privacy First:</span> We do not store, retain, or share any personal data from assessments. 
              All scans are performed in real-time and results are delivered directly to you without any data persistence.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
      />
    </footer>
  );
};