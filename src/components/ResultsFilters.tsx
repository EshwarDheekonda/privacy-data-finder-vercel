import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { SearchResult } from '@/lib/api';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface ResultsFiltersProps {
  results: SearchResult[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  platforms: string[];
  riskLevels: SearchResult['risk_level'][];
  domains: string[];
}

export const ResultsFilters = ({ results, onFilterChange }: ResultsFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    platforms: [],
    riskLevels: [],
    domains: [],
  });

  // Extract unique values from results
  const uniquePlatforms = [...new Set((results || []).map(r => r.source))];
  const uniqueDomains = [...new Set((results || []).map(r => {
    try {
      return new URL(r.source).hostname;
    } catch {
      return r.source;
    }
  }))];
  const riskLevels: SearchResult['risk_level'][] = ['low', 'medium', 'high', 'critical'];

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const togglePlatform = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    updateFilters({ platforms: newPlatforms });
  };

  const toggleRiskLevel = (riskLevel: SearchResult['risk_level']) => {
    const newRiskLevels = filters.riskLevels.includes(riskLevel)
      ? filters.riskLevels.filter(r => r !== riskLevel)
      : [...filters.riskLevels, riskLevel];
    updateFilters({ riskLevels: newRiskLevels });
  };

  const toggleDomain = (domain: string) => {
    const newDomains = filters.domains.includes(domain)
      ? filters.domains.filter(d => d !== domain)
      : [...filters.domains, domain];
    updateFilters({ domains: newDomains });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      platforms: [],
      riskLevels: [],
      domains: [],
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = 
    filters.platforms.length + 
    filters.riskLevels.length + 
    filters.domains.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Filter */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Platform</Label>
              <div className="space-y-2">
                {uniquePlatforms.map(platform => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={filters.platforms.includes(platform)}
                      onCheckedChange={() => togglePlatform(platform)}
                    />
                    <Label
                      htmlFor={`platform-${platform}`}
                      className="text-sm cursor-pointer"
                    >
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Level Filter */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Risk Level</Label>
              <div className="space-y-2">
                {riskLevels.map(riskLevel => (
                  <div key={riskLevel} className="flex items-center space-x-2">
                    <Checkbox
                      id={`risk-${riskLevel}`}
                      checked={filters.riskLevels.includes(riskLevel)}
                      onCheckedChange={() => toggleRiskLevel(riskLevel)}
                    />
                    <Label
                      htmlFor={`risk-${riskLevel}`}
                      className="text-sm cursor-pointer capitalize"
                    >
                      {riskLevel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Domain Filter */}
            {uniqueDomains.length > 1 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Domain</Label>
                <div className="space-y-2">
                  {uniqueDomains.map(domain => (
                    <div key={domain} className="flex items-center space-x-2">
                      <Checkbox
                        id={`domain-${domain}`}
                        checked={filters.domains.includes(domain)}
                        onCheckedChange={() => toggleDomain(domain)}
                      />
                      <Label
                        htmlFor={`domain-${domain}`}
                        className="text-sm cursor-pointer"
                      >
                        {domain}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};