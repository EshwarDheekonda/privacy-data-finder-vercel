import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackendAnalysisResponse } from '@/lib/api';
import { PII_CATEGORIES } from '@/types/enhanced-backend';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Shield,
  Database,
  Globe,
  Users
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface ExecutiveSummaryProps {
  data: BackendAnalysisResponse;
}

export const ExecutiveSummary = ({ data }: ExecutiveSummaryProps) => {
  // Risk assessment data for gauge chart
  const riskData = [
    { name: 'Current Risk', value: data.risk_score || 0, fill: '#ef4444' },
    { name: 'Safe Zone', value: Math.max(0, 15 - (data.risk_score || 0)), fill: '#e5e7eb' }
  ];

  // Key findings from PII data
  const getKeyFindings = () => {
    const findings = [];
    const totalPII = data.pii_summary?.total_items || 0;
    const sensitiveItems = data.pii_summary?.sensitive_items || 0;
    
    if (sensitiveItems > 0) {
      findings.push(`${sensitiveItems} sensitive data items discovered`);
    }
    
    // Check for high-risk categories
    const highRiskCategories = ['SSN', 'Credit Card', 'Passport', 'DDL'];
    const foundHighRisk = highRiskCategories.filter(cat => 
      data[cat as keyof BackendAnalysisResponse] && 
      Array.isArray(data[cat as keyof BackendAnalysisResponse]) && 
      (data[cat as keyof BackendAnalysisResponse] as string[]).length > 0
    );
    
    if (foundHighRisk.length > 0) {
      findings.push(`Critical documents found: ${foundHighRisk.join(', ')}`);
    }
    
    // Social media presence
    const socialPlatforms = ['Facebook Account', 'Twitter Account', 'Instagram Account', 'LinkedIn Account'];
    const foundSocial = socialPlatforms.filter(platform => 
      data[platform as keyof BackendAnalysisResponse] && 
      Array.isArray(data[platform as keyof BackendAnalysisResponse]) && 
      (data[platform as keyof BackendAnalysisResponse] as string[]).length > 0
    );
    
    if (foundSocial.length > 0) {
      findings.push(`Active on ${foundSocial.length} social media platforms`);
    }
    
    if (totalPII > 10) {
      findings.push(`Extensive digital footprint detected (${totalPII} data points)`);
    }
    
    return findings.slice(0, 5); // Top 5 findings
  };

  // Source performance breakdown
  const sourcePerformanceData = [
    {
      name: 'Successful',
      value: data.extraction_summary?.successful_extractions || 0,
      fill: '#10b981'
    },
    {
      name: 'Failed',
      value: data.extraction_summary?.failed_extractions || 0,
      fill: '#ef4444'
    }
  ];

  // Quick actions based on risk level
  const getQuickActions = () => {
    const riskLevel = data.risk_level?.toLowerCase() || '';
    const actions = [];
    
    if (riskLevel.includes('high')) {
      actions.push('Review and limit social media privacy settings');
      actions.push('Contact platforms to remove sensitive information');
      actions.push('Enable two-factor authentication on all accounts');
    } else if (riskLevel.includes('medium')) {
      actions.push('Update privacy settings on social media platforms');
      actions.push('Review public profiles and limit personal information');
    } else {
      actions.push('Continue monitoring your digital presence');
      actions.push('Set up privacy alerts for future monitoring');
    }
    
    return actions;
  };

  const keyFindings = getKeyFindings();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Risk Assessment Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risk Assessment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {data.risk_score || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Risk Score</div>
                </div>
                <div className="flex-1">
                  <Badge 
                    className={`text-sm px-3 py-1 ${
                      data.risk_level?.toLowerCase().includes('high') 
                        ? 'bg-red-100 text-red-600' 
                        : data.risk_level?.toLowerCase().includes('medium')
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {data.risk_level || 'Unknown'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {data.pii_summary?.total_items || 0} data points analyzed
                  </p>
                </div>
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keyFindings.length > 0 ? (
                keyFindings.map((finding, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{finding}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No significant findings detected.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Source Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Source Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourcePerformanceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={40}
                      dataKey="value"
                    >
                      {sourcePerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {data.extraction_summary?.successful_extractions || 0} successful out of {data.extraction_summary?.total_sources || 0} sources
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <p className="text-sm flex-1">{action}</p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};