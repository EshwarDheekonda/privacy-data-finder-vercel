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
    total_social_results: rawResponse.total_social_results,
    webpages_length: rawResponse.webpages?.length,
    social_media_structure: rawResponse.social_media ? Object.keys(rawResponse.social_media) : 'missing'
  });
  
  const allResults: SearchResult[] = [];
  let processedWebpages = 0;
  let processedSocialMedia = 0;
  
  // Transform webpages - with enhanced safety checks and comprehensive validation
  if (rawResponse.webpages && Array.isArray(rawResponse.webpages)) {
    console.log(`Processing ${rawResponse.webpages.length} webpages`);
    rawResponse.webpages.forEach((webpage, index) => {
      try {
        // More lenient validation - accept results with at least title OR url
        if (webpage && (webpage.title || webpage.url)) {
          const transformedResult = transformWebpageResult(webpage, index);
          allResults.push(transformedResult);
          processedWebpages++;
          console.log(`✓ Processed webpage ${index + 1}: ${transformedResult.name} (${transformedResult.id})`);
        } else {
          console.warn(`Invalid webpage at index ${index} - missing title and URL:`, webpage);
        }
      } catch (error) {
        console.error(`Error transforming webpage ${index}:`, error, webpage);
      }
    });
  } else {
    console.warn('No webpages found or webpages is not an array:', rawResponse.webpages);
  }
  
  // Transform social media results - with enhanced safety checks and comprehensive validation
  if (rawResponse.social_media && typeof rawResponse.social_media === 'object') {
    console.log('Processing social media results:', Object.keys(rawResponse.social_media));
    Object.entries(rawResponse.social_media).forEach(([platform, results]) => {
      if (Array.isArray(results)) {
        console.log(`Processing ${results.length} ${platform} results`);
        results.forEach((result: any, index: number) => {
          try {
            // More lenient validation - accept any non-null result
            if (result && typeof result === 'object') {
              const transformedResult = transformSocialMediaResult(result, platform, index);
              allResults.push(transformedResult);
              processedSocialMedia++;
              console.log(`✓ Processed ${platform} ${index + 1}: ${transformedResult.name} (${transformedResult.id})`);
            } else {
              console.warn(`Invalid ${platform} result at index ${index}:`, result);
            }
          } catch (error) {
            console.error(`Error transforming ${platform} result ${index}:`, error, result);
          }
        });
      } else if (results && results !== null) {
        console.warn(`${platform} results is not an array:`, typeof results, results);
      }
    });
  } else {
    console.warn('No social media results found or invalid structure:', rawResponse.social_media);
  }

  // Comprehensive result validation and error reporting
  const expectedTotal = rawResponse.total_results;
  const actualTotal = allResults.length;
  const missingCount = expectedTotal - actualTotal;
  
  console.log(`🔍 TRANSFORMATION COMPLETE:`, {
    total_backend_results: expectedTotal,
    processed_webpages: processedWebpages,
    processed_social_media: processedSocialMedia,
    total_transformed: actualTotal,
    missing_results: missingCount,
    success_rate: `${Math.round((actualTotal / expectedTotal) * 100)}%`
  });

  // Report detailed breakdown by result type
  const webpageResults = allResults.filter(r => r.id.startsWith('webpage') || r.id.startsWith('social-webpage'));
  const socialResults = allResults.filter(r => r.id.startsWith('social-') && !r.id.startsWith('social-webpage'));
  
  console.log(`📊 RESULT BREAKDOWN:`, {
    webpage_results: webpageResults.length,
    social_media_results: socialResults.length,
    backend_webpages: rawResponse.webpages?.length || 0,
    backend_social_total: rawResponse.total_social_results || 0,
    backend_social_actual: Object.values(rawResponse.social_media || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
  });

  // Alert if we're missing significant results
  if (missingCount > 0) {
    console.warn(`⚠️ MISSING RESULTS DETECTED: ${missingCount} results were not processed successfully`);
    
    // Try to identify what we might have missed
    if (rawResponse.webpages) {
      const skippedWebpages = rawResponse.webpages.filter(w => !w.title && !w.url);
      if (skippedWebpages.length > 0) {
        console.warn(`📝 Skipped ${skippedWebpages.length} webpages due to missing title/URL:`, skippedWebpages);
      }
    }
  }

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
  
  // Determine data types based on domain, content, and URL
  const dataTypes = getDataTypesForWebpage(webpage.domain, webpage.description, webpage.url);
  
  // Determine if this is actually a social media result based on content
  const isSocialMediaResult = dataTypes.some(type => 
    type.includes('Profile') && (
      type.includes('LinkedIn') || type.includes('Facebook') || type.includes('Twitter') || 
      type.includes('Instagram') || type.includes('TikTok') || type.includes('YouTube') ||
      type.includes('Social Media')
    )
  );
  
  // Use appropriate ID prefix based on content analysis
  const idPrefix = isSocialMediaResult ? 'social-webpage' : 'webpage';
  
  return {
    id: `${idPrefix}-${index}-${Date.now()}`,
    name: webpage.title,
    source: webpage.url,
    risk_level: riskLevel,
    data_types: dataTypes,
    found_at: new Date().toISOString(),
    confidence: confidence,
    title: webpage.title,
    snippet: webpage.description,
    reasoning: `Found on ${webpage.domain} with relevance score ${webpage.relevance_score}${isSocialMediaResult ? ' (Social Media Profile)' : ''}`,
  };
};

export const transformSocialMediaResult = (result: any, platform: string, index: number): SearchResult => {
  // Determine risk level based on platform and content
  const riskLevel = getSocialMediaRiskLevel(platform, result);
  const confidence = 0.8; // Higher confidence for actual social media results
  
  return {
    id: `social-${platform}-${index}-${Date.now()}`,
    name: result.title || result.name || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile`,
    source: result.url || `https://${platform}.com`,
    risk_level: riskLevel,
    data_types: [`${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile`, 'Social Media', 'Personal Information'],
    found_at: new Date().toISOString(),
    confidence: confidence,
    title: result.title || result.name,
    snippet: result.description || result.bio || result.snippet,
    reasoning: `Found on ${platform} social media platform`,
  };
};

// Helper function to determine data types for webpages with improved social media detection
export const getDataTypesForWebpage = (domain: string, description: string, url: string = ''): string[] => {
  const dataTypes: string[] = [];
  const lowerDescription = description.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  // Enhanced social media detection - check URL and description content
  const socialMediaPatterns = [
    { platforms: ['linkedin'], types: ['Professional Profile', 'LinkedIn Profile'] },
    { platforms: ['facebook'], types: ['Social Media Profile', 'Facebook Profile'] },
    { platforms: ['twitter', 'x.com'], types: ['Social Media Profile', 'Twitter Profile'] },
    { platforms: ['instagram'], types: ['Social Media Profile', 'Instagram Profile'] },
    { platforms: ['tiktok'], types: ['Social Media Profile', 'TikTok Profile'] },
    { platforms: ['youtube'], types: ['Social Media Profile', 'YouTube Profile'] },
    { platforms: ['snapchat'], types: ['Social Media Profile', 'Snapchat Profile'] },
    { platforms: ['pinterest'], types: ['Social Media Profile', 'Pinterest Profile'] }
  ];
  
  let isSocialMedia = false;
  
  // Check if this is a social media result by examining URL and description
  for (const pattern of socialMediaPatterns) {
    const foundInDomain = pattern.platforms.some(platform => domain.includes(platform));
    const foundInUrl = pattern.platforms.some(platform => lowerUrl.includes(platform));
    const foundInDescription = pattern.platforms.some(platform => lowerDescription.includes(platform));
    
    if (foundInDomain || foundInUrl || foundInDescription) {
      dataTypes.push(...pattern.types);
      isSocialMedia = true;
      break;
    }
  }
  
  // If not social media, categorize as other types
  if (!isSocialMedia) {
    if (domain.includes('researchgate') || domain.includes('academia') || lowerDescription.includes('research')) {
      dataTypes.push('Academic Profile', 'Research Publications');
    } else if (domain.includes('university') || domain.includes('edu') || lowerDescription.includes('university')) {
      dataTypes.push('Academic Information', 'Educational Background');
    } else if (domain.includes('directory') || lowerDescription.includes('directory')) {
      dataTypes.push('Directory Listing', 'Contact Information');
    } else if (domain.includes('zoominfo') || domain.includes('whitepages') || lowerDescription.includes('business directory')) {
      dataTypes.push('Business Directory', 'Contact Information');
    } else if (domain.includes('ratemyprofessors') || lowerDescription.includes('professor rating')) {
      dataTypes.push('Public Reviews', 'Professional Information');
    } else if (domain.includes('news') || lowerDescription.includes('news')) {
      dataTypes.push('News Article', 'Public Mention');
    } else {
      dataTypes.push('Public Profile', 'Web Presence');
    }
  }
  
  // Always add general categories
  dataTypes.push('Personal Information');
  
  return [...new Set(dataTypes)]; // Remove duplicates
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