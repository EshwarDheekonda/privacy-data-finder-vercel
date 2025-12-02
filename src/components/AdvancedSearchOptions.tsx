import { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Phone, Calendar, MapPin, Building, GraduationCap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface PIIAttributes {
  email?: string;
  phone?: string;
  dob?: string; // Date of Birth
  address?: string;
  location?: string;
  employer?: string;
  education?: string;
}

interface AdvancedSearchOptionsProps {
  piiAttributes: PIIAttributes;
  onPIIAttributesChange: (attributes: PIIAttributes) => void;
  includeSocialMedia: boolean;
  onIncludeSocialMediaChange: (include: boolean) => void;
}

export const AdvancedSearchOptions: React.FC<AdvancedSearchOptionsProps> = ({
  piiAttributes,
  onPIIAttributesChange,
  includeSocialMedia,
  onIncludeSocialMediaChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateAttribute = (key: keyof PIIAttributes, value: string) => {
    onPIIAttributesChange({
      ...piiAttributes,
      [key]: value,
    });
  };

  const hasAnyAttributes = Object.values(piiAttributes).some(val => val && val.trim() !== '');

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-violet-200/80 hover:text-violet-100 hover:bg-white/5 transition-all duration-200"
      >
        <span className="flex items-center justify-center gap-2">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isExpanded ? 'Hide' : 'Show'} Advanced Options
            {hasAnyAttributes && !isExpanded && (
              <span className="ml-2 text-xs text-violet-300/60">({Object.values(piiAttributes).filter(v => v).length} fields filled)</span>
            )}
          </span>
        </span>
      </Button>

      {isExpanded && (
        <Card className="mt-4 glass-card border-violet-500/20 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Additional Information (Optional)</h3>
              <p className="text-sm text-violet-200/70">
                Provide additional PII attributes to refine your search and get more targeted results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="pii-email" className="text-violet-200/90 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="pii-email"
                  type="email"
                  placeholder="example@email.com"
                  value={piiAttributes.email || ''}
                  onChange={(e) => updateAttribute('email', e.target.value)}
                  className="bg-white/10 border-violet-400/30 text-white placeholder:text-violet-200/50 focus:border-violet-400/60"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="pii-phone" className="text-violet-200/90 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="pii-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={piiAttributes.phone || ''}
                  onChange={(e) => updateAttribute('phone', e.target.value)}
                  className="bg-white/10 border-violet-400/30 text-white placeholder:text-violet-200/50 focus:border-violet-400/60"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="pii-dob" className="text-violet-200/90 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input
                  id="pii-dob"
                  type="text"
                  placeholder="MM/DD/YYYY or YYYY"
                  value={piiAttributes.dob || ''}
                  onChange={(e) => updateAttribute('dob', e.target.value)}
                  className="bg-white/10 border-violet-400/30 text-white placeholder:text-violet-200/50 focus:border-violet-400/60"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="pii-address" className="text-violet-200/90 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="pii-address"
                  type="text"
                  placeholder="Street address, City, State"
                  value={piiAttributes.address || ''}
                  onChange={(e) => updateAttribute('address', e.target.value)}
                  className="bg-white/10 border-violet-400/30 text-white placeholder:text-violet-200/50 focus:border-violet-400/60"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="pii-location" className="text-violet-200/90 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location (City, State/Country)
                </Label>
                <Input
                  id="pii-location"
                  type="text"
                  placeholder="New York, NY or London, UK"
                  value={piiAttributes.location || ''}
                  onChange={(e) => updateAttribute('location', e.target.value)}
                  className="bg-white/10 border-violet-400/30 text-white placeholder:text-violet-200/50 focus:border-violet-400/60"
                />
              </div>

              {/* Employer */}
              <div className="space-y-2">
                <Label htmlFor="pii-employer" className="text-violet-200/90 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Employer / Company
                </Label>
                <Input
                  id="pii-employer"
                  type="text"
                  placeholder="Company name"
                  value={piiAttributes.employer || ''}
                  onChange={(e) => updateAttribute('employer', e.target.value)}
                  className="bg-white/10 border-violet-400/30 text-white placeholder:text-violet-200/50 focus:border-violet-400/60"
                />
              </div>

              {/* Education */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pii-education" className="text-violet-200/90 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education / School
                </Label>
                <Input
                  id="pii-education"
                  type="text"
                  placeholder="University name or school"
                  value={piiAttributes.education || ''}
                  onChange={(e) => updateAttribute('education', e.target.value)}
                  className="bg-white/10 border-violet-400/30 text-white placeholder:text-violet-200/50 focus:border-violet-400/60"
                />
              </div>
            </div>

            {/* Social Media Consent */}
            <div className="pt-4 border-t border-violet-400/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="include-social-media"
                  checked={includeSocialMedia}
                  onCheckedChange={(checked) => onIncludeSocialMediaChange(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="include-social-media"
                    className="text-violet-200/90 font-medium cursor-pointer flex items-center gap-2"
                  >
                    Include Social Media Search
                  </Label>
                  <p className="text-sm text-violet-200/60 leading-relaxed">
                    I consent to search social media platforms (Facebook, Twitter, Instagram, LinkedIn, TikTok, YouTube) 
                    for privacy-related information. This will provide more comprehensive results but may take longer.
                  </p>
                  {!includeSocialMedia && (
                    <Alert className="mt-2 bg-violet-500/10 border-violet-400/30">
                      <Info className="h-4 w-4 text-violet-300" />
                      <AlertDescription className="text-violet-200/80 text-xs">
                        Social media search is disabled. Only web pages will be searched.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

