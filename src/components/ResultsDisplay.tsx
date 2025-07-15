import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SearchResult, SearchResponse } from '@/lib/api';
import { ResultCard } from './ResultCard';
import { SelectionControls } from './SelectionControls';
import { ResultsFilters, FilterState } from './ResultsFilters';
import { Globe, Users, Search } from 'lucide-react';

interface ResultsDisplayProps {
  searchResponse: SearchResponse;
}

export const ResultsDisplay = ({ searchResponse }: ResultsDisplayProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<FilterState>({
    platforms: [],
    riskLevels: [],
    domains: [],
  });

  // Debug logging
  console.log('ResultsDisplay received:', {
    searchResponse,
    totalResults: searchResponse?.total_results,
    resultsArray: searchResponse?.results,
    resultsCount: searchResponse?.results?.length,
    firstResult: searchResponse?.results?.[0]
  });

  // Helper functions for categorization
  const isSocialMediaDomain = (url: string): boolean => {
    if (!url) return false;
    const socialDomains = ['linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com', 'youtube.com'];
    return socialDomains.some(domain => url.toLowerCase().includes(domain));
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url || 'unknown';
    }
  };

  // Simplified categorization based on domain analysis
  const categorizedResults = useMemo(() => {
    const webResults: SearchResult[] = [];
    const socialResults: SearchResult[] = [];

    if (!searchResponse?.results || !Array.isArray(searchResponse.results)) {
      console.warn('No results array found:', searchResponse);
      return { webResults, socialResults };
    }

    console.log(`📋 Categorizing ${searchResponse.results.length} results`);

    searchResponse.results.forEach((result, index) => {
      // Updated categorization logic to match new ID format
      const isSocialMedia = result.id.startsWith('social-') || 
                           result.id.startsWith('social-webpage-') ||
                           (result.source && isSocialMediaDomain(result.source));

      if (isSocialMedia) {
        socialResults.push(result);
        console.log(`👥 SOCIAL: ${result.name} (${getDomainFromUrl(result.source)}) [ID: ${result.id}]`);
      } else {
        webResults.push(result);
        console.log(`🌐 WEB: ${result.name} (${getDomainFromUrl(result.source)}) [ID: ${result.id}]`);
      }
    });

    console.log(`📊 Categorization complete: ${webResults.length} web, ${socialResults.length} social (Total: ${webResults.length + socialResults.length})`);
    return { webResults, socialResults };
  }, [searchResponse?.results]);

  // Apply filters
  const filterResults = (results: SearchResult[]): SearchResult[] => {
    if (!results || !Array.isArray(results)) return [];
    
    console.log(`🔍 Filtering ${results.length} results with filters:`, filters);
    
    return results.filter(result => {
      // Platform filter - when no platforms selected, show all
      if (filters.platforms.length > 0 && !filters.platforms.includes(result.source)) {
        console.log(`❌ Platform filter excluded: ${result.name}`);
        return false;
      }

      // Risk level filter - when no risk levels selected, show all
      if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(result.risk_level)) {
        console.log(`❌ Risk level filter excluded: ${result.name} (${result.risk_level})`);
        return false;
      }

      // Domain filter - when no domains selected, show all
      if (filters.domains.length > 0) {
        try {
          const domain = new URL(result.source).hostname;
          if (!filters.domains.includes(domain)) {
            console.log(`❌ Domain filter excluded: ${result.name} (${domain})`);
            return false;
          }
        } catch {
          if (!filters.domains.includes(result.source)) {
            console.log(`❌ Domain filter excluded: ${result.name} (invalid URL)`);
            return false;
          }
        }
      }

      console.log(`✅ Filter passed: ${result.name}`);
      return true;
    });
  };

  const filteredWebResults = filterResults(categorizedResults.webResults);
  const filteredSocialResults = filterResults(categorizedResults.socialResults);
  const filteredAllResults = filterResults(searchResponse?.results || []);

  const getCurrentResults = () => {
    switch (activeTab) {
      case 'web':
        return filteredWebResults;
      case 'social':
        return filteredSocialResults;
      default:
        return filteredAllResults;
    }
  };

  const currentResults = getCurrentResults();

  // Handle zero results case
  if (!searchResponse.results || searchResponse.results.length === 0) {
    return (
      <div className="space-y-6">
        {/* Search Summary */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Privacy Assessment Results</h2>
            <Badge variant="outline" className="text-sm">
              Scan completed in {searchResponse.scan_time}s
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span>Query: <span className="font-medium">{searchResponse.query}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>Total Results: <span className="font-medium">0</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Timestamp: <span className="font-medium">{new Date(searchResponse.timestamp).toLocaleString()}</span></span>
            </div>
          </div>
        </div>

        {/* No Results Message */}
        <div className="glass-card p-12 text-center">
          <Search className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Privacy Data Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We couldn't find any publicly available information about "{searchResponse.query}". 
            This might indicate good privacy practices or the person may not have a significant online presence.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Try searching with:</p>
            <ul className="mt-2 space-y-1">
              <li>• Full name with middle initial</li>
              <li>• Professional email address</li>
              <li>• Social media usernames</li>
              <li>• Alternative name spellings</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Privacy Assessment Results</h2>
          <Badge variant="outline" className="text-sm">
            Scan completed in {searchResponse.scan_time}s
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span>Query: <span className="font-medium">{searchResponse.query}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span>Total Results: <span className="font-medium">{searchResponse.results.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>Timestamp: <span className="font-medium">{new Date(searchResponse.timestamp).toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ResultsFilters results={searchResponse.results} onFilterChange={setFilters} />

      {/* Selection Controls */}
      <SelectionControls results={currentResults} totalCount={searchResponse.results.length} />

      {/* Categorized Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            All Results
            <Badge variant="secondary" className="ml-1">
              {filteredAllResults.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="web" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Web Results
            <Badge variant="secondary" className="ml-1">
              {filteredWebResults.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Social Media
            <Badge variant="secondary" className="ml-1">
              {filteredSocialResults.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4">
            {filteredAllResults.map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
            {filteredAllResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results match the current filters.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="web" className="mt-6">
          <div className="grid gap-4">
            {filteredWebResults.map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
            {filteredWebResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No web results match the current filters.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <div className="grid gap-4">
            {filteredSocialResults.map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
            {filteredSocialResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No social media results match the current filters.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};