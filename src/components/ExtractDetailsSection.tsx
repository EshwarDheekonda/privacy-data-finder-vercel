import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useResults } from '@/contexts/ResultsContext';
import { SearchResult, searchApi } from '@/lib/api';
import { Search, ArrowRight, Database, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExtractDetailsSectionProps {
  searchQuery: string;
  allResults: SearchResult[];
}

export const ExtractDetailsSection = ({ searchQuery, allResults }: ExtractDetailsSectionProps) => {
  const { selectedCount, getSelectedResults } = useResults();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleExtractDetails = async () => {
    if (selectedCount === 0) {
      toast({
        title: 'No Results Selected',
        description: 'Please select at least one result to extract details.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);

    try {
      const selectedResults = getSelectedResults(allResults);
      const selectedUrls = selectedResults.map(result => result.source);
      
      // Separate social media and regular URLs
      const selectedSocial = selectedResults.filter(result => 
        result.id.startsWith('social-') && !result.id.includes('webpage')
      );
      const regularUrls = selectedResults.filter(result => 
        !result.id.startsWith('social-') || result.id.includes('webpage')
      ).map(result => result.source);

      console.log('Extracting details for:', {
        searchQuery,
        selectedCount: selectedResults.length,
        selectedUrls,
        selectedSocial,
        regularUrls
      });

      await searchApi.extractDetails(searchQuery, regularUrls, selectedSocial);

      toast({
        title: 'Analysis Complete',
        description: `Processing completed for ${selectedCount} selected result${selectedCount > 1 ? 's' : ''}.`,
      });

      // Navigate to detailed results page with correct data structure
      navigate('/detailed-results', {
        state: {
          query: searchQuery,
          selectedUrls: regularUrls,
          selectedSocial: selectedSocial,
          selectedResults: selectedResults
        }
      });

    } catch (error) {
      console.error('Extract details error:', error);
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'Failed to start extraction process.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const getButtonText = () => {
    if (isExtracting) return 'Processing...';
    if (selectedCount === 0) return 'Select Results to Extract Details';
    if (isHovered) return 'Deep scan → Content analysis → Risk assessment → Generate report';
    return `Extract Details (${selectedCount} selected)`;
  };

  const getButtonIcon = () => {
    if (isExtracting) return <Database className="w-6 h-6 animate-pulse" />;
    if (isHovered) return <ArrowRight className="w-6 h-6" />;
    return <Search className="w-6 h-6" />;
  };

  // Only show when there are results
  if (!allResults || allResults.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 mb-8">
      <div className="glass-card p-8 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Ready for Deep Analysis?</h3>
            <p className="text-muted-foreground">
              Select the results you want to analyze and extract detailed privacy information
            </p>
          </div>

          {selectedCount > 0 && (
            <div className="flex justify-center">
              <Badge variant="outline" className="px-4 py-2 text-base">
                {selectedCount} result{selectedCount > 1 ? 's' : ''} selected
              </Badge>
            </div>
          )}

          <Button
            onClick={handleExtractDetails}
            disabled={selectedCount === 0 || isExtracting}
            size="lg"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-16 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-w-[400px]"
          >
            <div className="flex items-center gap-4">
              {getButtonIcon()}
              <span className="transition-all duration-300">
                {getButtonText()}
              </span>
            </div>
          </Button>

          {isHovered && selectedCount > 0 && !isExtracting && (
            <div className="animate-fade-in mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span>Deep Scan</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Content Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span>Risk Assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Generate Report</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
