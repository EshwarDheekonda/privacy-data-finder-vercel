import { 
  Globe, 
  Users, 
  Shield, 
  FileSearch, 
  TrendingUp, 
  Zap, 
  Eye, 
  Brain,
  Lock,
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      icon: Globe,
      title: "Real-time Web Scanning",
      description: "Comprehensive crawling across social media, public records, data brokers, and professional networks to discover exposed personal information.",
      benefits: ["500+ data sources", "Real-time updates", "Global coverage"]
    },
    {
      icon: Users,
      title: "Social Media Discovery",
      description: "Advanced algorithms identify and analyze social media profiles across all major platforms to assess privacy exposure and risk factors.",
      benefits: ["Multi-platform scanning", "Profile verification", "Privacy setting analysis"]
    },
    {
      icon: TrendingUp,
      title: "Risk Score Calculation",
      description: "Proprietary algorithms calculate comprehensive risk scores based on data exposure, accessibility, and potential impact on personal privacy.",
      benefits: ["0-100 risk scoring", "Weighted factors", "Trend analysis"]
    },
    {
      icon: FileSearch,
      title: "Detailed PII Extraction",
      description: "Identify and categorize all types of personally identifiable information including emails, phone numbers, addresses, and sensitive data.",
      benefits: ["50+ data types", "Context analysis", "Sensitivity classification"]
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Machine learning models analyze patterns, correlations, and potential vulnerabilities to provide intelligent privacy insights.",
      benefits: ["Pattern recognition", "Anomaly detection", "Predictive analysis"]
    },
    {
      icon: Shield,
      title: "Actionable Recommendations",
      description: "Receive specific, prioritized recommendations to reduce privacy risks and improve digital security posture.",
      benefits: ["Priority-based actions", "Step-by-step guides", "Impact assessment"]
    }
  ];

  const stats = [
    { label: "Data Sources", value: "500+", icon: Globe },
    { label: "Risk Factors", value: "50+", icon: AlertTriangle },
    { label: "Scan Speed", value: "<30s", icon: Zap },
    { label: "Accuracy", value: "99.2%", icon: Eye }
  ];

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Powerful Features</span> for Complete Privacy Assessment
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced technology stack delivering enterprise-grade privacy scanning and risk assessment capabilities.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="glass-card p-6 text-center animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-card p-8 interactive-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>

              {/* Benefits */}
              <ul className="space-y-2">
                {feature.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="mt-16">
          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold text-center mb-8">
              <span className="gradient-text">Enterprise Technology Stack</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">High Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Distributed architecture with real-time processing and sub-30 second response times.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Security First</h4>
                <p className="text-sm text-muted-foreground">
                  Zero-trust architecture with end-to-end encryption and no data retention.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2">AI-Powered</h4>
                <p className="text-sm text-muted-foreground">
                  Machine learning models trained on privacy patterns and risk assessment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};