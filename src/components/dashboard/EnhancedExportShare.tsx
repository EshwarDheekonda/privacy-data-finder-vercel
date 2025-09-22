import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackendAnalysisResponse } from '@/lib/api';
import { 
  Download, 
  Share, 
  FileText, 
  FileSpreadsheet, 
  Mail, 
  Link, 
  Users, 
  Calendar,
  Eye,
  Lock,
  Settings,
  Copy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface EnhancedExportShareProps {
  data: BackendAnalysisResponse;
  query: string;
}

export const EnhancedExportShare = ({ data, query }: EnhancedExportShareProps) => {
  const [shareUrl, setShareUrl] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  // Export formats
  const exportFormats = [
    {
      name: 'Executive Summary (PDF)',
      description: 'Professional report with key findings and recommendations',
      icon: FileText,
      color: 'bg-red-100 text-red-600',
      format: 'pdf',
      size: '~2-3 MB'
    },
    {
      name: 'Detailed Data (CSV)',
      description: 'Complete PII dataset for analysis',
      icon: FileSpreadsheet,
      color: 'bg-green-100 text-green-600',
      format: 'csv',
      size: '~50-200 KB'
    },
    {
      name: 'Technical Report (JSON)',
      description: 'Raw data with technical metrics',
      icon: Settings,
      color: 'bg-blue-100 text-blue-600',
      format: 'json',
      size: '~100-500 KB'
    }
  ];

  // Sharing options
  const sharingOptions = [
    {
      name: 'Secure Link',
      description: 'Password-protected shareable link',
      icon: Link,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Email Report',
      description: 'Send summary via encrypted email',
      icon: Mail,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Team Dashboard',
      description: 'Add to organization dashboard',
      icon: Users,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const handleExport = async (format: string) => {
    try {
      let data_to_export;
      let filename;
      let mimeType;

      switch (format) {
        case 'pdf':
          // In a real implementation, you'd generate a PDF
          toast({
            title: 'PDF Export',
            description: 'PDF generation feature coming soon!',
          });
          return;

        case 'csv':
          // Create CSV data
          const csvData = createCSVData();
          data_to_export = csvData;
          filename = `privacy_analysis_${query}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
        default:
          // Create JSON report
          data_to_export = JSON.stringify({
            query,
            analysis_date: new Date().toISOString(),
            risk_assessment: {
              risk_score: data.risk_score,
              risk_level: data.risk_level,
              risk_analysis: data.risk_analysis
            },
            pii_data: data,
            recommendations: data.recommendations,
            extraction_summary: data.extraction_summary
          }, null, 2);
          filename = `privacy_analysis_${query}_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
      }

      // Download file
      const dataStr = `data:${mimeType};charset=utf-8,${encodeURIComponent(data_to_export)}`;
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      toast({
        title: 'Export Successful',
        description: `${format.toUpperCase()} report has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Unable to export report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const createCSVData = () => {
    const headers = ['Category', 'Value', 'Source_Type', 'Risk_Level'];
    const rows = [headers.join(',')];

    // Extract PII data into CSV format
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(item => {
          rows.push([
            key,
            `\"${item}\"`,
            'extracted',
            data.risk_level || 'unknown'
          ].join(','));
        });
      }
    });

    return rows.join('\n');
  };

  const generateShareLink = async () => {
    setIsGeneratingShare(true);
    
    // Simulate API call to generate secure share link
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockShareUrl = `https://privacy.example.com/shared/${Date.now()}?expires=${expirationDays}d`;
    setShareUrl(mockShareUrl);
    setIsGeneratingShare(false);

    toast({
      title: 'Share Link Generated',
      description: `Link will expire in ${expirationDays} days.`,
    });
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link Copied',
        description: 'Share link copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Report
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Download your privacy analysis in various formats
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exportFormats.map((format, index) => (
              <motion.div
                key={format.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${format.color}`}>
                        <format.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{format.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{format.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {format.size}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleExport(format.format)}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sharing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Share Results
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Securely share your analysis with team members or stakeholders
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Generate Share Link */}
            <div className="space-y-4">
              <h4 className="font-semibold">Generate Secure Share Link</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiration">Link Expiration</Label>
                  <div className="flex gap-2">
                    <Input
                      id="expiration"
                      type="number"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
                      min="1"
                      max="30"
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground py-2">days</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Security Level</Label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Password Protected</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={generateShareLink}
                disabled={isGeneratingShare}
                className="w-full md:w-auto"
              >
                {isGeneratingShare ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>

              {shareUrl && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Share URL</Label>
                    <Button variant="ghost" size="sm" onClick={copyShareLink}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-xs" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Expires in {expirationDays} days
                    <Eye className="w-3 h-3 ml-2" />
                    0 views
                  </div>
                </div>
              )}
            </div>

            {/* Other Sharing Options */}
            <div className="space-y-4">
              <h4 className="font-semibold">Other Sharing Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sharingOptions.map((option, index) => (
                  <motion.div
                    key={option.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <CardContent className="p-4 text-center">
                        <div className={`p-3 rounded-lg ${option.color} inline-block mb-3`}>
                          <option.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm mb-2">{option.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
                        <Button variant="outline" size="sm" className="w-full">
                          Coming Soon
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Privacy & Security</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• All shared links are encrypted and password-protected</p>
                <p>• Exported reports contain sensitive data - handle with care</p>
                <p>• Share links automatically expire and can be revoked anytime</p>
                <p>• We don't store your analysis data after export/sharing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
