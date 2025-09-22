// Enhanced Backend Response Interface matching the new API structure
export interface EnhancedBackendResponse {
  // Core PII Data (existing)
  Name: string[];
  Location: string[];
  Email: string[];
  Phone: string[];
  DOB: string[];
  Address: string[];
  Gender: string[];
  Employer: string[];
  Education: string[];
  "Birth Place": string[];
  "Personal Cell": string[];
  "Business Phone": string[];
  "Facebook Account": string[];
  "Twitter Account": string[];
  "Instagram Account": string[];
  "LinkedIn Account": string[];
  "TikTok Account": string[];
  "YouTube Account": string[];
  DDL: string[];
  Passport: string[];
  "Credit Card": string[];
  SSN: string[];
  "Family Members": string[];
  Occupation: string[];
  Salary: string[];
  Website: string[];

  // Risk Assessment (existing)
  risk_score: number;
  risk_level: string;
  risk_analysis: Record<string, string>;
  recommendations: string[];

  // Enhanced Metadata (NEW)
  query: string;
  timestamp: string;
  message: string;
  suggestions: string[];

  // Enhanced Extraction Summary (NEW)
  extraction_summary: {
    total_sources: number;
    webpage_sources: number;
    social_media_sources: number;
    successful_extractions: number;
    failed_extractions: number;
    total_pii_found: number;
    pii_categories_found: number;
    data_points_extracted: number;
    extraction_time: number;
    extraction_details: ExtractionDetail[];
    scraping_performance: ScrapingPerformance;
  };

  // Advanced PII Analytics (NEW)
  pii_summary: {
    total_items: number;
    categories_found: number;
    sensitive_items: number;
    non_sensitive_items: number;
    categories_breakdown: {
      names: number;
      emails: number;
      phones: number;
      addresses: number;
      locations: number;
      employers: number;
      education: number;
      social_media: number;
      sensitive_docs: number;
    };
  };

  // Optional Debug Data (NEW)
  pii_preview?: Record<string, string[]>;
  debug_pii_data?: Record<string, string[]> | string;
}

export interface ExtractionDetail {
  source: string;
  type: "webpage" | "social_media";
  status: "success" | "failed" | "no_relevant_content" | "error";
  data_points: number;
  platform: string;
  scraper_used: "apify" | "fallback" | "failed" | "error";
  username?: string;
  error?: string;
}

export interface ScrapingPerformance {
  apify_used: number;
  fallback_used: number;
  total_failed: number;
  apify_available: boolean;
  apify_stats?: Record<string, any>;
  optimization_applied: boolean;
  concurrent_processing: boolean;
  concurrent_fetch_limit?: number;
  concurrent_gpt_limit?: number;
}

// PII Category mappings for better visualization
export const PII_CATEGORIES = {
  // High-Risk Data
  'sensitive_docs': ['SSN', 'Credit Card', 'Passport', 'DDL'],
  
  // Personal Information
  'personal': ['Name', 'DOB', 'Address', 'Location', 'Gender', 'Birth Place'],
  
  // Contact Information
  'contact': ['Email', 'Phone', 'Personal Cell', 'Business Phone'],
  
  // Professional Information
  'professional': ['Employer', 'Education', 'Occupation', 'Salary'],
  
  // Social Media Presence
  'social_media': [
    'Facebook Account', 'Twitter Account', 'Instagram Account', 
    'LinkedIn Account', 'TikTok Account', 'YouTube Account'
  ],
  
  // Family & Personal
  'family': ['Family Members'],
  
  // Digital Presence
  'digital': ['Website']
};

export const RISK_LEVEL_COLORS = {
  'very high': 'text-red-600 bg-red-100',
  'high': 'text-orange-600 bg-orange-100',
  'medium': 'text-yellow-600 bg-yellow-100',
  'low': 'text-green-600 bg-green-100',
  'very low': 'text-green-500 bg-green-50',
  'no risk': 'text-gray-600 bg-gray-100'
};

export const PLATFORM_COLORS = {
  'linkedin': 'text-blue-600 bg-blue-100',
  'facebook': 'text-blue-600 bg-blue-100',
  'twitter': 'text-sky-600 bg-sky-100',
  'instagram': 'text-purple-600 bg-purple-100',
  'youtube': 'text-red-600 bg-red-100',
  'tiktok': 'text-pink-600 bg-pink-100',
  'webpage': 'text-green-600 bg-green-100'
};