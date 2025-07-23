import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackendAnalysisResponse } from '@/lib/api';
import { ArrowLeft, Download, Share, AlertTriangle, Shield, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { searchApi, handleApiError } from '@/lib/api';

const DetailedResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<BackendAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const state = location.state;
        if (!state?.query) {
          console.error('Missing query in location state:', state);
          navigate('/');
          return;
        }

        // Check if we have either URLs or social media selected
        const selectedUrls = state?.selectedUrls || [];
        const selectedSocial = state?.selectedSocial || [];
        
        if (selectedUrls.length === 0 && selectedSocial.length === 0) {
          console.error('No URLs or social media selected');
          navigate('/results');
          return;
        }

        console.log('Fetching analysis data for:', {
          query: state.query,
          selectedUrls,
          selectedSocial,
          urlCount: selectedUrls.length,
          socialCount: selectedSocial.length
        });

        // Call the extract API endpoint with both URLs and social media
        const analysisResponse = await searchApi.extractDetails(
          state.query, 
          selectedUrls, 
          selectedSocial
        );
        
        console.log('Analysis response received:', analysisResponse);
        
        // Check if response indicates no data found
        if (analysisResponse.message && analysisResponse.suggestions) {
          setHasError(true);
        }
        
        setAnalysisData(analysisResponse);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        handleApiError(error as Error);
        setIsLoading(false);
        setHasError(true);
        
        toast({
          title: 'Analysis Failed',
          description: 'Unable to load detailed analysis. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchAnalysisData();
  }, [location.state, navigate]);

  // Helper function to get risk level color
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'very high': return 'bg-red-100 text-red-600';
      case 'high': return 'bg-orange-100 text-orange-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      case 'very low': return 'bg-green-100 text-green-600';
      case 'no risk': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Helper function to count total PII items from backend response
  const getTotalPIIItems = (data: BackendAnalysisResponse) => {
    const piiKeys: (keyof BackendAnalysisResponse)[] = [
      'Name', 'Location', 'Email', 'Phone', 'DOB', 'Address', 'Gender', 'Employer',
      'Education', 'Birth Place', 'Personal Cell', 'Business Phone', 'Facebook Account',
      'Twitter Account', 'Instagram Account', 'LinkedIn Account', 'TikTok Account',
      'YouTube Account', 'DDL', 'Passport', 'Credit Card', 'SSN', 'Family Members',
      'Occupation', 'Salary', 'Website'
    ];
    
    return piiKeys.reduce((total, key) => {
      const value = data[key];
      return total + (Array.isArray(value) ? value.length : 0);
    }, 0);
  };

  const handleExportReport = () => {
    if (!analysisData) return;
    
    // Create downloadable report
    const reportData = {
      query: location.state?.query,
      analysis_date: new Date().toISOString(),
      risk_assessment: {
        risk_score: analysisData.risk_score,
        risk_level: analysisData.risk_level,
        risk_analysis: analysisData.risk_analysis
      },
      pii_data: analysisData,
      recommendations: analysisData.recommendations,
      extraction_summary: analysisData.extraction_summary
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `privacy_analysis_${location.state?.query}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast({
      title: 'Report Downloaded',
      description: 'Detailed privacy assessment report has been downloaded.',
    });
  };

  const handleShareResults = async () => {
    try {
      const shareData = {
        title: `Privacy Assessment Results for ${location.state?.query}`,
        text: `Privacy Risk Level: ${analysisData?.risk_level} (Score: ${analysisData?.risk_score})`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
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
                Extracting PII data and calculating privacy risk...
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

  // Handle error cases (no data found)
  if (hasError && analysisData.message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-xl font-semibold mb-2">No Relevant Data Found</h3>
            <p className="text-muted-foreground mb-6">
              {analysisData.message}
            </p>
            
            {analysisData.suggestions && (
              <div className="max-w-md mx-auto text-left mb-6">
                <h4 className="font-semibold mb-2">Suggestions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysisData.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisData.extraction_summary && (
              <div className="text-sm text-muted-foreground mb-6">
                <p>Processed {analysisData.extraction_summary.total_sources} sources in {analysisData.extraction_summary.extraction_time}s</p>
                <p>{analysisData.extraction_summary.successful_extractions} successful, {analysisData.extraction_summary.failed_extractions} failed</p>
              </div>
            )}
            
            <div className="space-x-4">
              <Button onClick={() => navigate('/results')}>
                Try Different Sources
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                New Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPIIItems = getTotalPIIItems(analysisData);

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
                  Analysis for "{location.state?.query}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Risk Score: {analysisData.risk_score}/15
              </Badge>
              <Badge className={getRiskLevelColor(analysisData.risk_level)}>
                {analysisData.risk_level}
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
          {/* Quick Stats - Updated to use actual backend data */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {analysisData.extraction_summary?.total_sources || 0}
                    </p>
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
                    <p className="text-2xl font-bold">{totalPIIItems}</p>
                    <p className="text-sm text-muted-foreground">PII Items Found</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${getRiskLevelColor(analysisData.risk_level)}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analysisData.risk_level}</p>
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
                    <p className="text-2xl font-bold">{analysisData.risk_score}/15</p>
                    <p className="text-sm text-muted-foreground">Risk Score</p>
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
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Processing Summary</h4>
                        <p className="text-sm text-muted-foreground">
                          Analyzed {analysisData.extraction_summary?.total_sources} sources 
                          ({analysisData.extraction_summary?.webpage_sources} webpages, 
                          {analysisData.extraction_summary?.social_media_sources} social media) 
                          in {analysisData.extraction_summary?.extraction_time}s
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Risk Analysis</h4>
                        <div className="space-y-1">
                          {Object.entries(analysisData.risk_analysis || {}).map(([category, findings]) => (
                            <p key={category} className="text-sm">
                              <span className="font-medium">{category}:</span> {findings}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pii-data" className="mt-6">
              <div className="space-y-4">
                {Object.entries(analysisData).map(([key, value]) => {
                  // Only show PII categories (arrays with data)
                  if (Array.isArray(value) && value.length > 0) {
                    return (
                      <Card key={key}>
                        <CardHeader>
                          <CardTitle className="text-lg">{key}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {value.map((item, index) => (
                              <Badge key={index} variant="secondary" className="mr-2 mb-2">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                })}
              </div>
            </TabsContent>

            <TabsContent value="risk-assessment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Overall Risk Score:</span>
                      <Badge className={getRiskLevelColor(analysisData.risk_level)}>
                        {analysisData.risk_score}/15 ({analysisData.risk_level})
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(analysisData.risk_analysis || {}).map(([category, findings]) => (
                        <div key={category}>
                          <h4 className="font-semibold text-sm">{category}</h4>
                          <p className="text-sm text-muted-foreground">{findings}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisData.recommendations?.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DetailedResults;