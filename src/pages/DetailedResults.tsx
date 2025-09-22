import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackendAnalysisResponse, searchApi, handleApiError } from '@/lib/api';
import { RISK_LEVEL_COLORS, PII_CATEGORIES, PLATFORM_COLORS } from '@/types/enhanced-backend';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';
import { ArrowLeft, Download, Share, AlertTriangle, Shield, Eye, Globe, Users, FileText, Settings, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const DetailedResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<BackendAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState('executive');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const state = location.state;
        console.log('DetailedResults received state:', state);
        
        if (!state?.query) {
          console.error('Missing query in location state:', state);
          navigate('/');
          return;
        }

        // Check if we have either URLs or social media selected
        const selectedUrls = state?.selectedUrls || [];
        const selectedSocial = state?.selectedSocial || [];
        
        console.log('Data check:', {
          selectedUrls,
          selectedSocial,
          urlsLength: selectedUrls.length,
          socialLength: selectedSocial.length
        });
        
        if (selectedUrls.length === 0 && selectedSocial.length === 0) {
          console.error('No URLs or social media selected - redirecting to results');
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
    // Use the pii_summary if available, otherwise calculate manually
    if (data.pii_summary?.total_items) {
      return data.pii_summary.total_items;
    }
    
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
          {/* Enhanced Stats Dashboard */}
          <StatsCards data={analysisData} />

          {/* Enhanced Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 text-xs">
              <TabsTrigger value="executive">Executive</TabsTrigger>
              <TabsTrigger value="data-discovery">Data Discovery</TabsTrigger>
              <TabsTrigger value="source-analysis">Source Analysis</TabsTrigger>
              <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="export">Export & Share</TabsTrigger>
            </TabsList>

            {/* Tab 1: Executive Summary */}
            <TabsContent value="executive" className="mt-6">
              <ExecutiveSummary data={analysisData} />
            </TabsContent>

            {/* Tab 2: Data Discovery */}
            <TabsContent value="data-discovery" className="mt-6">
              <div className="space-y-6">
                {/* High-Risk Data Section */}
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      High-Risk Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PII_CATEGORIES.sensitive_docs.map(category => {
                        const data = analysisData[category as keyof BackendAnalysisResponse];
                        if (Array.isArray(data) && data.length > 0) {
                          return (
                            <Card key={category} className="bg-red-50 border-red-200">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-red-700 mb-2">{category}</h4>
                                <div className="space-y-1">
                                  {data.map((item, index) => (
                                    <Badge key={index} variant="destructive" className="mr-2 mb-1">
                                      {category === 'SSN' || category === 'Credit Card' ? '***MASKED***' : item}
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
                  </CardContent>
                </Card>

                {/* Personal Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...PII_CATEGORIES.personal, ...PII_CATEGORIES.contact].map(category => {
                        const data = analysisData[category as keyof BackendAnalysisResponse];
                        if (Array.isArray(data) && data.length > 0) {
                          return (
                            <Card key={category} className="bg-blue-50 border-blue-200">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-blue-700 mb-2">{category}</h4>
                                <div className="space-y-1">
                                  {data.map((item, index) => (
                                    <Badge key={index} className="bg-blue-100 text-blue-700 mr-2 mb-1">
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
                  </CardContent>
                </Card>

                {/* Professional Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PII_CATEGORIES.professional.map(category => {
                        const data = analysisData[category as keyof BackendAnalysisResponse];
                        if (Array.isArray(data) && data.length > 0) {
                          return (
                            <Card key={category} className="bg-green-50 border-green-200">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-green-700 mb-2">{category}</h4>
                                <div className="space-y-1">
                                  {data.map((item, index) => (
                                    <Badge key={index} className="bg-green-100 text-green-700 mr-2 mb-1">
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
                  </CardContent>
                </Card>

                {/* Social Media Presence Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Social Media Presence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {PII_CATEGORIES.social_media.map(category => {
                        const data = analysisData[category as keyof BackendAnalysisResponse];
                        const platform = category.split(' ')[0].toLowerCase();
                        if (Array.isArray(data) && data.length > 0) {
                          return (
                            <Card key={category} className="bg-purple-50 border-purple-200">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-purple-700 mb-2">{category}</h4>
                                <div className="space-y-1">
                                  {data.map((item, index) => (
                                    <Badge key={index} className="bg-purple-100 text-purple-700 mr-2 mb-1">
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 3: Source Analysis - Coming Soon */}
            <TabsContent value="source-analysis" className="mt-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Source Analysis</h3>
                  <p className="text-muted-foreground">
                    Detailed breakdown of all processed sources coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Risk Assessment */}
            <TabsContent value="risk-assessment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Overall Risk Score</h4>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold text-primary">
                            {analysisData.risk_score}
                          </div>
                          <div>
                            <Badge className={getRiskLevelColor(analysisData.risk_level)}>
                              {analysisData.risk_level}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Out of 15 possible points
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Risk Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(analysisData.risk_analysis || {}).map(([category, findings]) => (
                            <div key={category} className="text-sm">
                              <span className="font-medium text-primary">{category}:</span>
                              <p className="text-muted-foreground mt-1">{findings}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Recommendations */}
            <TabsContent value="recommendations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                      analysisData.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{recommendation}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No specific recommendations available at this time.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 6: Technical Details - Coming Soon */}
            <TabsContent value="technical" className="mt-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Technical Details</h3>
                  <p className="text-muted-foreground">
                    Extraction performance metrics and technical analysis coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 7: Export & Sharing - Coming Soon */}
            <TabsContent value="export" className="mt-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <Share className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Export & Sharing</h3>
                  <p className="text-muted-foreground mb-6">
                    Advanced export options and sharing features coming soon.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleExportReport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON Report
                    </Button>
                    <Button variant="outline" onClick={handleShareResults}>
                      <Share className="w-4 h-4 mr-2" />
                      Share Results
                    </Button>
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