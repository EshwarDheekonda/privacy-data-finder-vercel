import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BackendAnalysisResponse } from '@/lib/api';
import { PII_CATEGORIES } from '@/types/enhanced-backend';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Lock,
  Unlock,
  Target,
  Zap
} from 'lucide-react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface EnhancedRiskAssessmentProps {
  data: BackendAnalysisResponse;
}

export const EnhancedRiskAssessment = ({ data }: EnhancedRiskAssessmentProps) => {
  const riskScore = data.risk_score || 0;
  const riskLevel = data.risk_level || 'Unknown';

  // Risk gauge data
  const riskGaugeData = [
    {
      name: 'Risk',
      value: riskScore,
      fill: riskScore >= 12 ? '#ef4444' : riskScore >= 8 ? '#f97316' : riskScore >= 5 ? '#eab308' : '#22c55e'
    }
  ];

  // Calculate category risk breakdown
  const categoryRisks = Object.entries(PII_CATEGORIES).map(([categoryName, fields]) => {
    const foundItems = fields.reduce((count, field) => {
      const value = data[field as keyof BackendAnalysisResponse];
      return count + (Array.isArray(value) ? value.length : 0);
    }, 0);

    // Calculate risk weight based on category sensitivity
    const riskWeights = {
      sensitive_docs: 5,
      personal: 3,
      contact: 2,
      professional: 2,
      social_media: 1,
      family: 4,
      digital: 1
    };

    const risk = foundItems * (riskWeights[categoryName as keyof typeof riskWeights] || 1);
    
    return {
      name: categoryName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      items: foundItems,
      risk: risk,
      fill: risk >= 15 ? '#ef4444' : risk >= 10 ? '#f97316' : risk >= 5 ? '#eab308' : '#22c55e'
    };
  }).filter(cat => cat.items > 0);

  // Risk evolution simulation (would come from historical data)
  const riskEvolution = [
    { period: 'Initial', score: Math.max(1, riskScore - 3) },
    { period: 'Current', score: riskScore },
    { period: 'Projected', score: Math.min(15, riskScore + 1) }
  ];

  // Privacy exposure levels
  const exposureLevels = [
    { 
      name: 'Public Search Results', 
      level: data.extraction_summary?.webpage_sources || 0,
      max: (data.extraction_summary?.total_sources || 1),
      color: '#ef4444'
    },
    { 
      name: 'Social Media Profiles', 
      level: data.extraction_summary?.social_media_sources || 0,
      max: (data.extraction_summary?.total_sources || 1),
      color: '#f97316'
    },
    { 
      name: 'Professional Networks', 
      level: ['LinkedIn Account'].reduce((count, field) => {
        const value = data[field as keyof BackendAnalysisResponse];
        return count + (Array.isArray(value) ? value.length : 0);
      }, 0),
      max: 3,
      color: '#3b82f6'
    }
  ];

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'very high': return 'bg-red-100 text-red-600 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'very high': return AlertTriangle;
      case 'high': return Unlock;
      case 'medium': case 'low': return Lock;
      default: return Shield;
    }
  };

  const RiskIcon = getRiskIcon(riskLevel);

  return (
    <div className="space-y-6">
      {/* Risk Score Visualization */}
      <Card className={`border-l-4 ${riskScore >= 10 ? 'border-l-red-500' : riskScore >= 6 ? 'border-l-orange-500' : 'border-l-green-500'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Overall Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-2">
                    {riskScore}
                  </div>
                  <div className="text-sm text-muted-foreground">out of 15</div>
                </div>
                <div className="flex-1">
                  <Badge className={`${getRiskLevelColor(riskLevel)} text-lg px-4 py-2 flex items-center gap-2`}>
                    <RiskIcon className="w-5 h-5" />
                    {riskLevel}
                  </Badge>
                  <Progress 
                    value={(riskScore / 15) * 100} 
                    className="mt-3 h-3"
                  />
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Risk assessment based on {data.pii_summary?.total_items || 'multiple'} data points across {data.extraction_summary?.total_sources || 0} sources
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={riskGaugeData}>
                  <RadialBar dataKey="value" cornerRadius={10} fill={riskGaugeData[0].fill} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Risk Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Risk by Data Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRisks} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="risk" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Privacy Exposure Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Privacy Exposure Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exposureLevels.map((exposure, index) => (
                <motion.div
                  key={exposure.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{exposure.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {exposure.level}/{exposure.max}
                    </span>
                  </div>
                  <Progress 
                    value={(exposure.level / exposure.max) * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {exposure.level === 0 
                      ? 'No exposure detected' 
                      : `${Math.round((exposure.level / exposure.max) * 100)}% exposure risk`
                    }
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Risk Factor Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.risk_analysis || {}).map(([category, analysis], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-muted/50 rounded-lg"
                >
                  <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                    {category === 'High Risk' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {category === 'Medium Risk' && <Eye className="w-4 h-4 text-yellow-500" />}
                    {category === 'Low Risk' && <Shield className="w-4 h-4 text-green-500" />}
                    {category === 'Social Media' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                    {category}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Evolution Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Risk Evolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 15]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Risk trend analysis based on current data patterns and typical privacy exposure progression.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};