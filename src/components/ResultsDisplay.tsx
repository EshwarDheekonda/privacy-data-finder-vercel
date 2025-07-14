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
    confidenceRange: [0, 100],
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

  // Categorize results
  const categorizedResults = useMemo(() => {
    const socialMediaPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'youtube'];
    
    const webResults: SearchResult[] = [];
    const socialResults: SearchResult[] = [];

    // Safeguard against undefined results
    if (!searchResponse?.results || !Array.isArray(searchResponse.results)) {
      return { webResults, socialResults };
    }

    searchResponse.results.forEach(result => {
      const source = result.source.toLowerCase();
      const isSocial = socialMediaPlatforms.some(platform => 
        source.includes(platform) || result.data_types.some(type => 
          type.toLowerCase().includes('social')
        )
      );

      if (isSocial) {
        socialResults.push(result);
      } else {
        webResults.push(result);
      }
    });

    return { webResults, socialResults };
  }, [searchResponse?.results]);

  // Apply filters
  const filterResults = (results: SearchResult[]): SearchResult[] => {
    if (!results || !Array.isArray(results)) return [];
    return results.filter(result => {
      // Platform filter
      if (filters.platforms.length > 0 && !filters.platforms.includes(result.source)) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(result.risk_level)) {
        return false;
      }

      // Confidence range filter
      const confidence = Math.round(result.confidence * 100);
      if (confidence < filters.confidenceRange[0] || confidence > filters.confidenceRange[1]) {
        return false;
      }

      // Domain filter
      if (filters.domains.length > 0) {
        try {
          const domain = new URL(result.source).hostname;
          if (!filters.domains.includes(domain)) {
            return false;
          }
        } catch {
          if (!filters.domains.includes(result.source)) {
            return false;
          }
        }
      }

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
            <span>Total Results: <span className="font-medium">{searchResponse.total_results}</span></span>
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
      <SelectionControls results={currentResults} totalCount={searchResponse.total_results} />

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