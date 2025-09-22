import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BackendAnalysisResponse } from '@/lib/api';
import { PII_CATEGORIES } from '@/types/enhanced-backend';
import { 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Star,
  Shield,
  Eye,
  Settings,
  Users,
  Lock,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedRecommendationsProps {
  data: BackendAnalysisResponse;
}

export const EnhancedRecommendations = ({ data }: EnhancedRecommendationsProps) => {
  const riskLevel = data.risk_level?.toLowerCase() || '';
  const totalPIIItems = data.pii_summary?.total_items || 0;

  // Generate immediate actions based on risk level and found data
  const getImmediateActions = () => {
    const actions = [];
    
    // Check for high-risk data
    const highRiskFields = ['SSN', 'Credit Card', 'Passport', 'DDL'];
    const foundHighRisk = highRiskFields.filter(field => {
      const value = data[field as keyof BackendAnalysisResponse];
      return Array.isArray(value) && value.length > 0;
    });

    if (foundHighRisk.length > 0) {
      actions.push({
        priority: 'critical',
        title: 'Secure Sensitive Documents',
        description: `Found ${foundHighRisk.join(', ')} in public sources. Contact platforms immediately for removal.`,
        timeframe: 'Within 24 hours',
        completed: false
      });
    }

    // Check social media exposure
    const socialFields = PII_CATEGORIES.social_media;
    const foundSocial = socialFields.filter(field => {
      const value = data[field as keyof BackendAnalysisResponse];
      return Array.isArray(value) && value.length > 0;
    });

    if (foundSocial.length > 2) {
      actions.push({
        priority: 'high',
        title: 'Review Social Media Privacy Settings',
        description: `Active on ${foundSocial.length} platforms. Audit and tighten privacy controls.`,
        timeframe: 'Within 1 week',
        completed: false
      });
    }

    // General recommendations based on risk level
    if (riskLevel.includes('high')) {
      actions.push({
        priority: 'high',
        title: 'Enable Two-Factor Authentication',
        description: 'Secure all accounts with 2FA to prevent unauthorized access.',
        timeframe: 'Within 48 hours',
        completed: false
      });
    }

    if (totalPIIItems > 10) {
      actions.push({
        priority: 'medium',
        title: 'Set Up Privacy Monitoring',
        description: 'Monitor your digital footprint with regular privacy scans.',
        timeframe: 'Within 1 month',
        completed: false
      });
    }

    return actions;
  };

  // Platform-specific recommendations
  const getPlatformRecommendations = () => {
    const recommendations = [];
    
    // LinkedIn recommendations
    if (data['LinkedIn Account']?.length) {
      recommendations.push({
        platform: 'LinkedIn',
        icon: '💼',
        color: 'bg-blue-100 text-blue-600',
        actions: [
          'Limit profile visibility to connections only',
          'Remove sensitive contact information',
          'Disable public profile indexing',
          'Review connection recommendations settings'
        ]
      });
    }

    // Facebook recommendations
    if (data['Facebook Account']?.length) {
      recommendations.push({
        platform: 'Facebook',
        icon: '📘',
        color: 'bg-blue-100 text-blue-600',
        actions: [
          'Set posts to friends only by default',
          'Disable facial recognition features',
          'Limit who can search for you',
          'Review app permissions and remove unused apps'
        ]
      });
    }

    // Twitter recommendations
    if (data['Twitter Account']?.length) {
      recommendations.push({
        platform: 'Twitter',
        icon: '🐦',
        color: 'bg-sky-100 text-sky-600',
        actions: [
          'Make account private if not needed for business',
          'Disable location services',
          'Review and clean up old tweets',
          'Turn off photo tagging'
        ]
      });
    }

    // Instagram recommendations
    if (data['Instagram Account']?.length) {
      recommendations.push({
        platform: 'Instagram',
        icon: '📸',
        color: 'bg-purple-100 text-purple-600',
        actions: [
          'Switch to private account',
          'Disable activity status',
          'Remove location from posts',
          'Limit story visibility'
        ]
      });
    }

    return recommendations;
  };

  const immediateActions = getImmediateActions();
  const platformRecommendations = getPlatformRecommendations();
  const globalRecommendations = data.recommendations || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-600 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return AlertTriangle;
      case 'high': return ExternalLink;
      case 'medium': return Eye;
      case 'low': return CheckCircle;
      default: return Lightbulb;
    }
  };

  return (
    <div className="space-y-6">
      {/* Immediate Actions */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Immediate Actions Required
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Priority tasks based on your current risk level
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {immediateActions.length > 0 ? (
              immediateActions.map((action, index) => {
                const PriorityIcon = getPriorityIcon(action.priority);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${getPriorityColor(action.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <PriorityIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{action.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {action.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{action.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {action.timeframe}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Mark Complete
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No immediate actions required. Your privacy risk is well-managed.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            General Privacy Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {globalRecommendations.length > 0 ? (
              globalRecommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm flex-1">{recommendation}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No specific general recommendations available at this time.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform-Specific Recommendations */}
      {platformRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Platform-Specific Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformRecommendations.map((platform, index) => (
                <motion.div
                  key={platform.platform}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="text-2xl">{platform.icon}</span>
                        {platform.platform}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {platform.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Open Privacy Settings
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Privacy Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Additional Privacy Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Privacy Tools
              </h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  Privacy-focused browsers and extensions
                </a>
                <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  VPN services for online privacy
                </a>
                <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  Encrypted messaging apps
                </a>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Educational Resources
              </h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  Digital privacy best practices guide
                </a>
                <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  Understanding data brokers
                </a>
                <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  GDPR and privacy rights
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};