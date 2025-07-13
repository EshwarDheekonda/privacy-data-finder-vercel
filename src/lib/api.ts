import { toast } from '@/hooks/use-toast';

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// TypeScript Interfaces
export interface SearchResult {
  id: string;
  name: string;
  source: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  data_types: string[];
  found_at: string;
  confidence: number;
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
   * Search for privacy risks associated with a name
   */
  async searchByName(searchName: string): Promise<SearchResponse> {
    if (!searchName.trim()) {
      throw new SearchApiError('Search name cannot be empty');
    }

    try {
      const url = new URL('/search', API_BASE_URL);
      url.searchParams.append('searchName', searchName.trim());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SearchApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || `HTTP_${response.status}`,
          errorData
        );
      }

      const data: SearchResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof SearchApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new SearchApiError(
          'Unable to connect to the privacy assessment service. Please check your internet connection and try again.',
          'NETWORK_ERROR'
        );
      }

      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new SearchApiError(
          'The search request timed out. Please try again.',
          'TIMEOUT_ERROR'
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
      case 'TIMEOUT_ERROR':
        toast({
          title: 'Request Timeout',
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