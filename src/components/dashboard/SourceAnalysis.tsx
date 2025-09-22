import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackendAnalysisResponse } from '@/lib/api';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  Clock, 
  Database,
  TrendingUp,
  Globe,
  Users,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface SourceAnalysisProps {
  data: BackendAnalysisResponse;
}

export const SourceAnalysis = ({ data }: SourceAnalysisProps) => {
  // Extract source performance data
  const extractionDetails = data.extraction_summary?.extraction_details || [];
  
  // Group by platform
  const platformStats = extractionDetails.reduce((acc, detail) => {
    const platform = detail.platform || 'Unknown';
    if (!acc[platform]) {
      acc[platform] = {
        name: platform,
        total: 0,
        successful: 0,
        failed: 0,
        data_points: 0
      };
    }
    acc[platform].total += 1;
    if (detail.status === 'success') {
      acc[platform].successful += 1;
    } else {
      acc[platform].failed += 1;
    }
    acc[platform].data_points += detail.data_points || 0;
    return acc;
  }, {} as Record<string, any>);

  const platformData = Object.values(platformStats);

  // Status distribution
  const statusData = [
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

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'success':
        return { 
          color: 'bg-green-100 text-green-600', 
          icon: CheckCircle, 
          label: 'Success' 
        };
      case 'failed':
      case 'error':
        return { 
          color: 'bg-red-100 text-red-600', 
          icon: XCircle, 
          label: 'Failed' 
        };
      case 'no_relevant_content':
        return { 
          color: 'bg-yellow-100 text-yellow-600', 
          icon: AlertCircle, 
          label: 'No Content' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-600', 
          icon: AlertCircle, 
          label: 'Unknown' 
        };
    }
  };

  const getScraperDisplay = (scraper: string) => {
    switch (scraper) {
      case 'apify':
        return { color: 'bg-blue-100 text-blue-600', label: 'APIFY' };
      case 'fallback':
        return { color: 'bg-orange-100 text-orange-600', label: 'Fallback' };
      case 'failed':
      case 'error':
        return { color: 'bg-red-100 text-red-600', label: 'Failed' };
      default:
        return { color: 'bg-gray-100 text-gray-600', label: scraper || 'Unknown' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Total Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {data.extraction_summary?.total_sources || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {data.extraction_summary?.webpage_sources || 0} webpages, {data.extraction_summary?.social_media_sources || 0} social
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.extraction_summary?.total_sources 
                ? Math.round((data.extraction_summary.successful_extractions / data.extraction_summary.total_sources) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {data.extraction_summary?.successful_extractions || 0} of {data.extraction_summary?.total_sources || 0} sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data.extraction_summary?.extraction_time || 0}s
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total extraction time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successful" fill="#10b981" name="Successful" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platformData.map((platform, index) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {platform.data_points} data points
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {platform.successful}/{platform.total}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((platform.successful / platform.total) * 100)}% success
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Source Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Source Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Source</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Data Points</th>
                  <th className="text-left py-3 px-2">Scraper</th>
                  <th className="text-left py-3 px-2">Platform</th>
                  <th className="text-left py-3 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {extractionDetails.map((detail, index) => {
                  const statusDisplay = getStatusDisplay(detail.status);
                  const scraperDisplay = getScraperDisplay(detail.scraper_used);
                  const StatusIcon = statusDisplay.icon;
                  
                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="max-w-xs truncate text-sm" title={detail.source}>
                          {detail.source}
                        </div>
                        {detail.username && (
                          <div className="text-xs text-muted-foreground">
                            @{detail.username}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="capitalize">
                          {detail.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={statusDisplay.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusDisplay.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {detail.data_points || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={scraperDisplay.color}>
                          <Zap className="w-3 h-3 mr-1" />
                          {scraperDisplay.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm capitalize">
                          {detail.platform || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(detail.source, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};