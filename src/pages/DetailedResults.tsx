
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailedAnalysisResponse } from '@/types/analysis';
import { AnalysisOverview } from '@/components/analysis/AnalysisOverview';
import { PIIDataSection } from '@/components/analysis/PIIDataSection';
import { RiskAssessmentSection } from '@/components/analysis/RiskAssessmentSection';
import { RecommendationsSection } from '@/components/analysis/RecommendationsSection';
import { DetailedResultCard } from '@/components/analysis/DetailedResultCard';
import { ArrowLeft, Download, Share, AlertTriangle, Shield, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { searchApi, handleApiError } from '@/lib/api';

const DetailedResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<DetailedAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const state = location.state;
        if (!state?.query || !state?.selectedUrls) {
          console.error('Missing required data in location state:', state);
          navigate('/');
          return;
        }

        console.log('Fetching analysis data for:', {
          query: state.query,
          selectedUrls: state.selectedUrls,
          urlCount: state.selectedUrls.length
        });

        // Call the extract API endpoint with the selected URLs
        const analysisResponse = await searchApi.extractDetails(state.query, state.selectedUrls);
        
        console.log('Analysis response received:', analysisResponse);
        
        // Set the analysis data from the API response
        setAnalysisData(analysisResponse);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        handleApiError(error as Error);
        setIsLoading(false);
        
        // Show error toast and redirect
        toast({
          title: 'Analysis Failed',
          description: 'Unable to load detailed analysis. Please try again.',
          variant: 'destructive',
        });
        
        // Redirect back to results after a delay
        setTimeout(() => {
          navigate('/results');
        }, 2000);
      }
    };

    fetchAnalysisData();
  }, [location.state, navigate]);

  const handleExportReport = () => {
    if (!analysisData) return;
    
    toast({
      title: 'Report Generated',
      description: 'Detailed privacy assessment report has been downloaded.',
    });
  };

  const handleShareResults = async () => {
    try {
      const shareData = {
        title: `Privacy Assessment Results for ${analysisData?.query}`,
        text: `Comprehensive PII risk analysis completed`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        toast({
          title: 'Link Copied',
          description: 'Results link copied to clipboard.',
        });
      }
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Unable to share results.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <h3 className="text-xl font-semibold">Processing Analysis Results</h3>
              <p className="text-muted-foreground">
                Generating comprehensive privacy assessment report...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Analysis Data Found</h3>
            <p className="text-muted-foreground mb-6">
              Unable to load the detailed analysis results.
            </p>
            <Button onClick={() => navigate('/')}>
              Return to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/results')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Results
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">Detailed Privacy Analysis</h1>
                <p className="text-sm text-muted-foreground">
                  Analysis for "{analysisData.query}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Privacy Score: {analysisData.summary.privacy_score}/10
              </Badge>
              <Button variant="outline" onClick={handleShareResults}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analysisData.total_processed}</p>
                    <p className="text-sm text-muted-foreground">Sources Analyzed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analysisData.summary.total_pii_items}</p>
                    <p className="text-sm text-muted-foreground">PII Items Found</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    analysisData.summary.highest_risk_level === 'critical' ? 'bg-red-100' :
                    analysisData.summary.highest_risk_level === 'high' ? 'bg-orange-100' :
                    analysisData.summary.highest_risk_level === 'medium' ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                    <Shield className={`w-6 h-6 ${
                      analysisData.summary.highest_risk_level === 'critical' ? 'text-red-600' :
                      analysisData.summary.highest_risk_level === 'high' ? 'text-orange-600' :
                      analysisData.summary.highest_risk_level === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold capitalize">{analysisData.summary.highest_risk_level}</p>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analysisData.summary.privacy_score.toFixed(1)}/10</p>
                    <p className="text-sm text-muted-foreground">Privacy Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pii-data">PII Data</TabsTrigger>
              <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <AnalysisOverview data={analysisData} />
            </TabsContent>

            <TabsContent value="pii-data" className="mt-6">
              <PIIDataSection results={analysisData.results} />
            </TabsContent>

            <TabsContent value="risk-assessment" className="mt-6">
              <RiskAssessmentSection results={analysisData.results} />
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              <RecommendationsSection 
                globalRecommendations={analysisData.global_recommendations}
                immediateActions={analysisData.immediate_actions}
                results={analysisData.results}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DetailedResults;
