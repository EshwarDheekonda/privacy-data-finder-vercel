import { toast } from '@/hooks/use-toast';

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Raw API Response Interfaces (matching actual backend structure)
export interface RawWebpageResult {
  description: string;
  domain: string;
  relevance_score: number;
  title: string;
  url: string;
}

export interface RawSocialMediaResults {
  facebook: any[];
  instagram: any[];
  linkedin: any[];
  tiktok: any[];
  twitter: any[];
  youtube: any[];
}

export interface RawApiResponse {
  query: string;
  total_results: number;
  total_social_results: number;
  webpages: RawWebpageResult[];
  social_media: RawSocialMediaResults;
}

// Frontend Interfaces (transformed for UI)
export interface SearchResult {
  id: string;
  name: string;
  source: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  data_types: string[];
  found_at: string;
  confidence: number;
  title?: string;
  snippet?: string;
  reasoning?: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResult[];
  scan_time: number;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Data Transformation Functions
export const transformApiResponse = (rawResponse: RawApiResponse): SearchResponse => {
  console.log('🔄 Starting transformation with raw data:', {
    total_results: rawResponse.total_results,
    total_social_results: rawResponse.total_social_results,
    webpages_length: rawResponse.webpages?.length,
    social_media_platforms: rawResponse.social_media ? Object.keys(rawResponse.social_media) : []
  });
  
  const allResults: SearchResult[] = [];
  let processedCount = 0;
  
  // Process webpages first
  if (rawResponse.webpages && Array.isArray(rawResponse.webpages)) {
    console.log(`📄 Processing ${rawResponse.webpages.length} webpages`);
    rawResponse.webpages.forEach((webpage, index) => {
      if (webpage) {
        try {
          const transformedResult = transformWebpageResult(webpage, processedCount);
          allResults.push(transformedResult);
          processedCount++;
          console.log(`✓ Webpage ${processedCount}: ${transformedResult.name || 'Untitled'}`);
        } catch (error) {
          console.error(`❌ Error transforming webpage ${index}:`, error);
        }
      }
    });
  }
  
  // Process social media results
  if (rawResponse.social_media && typeof rawResponse.social_media === 'object') {
    console.log('👥 Processing social media results');
    Object.entries(rawResponse.social_media).forEach(([platform, results]) => {
      if (Array.isArray(results) && results.length > 0) {
        console.log(`📱 Processing ${results.length} ${platform} results`);
        results.forEach((result: any, index: number) => {
          if (result) {
            try {
              const transformedResult = transformSocialMediaResult(result, platform, processedCount);
              allResults.push(transformedResult);
              processedCount++;
              console.log(`✓ ${platform} ${processedCount}: ${transformedResult.name || 'Profile'}`);
            } catch (error) {
              console.error(`❌ Error transforming ${platform} result ${index}:`, error);
            }
          }
        });
      }
    });
  }

  // Validation - fix expected count calculation
  const expectedTotal = rawResponse.total_results + rawResponse.total_social_results;
  const actualTotal = allResults.length;
  
  console.log('📊 TRANSFORMATION SUMMARY:', {
    webpage_results: rawResponse.total_results,
    social_results: rawResponse.total_social_results,
    expected_total: expectedTotal,
    actual_total: actualTotal,
    success_rate: actualTotal > 0 ? `${Math.round((actualTotal / expectedTotal) * 100)}%` : '0%',
    missing_results: Math.max(0, expectedTotal - actualTotal)
  });

  if (actualTotal !== expectedTotal) {
    console.warn(`⚠️ Result count mismatch: Expected ${expectedTotal} (${rawResponse.total_results} webpages + ${rawResponse.total_social_results} social), got ${actualTotal}`);
  } else {
    console.log(`✅ Result count matches: ${actualTotal} results processed successfully`);
  }

  return {
    query: rawResponse.query,
    total_results: actualTotal, // Use actual processed count for UI consistency
    scan_time: 0,
    timestamp: new Date().toISOString(),
    results: allResults,
  };
};

export const transformWebpageResult = (webpage: RawWebpageResult, index: number): SearchResult => {
  const riskLevel = getRiskLevelFromScore(webpage.relevance_score || 0.5);
  const confidence = Math.max(0.3, webpage.relevance_score || 0.5);
  
  // Check if this webpage is actually a social media profile
  const isSocialMedia = isWebpageSocialMedia(webpage.domain, webpage.url);
  const dataTypes = getDataTypesForWebpage(webpage.domain, webpage.description || '', webpage.url);
  
  // Use social- prefix for social media results to match categorization logic
  const idPrefix = isSocialMedia ? 'social-webpage' : 'webpage';
  
  return {
    id: `${idPrefix}-${index}`,
    name: webpage.title || webpage.domain || 'Untitled',
    source: webpage.url || `https://${webpage.domain}`,
    risk_level: riskLevel,
    data_types: dataTypes,
    found_at: new Date().toISOString(),
    confidence: confidence,
    title: webpage.title || webpage.domain,
    snippet: webpage.description || '',
    reasoning: `Found on ${webpage.domain} (relevance: ${webpage.relevance_score || 0})`,
  };
};

export const transformSocialMediaResult = (result: any, platform: string, index: number): SearchResult => {
  const riskLevel = getSocialMediaRiskLevel(platform, result);
  const confidence = 0.8;
  
  return {
    id: `social-${platform}-${index}`,
    name: result.title || result.name || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile`,
    source: result.url || `https://${platform}.com`,
    risk_level: riskLevel,
    data_types: [`${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile`, 'Social Media', 'Personal Information'],
    found_at: new Date().toISOString(),
    confidence: confidence,
    title: result.title || result.name,
    snippet: result.description || result.bio || result.snippet || '',
    reasoning: `Found on ${platform} social media platform`,
  };
};

// Simplified social media detection helper
export const isWebpageSocialMedia = (domain: string, url: string = ''): boolean => {
  const socialDomains = [
    'linkedin.com', 'facebook.com', 'twitter.com', 'x.com',
    'instagram.com', 'tiktok.com', 'youtube.com', 'snapchat.com', 'pinterest.com'
  ];
  
  const lowerDomain = domain.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  return socialDomains.some(socialDomain => 
    lowerDomain.includes(socialDomain) || lowerUrl.includes(socialDomain)
  );
};

// Simplified data types detection
export const getDataTypesForWebpage = (domain: string, description: string, url: string = ''): string[] => {
  const dataTypes: string[] = [];
  const lowerDescription = description.toLowerCase();
  const lowerDomain = domain.toLowerCase();
  
  // Check for social media first
  if (isWebpageSocialMedia(domain, url)) {
    if (lowerDomain.includes('linkedin')) {
      dataTypes.push('Professional Profile', 'LinkedIn Profile');
    } else if (lowerDomain.includes('facebook')) {
      dataTypes.push('Social Media Profile', 'Facebook Profile');
    } else if (lowerDomain.includes('twitter') || lowerDomain.includes('x.com')) {
      dataTypes.push('Social Media Profile', 'Twitter Profile');
    } else if (lowerDomain.includes('instagram')) {
      dataTypes.push('Social Media Profile', 'Instagram Profile');
    } else if (lowerDomain.includes('youtube')) {
      dataTypes.push('Social Media Profile', 'YouTube Profile');
    } else {
      dataTypes.push('Social Media Profile');
    }
  } else {
    // Other website categories
    if (lowerDomain.includes('university') || lowerDomain.includes('edu')) {
      dataTypes.push('Academic Information');
    } else if (lowerDomain.includes('news')) {
      dataTypes.push('News Article', 'Public Mention');
    } else {
      dataTypes.push('Public Profile', 'Web Presence');
    }
  }
  
  dataTypes.push('Personal Information');
  return [...new Set(dataTypes)];
};

// Helper function to determine risk level for social media
export const getSocialMediaRiskLevel = (platform: string, result: any): 'low' | 'medium' | 'high' | 'critical' => {
  // LinkedIn tends to be more professional/public
  if (platform === 'linkedin') return 'medium';
  
  // Facebook, Instagram can be more personal
  if (platform === 'facebook' || platform === 'instagram') return 'high';
  
  // Twitter is often public
  if (platform === 'twitter') return 'medium';
  
  // Default for other platforms
  return 'medium';
};

export const getRiskLevelFromScore = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
};

// Custom Error Class
export class SearchApiError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'SearchApiError';
    this.code = code;
    this.details = details;
  }
}

// API Functions
export const searchApi = {
  /**
   * Search for privacy risks associated with a name with retry logic
   */
  async searchByName(searchName: string, retryCount = 0): Promise<SearchResponse> {
    if (!searchName.trim()) {
      throw new SearchApiError('Search name cannot be empty');
    }

    try {
      const url = new URL('/search', API_BASE_URL);
      url.searchParams.append('searchName', searchName.trim());

      console.log('Starting API request to:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // No timeout - let backend take as long as needed
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error response:', errorData);
        throw new SearchApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || `HTTP_${response.status}`,
          errorData
        );
      }

      const rawData: RawApiResponse = await response.json();
      console.log('Raw API Data received:', {
        query: rawData.query,
        total_results: rawData.total_results,
        total_social_results: rawData.total_social_results,
        webpages_count: rawData.webpages?.length || 0,
        webpages_sample: rawData.webpages?.slice(0, 3),
        social_media_structure: rawData.social_media,
        social_media_counts: Object.entries(rawData.social_media || {}).map(([platform, results]) => ({
          platform,
          count: Array.isArray(results) ? results.length : 0,
          sample: Array.isArray(results) ? results[0] : results
        }))
      });
      
      const transformedData = transformApiResponse(rawData);
      console.log('Transformed data:', {
        total_results: transformedData.total_results,
        results_count: transformedData.results?.length || 0,
        webpage_results: transformedData.results?.filter(r => r.id.startsWith('webpage')).length || 0,
        social_results: transformedData.results?.filter(r => r.id.startsWith('social')).length || 0,
        sample_result: transformedData.results?.[0]
      });
      return transformedData;
    } catch (error) {
      if (error instanceof SearchApiError) {
        throw error;
      }

      // Handle network errors with retry logic
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (retryCount < 2) {
          // Retry up to 2 times for network errors
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Progressive delay
          return searchApi.searchByName(searchName, retryCount + 1);
        }
        throw new SearchApiError(
          'Unable to connect to the privacy assessment service. Please check your internet connection and try again.',
          'NETWORK_ERROR'
        );
      }

      // Handle other errors
      throw new SearchApiError(
        'An unexpected error occurred during the search. Please try again.',
        'UNKNOWN_ERROR',
        error
      );
    }
  },

  /**
   * Extract detailed information for selected URLs
   */
  async extractDetails(searchName: string, selectedUrls: string[]): Promise<any> {
    if (!searchName.trim()) {
      throw new SearchApiError('Search name cannot be empty');
    }

    if (!selectedUrls || selectedUrls.length === 0) {
      throw new SearchApiError('No URLs selected for extraction');
    }

    try {
      const url = new URL('/extract', API_BASE_URL);
      
      console.log('Sending extract request:', {
        searchName: searchName.trim(),
        selectedUrls,
        urlCount: selectedUrls.length
      });

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchName: searchName.trim(),
          selectedUrls: selectedUrls
        }),
      });

      console.log('Extract API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Extract API Error response:', errorData);
        throw new SearchApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || `HTTP_${response.status}`,
          errorData
        );
      }

      // Return the analysis data from the backend
      const responseData = await response.json();
      console.log('Extract request completed successfully:', responseData);
      return responseData;
    } catch (error) {
      if (error instanceof SearchApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new SearchApiError(
          'Unable to connect to the extraction service. Please check your internet connection and try again.',
          'NETWORK_ERROR'
        );
      }

      // Handle other errors
      throw new SearchApiError(
        'An unexpected error occurred during extraction. Please try again.',
        'UNKNOWN_ERROR',
        error
      );
    }
  },
};

// Utility function for handling API errors with toast notifications
export const handleApiError = (error: SearchApiError | Error): void => {
  console.error('API Error:', error);

  if (error instanceof SearchApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        toast({
          title: 'Connection Error',
          description: error.message,
          variant: 'destructive',
        });
        break;
      default:
        toast({
          title: 'Search Error',
          description: error.message,
          variant: 'destructive',
        });
    }
  } else {
    toast({
      title: 'Unexpected Error',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  }
};
