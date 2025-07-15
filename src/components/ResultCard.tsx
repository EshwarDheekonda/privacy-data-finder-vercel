import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchResult } from '@/lib/api';
import { useResults } from '@/contexts/ResultsContext';
import { Calendar, ExternalLink, Globe, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultCardProps {
  result: SearchResult;
}

const getRiskColor = (riskLevel: SearchResult['risk_level']) => {
  switch (riskLevel) {
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
};

const getRiskIcon = (riskLevel: SearchResult['risk_level']) => {
  switch (riskLevel) {
    case 'low':
      return <Shield className="w-4 h-4" />;
    case 'medium':
    case 'high':
    case 'critical':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
};

export const ResultCard = ({ result }: ResultCardProps) => {
  const { toggleResult, isSelected } = useResults();
  const selected = isSelected(result.id);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      selected && "ring-2 ring-primary ring-offset-2"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              checked={selected}
              onCheckedChange={() => toggleResult(result.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {result.title || result.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Globe className="w-4 h-4" />
                {result.source}
              </CardDescription>
              {result.snippet && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {result.snippet}
                </p>
              )}
            </div>
          </div>
          <Badge className={cn("text-xs font-medium", getRiskColor(result.risk_level))}>
            {getRiskIcon(result.risk_level)}
            <span className="ml-1 capitalize">{result.risk_level} Risk</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Data Types */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Data Found</h4>
          <div className="flex flex-wrap gap-1">
            {result.data_types.map((type, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Risk Assessment Reasoning */}
        {result.reasoning && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Risk Assessment</h4>
            <p className="text-sm text-foreground">{result.reasoning}</p>
          </div>
        )}

        {/* Found Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Found: {new Date(result.found_at).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Source
          </Button>
          <Button variant="outline" size="sm">
            Report Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};