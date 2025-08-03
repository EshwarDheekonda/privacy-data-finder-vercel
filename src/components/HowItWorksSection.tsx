import { Search, UserCheck, FileText, ArrowRight } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      title: "Enter a Name",
      description: "Simply type in the name of the person you want to assess. Our system supports various name formats and handles common variations automatically.",
      detail: "Advanced name parsing & fuzzy matching"
    },
    {
      icon: UserCheck,
      title: "Select Relevant Results",
      description: "Review the discovered profiles and data sources. Our AI helps you identify the most relevant matches based on context and relevance analysis.",
      detail: "AI-powered relevance scoring"
    },
    {
      icon: FileText,
      title: "Get Privacy Risk Report",
      description: "Receive a comprehensive privacy risk assessment with actionable recommendations to protect digital identity and reduce exposure.",
      detail: "Detailed risk analysis & recommendations"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 bg-surface/50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our advanced privacy assessment process delivers comprehensive results in just three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Card */}
              <div className="glass-card p-8 h-full interactive-hover animate-scale-in" style={{ animationDelay: `${index * 0.2}s` }}>
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {step.description}
                </p>

                {/* Detail Badge */}
                <div className="inline-flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-lg text-sm text-secondary font-medium">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  {step.detail}
                </div>
              </div>

              {/* Arrow (Desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Process Flow Visual */}
        <div className="mt-16 relative">
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-center mb-8">
              <span className="gradient-text">Real-time Processing Pipeline</span>
            </h3>
            
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full animate-glow"></div>
                <span>Web Crawling</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-secondary rounded-full animate-glow" style={{ animationDelay: '0.5s' }}></div>
                <span>Data Extraction</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-warning rounded-full animate-glow" style={{ animationDelay: '1s' }}></div>
                <span>Risk Analysis</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full animate-glow" style={{ animationDelay: '1.5s' }}></div>
                <span>Report Generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};