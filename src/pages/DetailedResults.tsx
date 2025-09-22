import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Download, Share, AlertTriangle, Shield, Eye, Clock, 
  TrendingUp, Database, CheckCircle, XCircle, Globe, Users, 
  Briefcase, GraduationCap, Heart, CreditCard, Phone, Mail,
  MapPin, Calendar, Building, Award, AlertCircle, Info,
  BarChart3, PieChart, Activity, Settings, FileText, Link2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { searchApi, handleApiError } from '@/lib/api';

// Enhanced interfaces for the new backend response
interface ExtractionDetail {
  source: string;
  type: "webpage" | "social_media" | string;
  status: "success" | "failed" | "no_relevant_content" | "error";
  data_points: number;
  platform: string;
  scraper_used: "apify" | "fallback" | "failed" | "error";
  username?: string;
  error?: string;
}

interface ScrapingPerformance {
  apify_used: number;
  fallback_used: number;
  total_failed: number;
  apify_available: boolean;
  apify_stats?: Record<string, any>;
  optimization_applied: boolean;
  concurrent_processing: boolean;
  concurrent_fetch_limit?: number;
  concurrent_gpt_limit?: number;
}

interface PIISummary {
  total_items: number;
  categories_found: number;
  sensitive_items: number;
  non_sensitive_items: number;
  categories_breakdown: {
    names: number;
    emails: number;
    phones: number;
    addresses: number;
    locations: number;
    employers: number;
    education: number;
    social_media: number;
    sensitive_docs: number;
  };
}

interface ExtractionSummary {
  total_sources: number;
  webpage_sources: number;
  social_media_sources: number;
  successful_extractions: number;
  failed_extractions: number;
  total_pii_found: number;
  pii_categories_found: number;
  data_points_extracted: number;
  extraction_time: number;
  extraction_details: ExtractionDetail[];
  scraping_performance: ScrapingPerformance;
}

interface EnhancedAnalysisResponse {
  // Core PII Data
  Name: string[];
  Location: string[];
  Email: string[];
  Phone: string[];
  DOB: string[];
  Address: string[];
  Gender: string[];
  Employer: string[];
  Education: string[];
  "Birth Place": string[];
  "Personal Cell": string[];
  "Business Phone": string[];
  "Facebook Account": string[];
  "Twitter Account": string[];
  "Instagram Account": string[];
  "LinkedIn Account": string[];
  "TikTok Account": string[];
  "YouTube Account": string[];
  DDL: string[];
  Passport: string[];
  "Credit Card": string[];
  SSN: string[];
  "Family Members": string[];
  Occupation: string[];
  Salary: string[];
  Website: string[];

  // Risk Assessment
  risk_score: number;
  risk_level: string;
  risk_analysis: Record<string, string>;
  recommendations: string[];

  // Enhanced Metadata
  query: string;
  timestamp: string;
  message: string;
  suggestions: string[];
  extraction_summary: ExtractionSummary;
  pii_summary?: PIISummary;
  pii_preview?: Record<string, string[]>;
  debug_pii_data?: Record<string, string[]> | string;
}

const DetailedResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<EnhancedAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState('executive-summary');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const state = location.state;
        
        if (!state?.query) {
          navigate('/');
          return;
        }

        const selectedUrls = state?.selectedUrls || [];
        const selectedSocial = state?.selectedSocial || [];
        
        if (selectedUrls.length === 0 && selectedSocial.length === 0) {
          navigate('/results');
          return;
        }

        const analysisResponse = await searchApi.extractDetails(
          state.query, 
          selectedUrls, 
          selectedSocial
        );
        
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

  // Helper functions
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'very high': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      case 'very low': return 'bg-green-50 text-green-600 border-green-200';
      case 'no risk': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getSuccessRate = (summary: ExtractionSummary) => {
    if (summary.total_sources === 0) return 0;
    return Math.round((summary.successful_extractions / summary.total_sources) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'facebook': return <Users className="w-4 h-4 text-blue-600" />;
      case 'twitter': return <Globe className="w-4 h-4 text-sky-600" />;
      case 'instagram': return <Heart className="w-4 h-4 text-purple-600" />;
      default: return <Globe className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'Name': <Users className="w-4 h-4" />,
      'Email': <Mail className="w-4 h-4" />,
      'Phone': <Phone className="w-4 h-4" />,
      'Address': <MapPin className="w-4 h-4" />,
      'DOB': <Calendar className="w-4 h-4" />,
      'Employer': <Building className="w-4 h-4" />,
      'Education': <GraduationCap className="w-4 h-4" />,
      'SSN': <CreditCard className="w-4 h-4" />,
      'Credit Card': <CreditCard className="w-4 h-4" />,
    };
    return iconMap[category] || <Info className="w-4 h-4" />;
  };

  const categorizedPII = {
    sensitive: ['SSN', 'Credit Card', 'Passport', 'DDL'],
    personal: ['Name', 'DOB', 'Address', 'Phone', 'Email', 'Personal Cell'],
    professional: ['Employer', 'Occupation', 'Education', 'Salary', 'Business Phone'],
    social: ['Facebook Account', 'Twitter Account', 'Instagram Account', 'LinkedIn Account', 'TikTok Account', 'YouTube Account'],
    family: ['Family Members', 'Birth Place']
  };

  const handleExportReport = () => {
    if (!analysisData) return;
    
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

  if (!analysisData || hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-xl font-semibold mb-2">Analysis Results</h3>
            <p className="text-muted-foreground mb-6">
              {analysisData?.message || "Unable to load the detailed analysis results."}
            </p>
            
            {analysisData?.suggestions && (
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

  const totalPIIItems = analysisData.pii_summary?.total_items || 
    Object.values(analysisData).reduce((total, value) => {
      return total + (Array.isArray(value) ? value.length : 0);
    }, 0);

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
                <h1 className="text-xl font-semibold">Enhanced Privacy Analysis</h1>
                <p className="text-sm text-muted-foreground">
                  Analysis for "{analysisData.query}" • {new Date(analysisData.timestamp).toLocaleDateString()}
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
          {/* Enhanced Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {analysisData.extraction_summary?.total_sources || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Sources Processed</p>
                    <p className="text-xs text-blue-600">
                      {analysisData.extraction_summary?.webpage_sources || 0} web • {analysisData.extraction_summary?.social_media_sources || 0} social
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {getSuccessRate(analysisData.extraction_summary)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <Progress 
                      value={getSuccessRate(analysisData.extraction_summary)} 
                      className="h-1 mt-1" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {analysisData.extraction_summary?.extraction_time.toFixed(1) || 0}s
                    </p>
                    <p className="text-xs text-muted-foreground">Processing Time</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {analysisData.extraction_summary?.scraping_performance?.optimization_applied ? 'Optimized' : 'Standard'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{totalPIIItems}</p>
                    <p className="text-xs text-muted-foreground">PII Items Found</p>
                    <p className="text-xs text-red-600">
                      {analysisData.pii_summary?.sensitive_items || 0} sensitive
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getRiskLevelColor(analysisData.risk_level).replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', '')}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{analysisData.risk_level}</p>
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <p className="text-xs font-medium">{analysisData.risk_score}/15</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {analysisData.pii_summary?.categories_found || 
                       Object.values(analysisData).filter(v => Array.isArray(v) && v.length > 0).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Data Categories</p>
                    <p className="text-xs text-green-600">of 26 total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="executive-summary" className="text-xs">Executive</TabsTrigger>
              <TabsTrigger value="data-discovery" className="text-xs">Data Discovery</TabsTrigger>
              <TabsTrigger value="source-analysis" className="text-xs">Source Analysis</TabsTrigger>
              <TabsTrigger value="risk-assessment" className="text-xs">Risk Assessment</TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs">Recommendations</TabsTrigger>
              <TabsTrigger value="technical-details" className="text-xs">Technical</TabsTrigger>
              <TabsTrigger value="export-sharing" className="text-xs">Export</TabsTrigger>
            </TabsList>

            {/* Tab 1: Executive Summary */}
            <TabsContent value="executive-summary" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Risk Assessment Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold mb-2">{analysisData.risk_score}/15</div>
                      <Badge className={`${getRiskLevelColor(analysisData.risk_level)} text-lg px-4 py-2`}>
                        {analysisData.risk_level}
                      </Badge>
                    </div>
                    <Progress value={(analysisData.risk_score / 15) * 100} className="mb-4" />
                    <p className="text-sm text-muted-foreground text-center">
                      Based on {totalPIIItems} PII items found across {analysisData.extraction_summary?.total_sources} sources
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Key Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analysisData)
                        .filter(([key, value]) => Array.isArray(value) && value.length > 0)
                        .slice(0, 5)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(key)}
                              <span className="text-sm font-medium">{key}</span>
                            </div>
                            <Badge variant="secondary">{(value as string[]).length}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Source Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Successful Extractions</span>
                        <span className="font-semibold text-green-600">
                          {analysisData.extraction_summary?.successful_extractions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Failed Extractions</span>
                        <span className="font-semibold text-red-600">
                          {analysisData.extraction_summary?.failed_extractions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Processing Time</span>
                        <span className="font-semibold">
                          {analysisData.extraction_summary?.extraction_time.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.recommendations?.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 2: Data Discovery */}
            <TabsContent value="data-discovery" className="mt-6">
              <div className="space-y-6">
                {/* Sensitive Data Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <CreditCard className="w-5 h-5" />
                      High-Risk Sensitive Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {categorizedPII.sensitive.map(category => {
                        const items = analysisData[category as keyof EnhancedAnalysisResponse] as string[];
                        return (
                          <Card key={category} className={`border-red-200 ${items?.length ? 'bg-red-50' : 'bg-gray-50'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-red-600" />
                                <span className="font-medium text-sm">{category}</span>
                              </div>
                              <div className="text-lg font-bold text-red-600">
                                {items?.length || 0}
                              </div>
                              {items?.length > 0 && (
                                <div className="mt-2">
                                  {items.map((item, idx) => (
                                    <Badge key={idx} variant="destructive" className="text-xs mr-1 mb-1">
                                      {category === 'SSN' || category === 'Credit Card' ? '***-**-****' : item}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Users className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedPII.personal.map(category => {
                        const items = analysisData[category as keyof EnhancedAnalysisResponse] as string[];
                        return (
                          <Card key={category} className={items?.length ? 'border-blue-200 bg-blue-50' : 'bg-gray-50'}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {getCategoryIcon(category)}
                                <span className="font-medium text-sm">{category}</span>
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {items?.length || 0}
                              </div>
                              {items?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {items.slice(0, 3).map((item, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs block w-full truncate">
                                      {item}
                                    </Badge>
                                  ))}
                                  {items.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{items.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Briefcase className="w-5 h-5" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedPII.professional.map(category => {
                        const items = analysisData[category as keyof EnhancedAnalysisResponse] as string[];
                        return (
                          <Card key={category} className={items?.length ? 'border-green-200 bg-green-50' : 'bg-gray-50'}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {getCategoryIcon(category)}
                                <span className="font-medium text-sm">{category}</span>
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                {items?.length || 0}
                              </div>
                              {items?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {items.slice(0, 2).map((item, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs block w-full truncate">
                                      {item}
                                    </Badge>
                                  ))}
                                  {items.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{items.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <Globe className="w-5 h-5" />
                      Social Media Presence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedPII.social.map(category => {
                        const items = analysisData[category as keyof EnhancedAnalysisResponse] as string[];
                        const platform = category.replace(' Account', '').toLowerCase();
                        return (
                          <Card key={category} className={items?.length ? 'border-purple-200 bg-purple-50' : 'bg-gray-50'}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {getPlatformIcon(platform)}
                                <span className="font-medium text-sm">{category}</span>
                              </div>
                              <div className="text-lg font-bold text-purple-600">
                                {items?.length || 0}
                              </div>
                              {items?.length > 0 && (
                                <div className="mt-2">
                                  {items.map((item, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs mr-1 mb-1">
                                      <Link2 className="w-3 h-3 mr-1" />
                                      Profile
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 3: Source Analysis */}
            <TabsContent value="source-analysis" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Source Performance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Source</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Platform</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Data Points</th>
                            <th className="text-left p-2">Scraper Used</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisData.extraction_summary?.extraction_details?.map((detail, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div className="max-w-xs truncate" title={detail.source}>
                                  {detail.source}
                                </div>
                              </td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs">
                                  {detail.type}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-1">
                                  {getPlatformIcon(detail.platform)}
                                  <span className="text-xs">{detail.platform}</span>
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(detail.status)}
                                  <span className="text-xs capitalize">{detail.status}</span>
                                </div>
                              </td>
                              <td className="p-2">
                                <span className="font-mono text-xs">{detail.data_points}</span>
                              </td>
                              <td className="p-2">
                                <Badge 
                                  variant={detail.scraper_used === 'apify' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {detail.scraper_used}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Platform Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisData.extraction_summary?.extraction_details
                          ?.reduce((acc, detail) => {
                            acc[detail.platform] = (acc[detail.platform] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                          && Object.entries(
                            analysisData.extraction_summary.extraction_details.reduce((acc, detail) => {
                              acc[detail.platform] = (acc[detail.platform] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([platform, count]) => (
                            <div key={platform} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(platform)}
                                <span className="text-sm capitalize">{platform}</span>
                              </div>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Technical Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">APIFY Scraper Used</span>
                          <Badge variant="default">
                            {analysisData.extraction_summary?.scraping_performance?.apify_used || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Fallback Scraper Used</span>
                          <Badge variant="secondary">
                            {analysisData.extraction_summary?.scraping_performance?.fallback_used || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Concurrent Processing</span>
                          <Badge variant={analysisData.extraction_summary?.scraping_performance?.concurrent_processing ? 'default' : 'secondary'}>
                            {analysisData.extraction_summary?.scraping_performance?.concurrent_processing ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Optimization Applied</span>
                          <Badge variant={analysisData.extraction_summary?.scraping_performance?.optimization_applied ? 'default' : 'secondary'}>
                            {analysisData.extraction_summary?.scraping_performance?.optimization_applied ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Risk Assessment */}
            <TabsContent value="risk-assessment" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Risk Score Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-6">
                        <div className="text-6xl font-bold mb-2">{analysisData.risk_score}</div>
                        <div className="text-lg text-muted-foreground mb-2">out of 15</div>
                        <Badge className={`${getRiskLevelColor(analysisData.risk_level)} text-lg px-6 py-2`}>
                          {analysisData.risk_level}
                        </Badge>
                      </div>
                      <Progress value={(analysisData.risk_score / 15) * 100} className="mb-4" />
                      <p className="text-sm text-muted-foreground text-center">
                        Risk calculation based on data sensitivity, exposure likelihood, and resolution power
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Category Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(analysisData.risk_analysis || {}).map(([category, findings]) => (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm">{category}</h4>
                              <Badge variant="outline" className="text-xs">
                                {findings === 'None found' ? '0' : findings.split(',').length}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{findings}</p>
                            <Progress 
                              value={findings === 'None found' ? 0 : Math.min(findings.split(',').length * 20, 100)} 
                              className="h-2 mt-2" 
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Risk Level Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {[
                        { level: 'Very Low', range: '0-2.74', color: 'bg-green-50 border-green-200 text-green-700' },
                        { level: 'Low', range: '2.75-5.48', color: 'bg-green-100 border-green-300 text-green-700' },
                        { level: 'Medium', range: '5.49-6.87', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
                        { level: 'High', range: '6.88-12.25', color: 'bg-orange-100 border-orange-300 text-orange-700' },
                        { level: 'Very High', range: '12.26+', color: 'bg-red-100 border-red-300 text-red-700' }
                      ].map(risk => (
                        <Card key={risk.level} className={`${risk.color} ${risk.level === analysisData.risk_level ? 'ring-2 ring-primary' : ''}`}>
                          <CardContent className="p-4 text-center">
                            <div className="font-semibold text-sm">{risk.level}</div>
                            <div className="text-xs mt-1">{risk.range}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 5: Recommendations */}
            <TabsContent value="recommendations" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Immediate Actions ({analysisData.risk_level} Risk)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisData.recommendations?.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{recommendation}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Priority {index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Platform-Specific Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(analysisData)
                          .filter(([key]) => key.includes('Account'))
                          .filter(([, value]) => Array.isArray(value) && value.length > 0)
                          .map(([key]) => {
                            const platform = key.replace(' Account', '');
                            return (
                              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  {getPlatformIcon(platform.toLowerCase())}
                                  <span className="text-sm font-medium">{platform}</span>
                                </div>
                                <Button variant="outline" size="sm">
                                  Review Settings
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Monitoring Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-sm mb-1">Regular Privacy Audits</h4>
                          <p className="text-xs text-muted-foreground">
                            Perform monthly scans to monitor changes in your digital footprint
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-sm mb-1">Google Alerts</h4>
                          <p className="text-xs text-muted-foreground">
                            Set up alerts for your name and key personal information
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-sm mb-1">Identity Monitoring</h4>
                          <p className="text-xs text-muted-foreground">
                            Consider credit monitoring and identity theft protection services
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab 6: Technical Details */}
            <TabsContent value="technical-details" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Processing Time</span>
                          <Badge variant="outline">
                            {analysisData.extraction_summary?.extraction_time.toFixed(2)}s
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Sources Processed</span>
                          <Badge variant="outline">
                            {analysisData.extraction_summary?.total_sources}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Data Points Extracted</span>
                          <Badge variant="outline">
                            {analysisData.extraction_summary?.data_points_extracted}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Avg Time Per Source</span>
                          <Badge variant="outline">
                            {((analysisData.extraction_summary?.extraction_time || 0) / (analysisData.extraction_summary?.total_sources || 1)).toFixed(2)}s
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Scraping Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">APIFY Available</span>
                          <Badge variant={analysisData.extraction_summary?.scraping_performance?.apify_available ? 'default' : 'secondary'}>
                            {analysisData.extraction_summary?.scraping_performance?.apify_available ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">APIFY Used</span>
                          <Badge variant="default">
                            {analysisData.extraction_summary?.scraping_performance?.apify_used || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Fallback Used</span>
                          <Badge variant="secondary">
                            {analysisData.extraction_summary?.scraping_performance?.fallback_used || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Failed Attempts</span>
                          <Badge variant="destructive">
                            {analysisData.extraction_summary?.scraping_performance?.total_failed || 0}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Concurrent Processing</span>
                          <Badge variant={analysisData.extraction_summary?.scraping_performance?.concurrent_processing ? 'default' : 'secondary'}>
                            {analysisData.extraction_summary?.scraping_performance?.concurrent_processing ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Optimization</span>
                          <Badge variant={analysisData.extraction_summary?.scraping_performance?.optimization_applied ? 'default' : 'secondary'}>
                            {analysisData.extraction_summary?.scraping_performance?.optimization_applied ? 'Applied' : 'Standard'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Fetch Limit</span>
                          <Badge variant="outline">
                            {analysisData.extraction_summary?.scraping_performance?.concurrent_fetch_limit || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">GPT Limit</span>
                          <Badge variant="outline">
                            {analysisData.extraction_summary?.scraping_performance?.concurrent_gpt_limit || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Data Quality Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Success Rates by Type</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Webpage Extraction</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={analysisData.extraction_summary?.webpage_sources ? 
                                  (getSuccessRate(analysisData.extraction_summary)) : 0} 
                                className="w-20 h-2" 
                              />
                              <span className="text-xs font-mono">
                                {analysisData.extraction_summary?.webpage_sources ? getSuccessRate(analysisData.extraction_summary) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Social Media Extraction</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={analysisData.extraction_summary?.social_media_sources ? 
                                  (getSuccessRate(analysisData.extraction_summary)) : 0} 
                                className="w-20 h-2" 
                              />
                              <span className="text-xs font-mono">
                                {analysisData.extraction_summary?.social_media_sources ? getSuccessRate(analysisData.extraction_summary) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">PII Category Coverage</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Categories Found</span>
                            <Badge variant="outline">
                              {analysisData.pii_summary?.categories_found || 
                               Object.values(analysisData).filter(v => Array.isArray(v) && v.length > 0).length} / 26
                            </Badge>
                          </div>
                          <Progress 
                            value={((analysisData.pii_summary?.categories_found || 
                                    Object.values(analysisData).filter(v => Array.isArray(v) && v.length > 0).length) / 26) * 100} 
                            className="h-2" 
                          />
                          <div className="text-xs text-muted-foreground">
                            {(((analysisData.pii_summary?.categories_found || 
                               Object.values(analysisData).filter(v => Array.isArray(v) && v.length > 0).length) / 26) * 100).toFixed(1)}% coverage
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 7: Export & Sharing */}
            <TabsContent value="export-sharing" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Report Generation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={handleExportReport} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download JSON Report
                      </Button>
                      <Button variant="outline" className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate PDF Summary
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Database className="w-4 h-4 mr-2" />
                        Export CSV Data
                      </Button>
                      <div className="text-xs text-muted-foreground mt-2">
                        Reports include all PII data, risk assessment, and technical details for comprehensive analysis.
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share className="w-5 h-5" />
                        Sharing Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={handleShareResults} variant="outline" className="w-full">
                        <Share className="w-4 h-4 mr-2" />
                        Share Analysis Link
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Summary
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Link2 className="w-4 h-4 mr-2" />
                        Create Secure Link
                      </Button>
                      <div className="text-xs text-muted-foreground mt-2">
                        Secure sharing options with expiration dates and access controls for team collaboration.
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{analysisData.extraction_summary?.total_sources}</div>
                        <div className="text-sm text-muted-foreground">Sources Analyzed</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{totalPIIItems}</div>
                        <div className="text-sm text-muted-foreground">PII Items Found</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{analysisData.risk_score}/15</div>
                        <div className="text-sm text-muted-foreground">Risk Score</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{analysisData.extraction_summary?.extraction_time.toFixed(1)}s</div>
                        <div className="text-sm text-muted-foreground">Processing Time</div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Analysis Metadata</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Query:</span> {analysisData.query}
                        </div>
                        <div>
                          <span className="font-medium">Timestamp:</span> {new Date(analysisData.timestamp).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Risk Level:</span> {analysisData.risk_level}
                        </div>
                        <div>
                          <span className="font-medium">Categories Found:</span> {analysisData.pii_summary?.categories_found || 
                            Object.values(analysisData).filter(v => Array.isArray(v) && v.length > 0).length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DetailedResults;