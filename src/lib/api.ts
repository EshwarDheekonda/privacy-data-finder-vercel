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
  console.log('Starting transformation with raw data:', {
    total_results: rawResponse.total_results,
    webpages_length: rawResponse.webpages?.length,
    social_media_structure: rawResponse.social_media
  });
  
  const allResults: SearchResult[] = [];
  
  // Transform webpages - with safety checks
  if (rawResponse.webpages && Array.isArray(rawResponse.webpages)) {
    console.log(`Processing ${rawResponse.webpages.length} webpages`);
    rawResponse.webpages.forEach((webpage, index) => {
      try {
        allResults.push(transformWebpageResult(webpage, index));
      } catch (error) {
        console.error(`Error transforming webpage ${index}:`, error, webpage);
      }
    });
  } else {
    console.warn('No webpages found or webpages is not an array:', rawResponse.webpages);
  }
  
  // Transform social media results - with safety checks
  if (rawResponse.social_media && typeof rawResponse.social_media === 'object') {
    console.log('Processing social media results:', Object.keys(rawResponse.social_media));
    Object.entries(rawResponse.social_media).forEach(([platform, results]) => {
      if (Array.isArray(results)) {
        console.log(`Processing ${results.length} ${platform} results`);
        results.forEach((result: any, index: number) => {
          try {
            allResults.push(transformSocialMediaResult(result, platform, index));
          } catch (error) {
            console.error(`Error transforming ${platform} result ${index}:`, error, result);
          }
        });
      } else {
        console.warn(`${platform} results is not an array:`, results);
      }
    });
  } else {
    console.warn('No social media results found or invalid structure:', rawResponse.social_media);
  }

  console.log(`Total results after transformation: ${allResults.length}`);

  return {
    query: rawResponse.query,
    total_results: rawResponse.total_results,
    scan_time: 0, // Not provided by API
    timestamp: new Date().toISOString(),
    results: allResults,
  };
};

export const transformWebpageResult = (webpage: RawWebpageResult, index: number): SearchResult => {
  // Generate risk assessment based on relevance score and domain
  const riskLevel = getRiskLevelFromScore(webpage.relevance_score);
  const confidence = Math.max(0.3, webpage.relevance_score); // Ensure minimum confidence
  
  return {
    id: `webpage-${index}-${Date.now()}`,
    name: webpage.title,
    source: webpage.url,
    risk_level: riskLevel,
    data_types: ['Personal Information', 'Public Profile'],
    found_at: new Date().toISOString(),
    confidence: confidence,
    title: webpage.title,
    snippet: webpage.description,
    reasoning: `Found on ${webpage.domain} with relevance score ${webpage.relevance_score}`,
  };
};

export const transformSocialMediaResult = (result: any, platform: string, index: number): SearchResult => {
  return {
    id: `social-${platform}-${index}-${Date.now()}`,
    name: result.title || `${platform} Profile`,
    source: result.url || platform,
    risk_level: 'medium' as const,
    data_types: ['Social Media Profile', 'Personal Information'],
    found_at: new Date().toISOString(),
    confidence: 0.7,
    title: result.title,
    snippet: result.description,
    reasoning: `Found on ${platform} social media platform`,
  };
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