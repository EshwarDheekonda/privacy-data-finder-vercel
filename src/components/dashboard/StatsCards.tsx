import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackendAnalysisResponse } from '@/lib/api';
import { 
  Globe, 
  TrendingUp, 
  Clock, 
  Database, 
  Shield, 
  Tag,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  data: BackendAnalysisResponse;
}

export const StatsCards = ({ data }: StatsCardsProps) => {
  const successRate = data.extraction_summary 
    ? Math.round((data.extraction_summary.successful_extractions / data.extraction_summary.total_sources) * 100)
    : 0;

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-600';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const getEfficiencyBadge = (time: number) => {
    if (time <= 30) return 'bg-green-100 text-green-600';
    if (time <= 60) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const cards = [
    // Row 1: Performance Metrics
    {
      title: 'Sources Processed',
      value: data.extraction_summary?.total_sources || 0,
      subtitle: `${data.extraction_summary?.webpage_sources || 0} webpages, ${data.extraction_summary?.social_media_sources || 0} social`,
      icon: Globe,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      subtitle: `${data.extraction_summary?.successful_extractions || 0}/${data.extraction_summary?.total_sources || 0} successful`,
      icon: successRate >= 80 ? CheckCircle : XCircle,
      color: getSuccessRateBadge(successRate),
      badge: successRate >= 80 ? 'High Efficiency' : successRate >= 60 ? 'Moderate' : 'Needs Attention'
    },
    {
      title: 'Processing Time',
      value: `${data.extraction_summary?.extraction_time || 0}s`,
      subtitle: `${(data.extraction_summary?.extraction_time || 0) < 60 ? 'Fast' : 'Standard'} processing speed`,
      icon: Clock,
      color: getEfficiencyBadge(data.extraction_summary?.extraction_time || 0),
      badge: (data.extraction_summary?.extraction_time || 0) <= 30 ? 'Optimized' : 'Standard'
    },
    // Row 2: Data Discovery
    {
      title: 'PII Items Found',
      value: data.pii_summary?.total_items || 0,
      subtitle: `${data.pii_summary?.sensitive_items || 0} sensitive, ${data.pii_summary?.non_sensitive_items || 0} general`,
      icon: Database,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Risk Level',
      value: data.risk_level || 'Unknown',
      subtitle: `Score: ${data.risk_score || 0}/15`,
      icon: Shield,
      color: data.risk_level ? (() => {
        switch (data.risk_level.toLowerCase()) {
          case 'very high': return 'bg-red-100 text-red-600';
          case 'high': return 'bg-orange-100 text-orange-600';
          case 'medium': return 'bg-yellow-100 text-yellow-600';
          case 'low': return 'bg-green-100 text-green-600';
          default: return 'bg-gray-100 text-gray-600';
        }
      })() : 'bg-gray-100 text-gray-600'
    },
    {
      title: 'Data Categories',
      value: `${data.pii_summary?.categories_found || 0}/26`,
      subtitle: 'PII categories discovered',
      icon: Tag,
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{card.value}</p>
                    {card.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {card.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {card.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};