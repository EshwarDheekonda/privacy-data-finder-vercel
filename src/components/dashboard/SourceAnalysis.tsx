import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackendAnalysisResponse } from '@/lib/api';
import { 
  ExternalLink, 
  Database,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SourceAnalysisProps {
  data: BackendAnalysisResponse;
}

export const SourceAnalysis = ({ data }: SourceAnalysisProps) => {
  // Extract source performance data - filter only successful sources
  const extractionDetails = (data.extraction_summary?.extraction_details || [])
    .filter(detail => detail.status === 'success');

  return (
    <div className="space-y-6">
      {/* Total Sources Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Total Sources Analyzed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {extractionDetails.length}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Successful sources with data extracted
          </p>
        </CardContent>
      </Card>

      {/* Detailed Source Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Source Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-3 sm:py-3 sm:px-2 text-sm">Source</th>
                  <th className="text-left py-4 px-3 sm:py-3 sm:px-2 text-sm">Type</th>
                  <th className="text-left py-4 px-3 sm:py-3 sm:px-2 text-sm">Data Points</th>
                  <th className="text-left py-4 px-3 sm:py-3 sm:px-2 text-sm">Platform</th>
                  <th className="text-left py-4 px-3 sm:py-3 sm:px-2 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {extractionDetails.map((detail, index) => {
                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-3 sm:py-3 sm:px-2">
                        <div className="max-w-xs truncate text-sm" title={detail.source}>
                          {detail.source}
                        </div>
                        {detail.username && (
                          <div className="text-xs text-muted-foreground">
                            @{detail.username}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-3 sm:py-3 sm:px-2">
                        <Badge variant="outline" className="capitalize">
                          {detail.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-3 sm:py-3 sm:px-2">
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {detail.data_points || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:py-3 sm:px-2">
                        <span className="text-sm capitalize">
                          {detail.platform || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-3 sm:py-3 sm:px-2">
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