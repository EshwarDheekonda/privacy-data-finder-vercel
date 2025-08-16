import { User, Briefcase, Shield, Search, Users, Eye } from 'lucide-react';

interface UseCasesSectionProps {
  onGetStartedClick?: () => void;
}

export const UseCasesSection = ({ onGetStartedClick }: UseCasesSectionProps) => {
  const useCases = [
    {
      icon: User,
      title: "Personal Privacy Checkup",
      description: "Discover what personal information is publicly available about you online and take control of your digital privacy.",
      audience: "Individual Users",
      benefits: [
        "Complete privacy audit",
        "Personal risk assessment",
        "Privacy improvement plan",
        "Ongoing monitoring alerts"
      ],
      color: "primary"
    },
    {
      icon: Briefcase,
      title: "Pre-Employment Screening",
      description: "Comprehensive background intelligence for HR teams to make informed hiring decisions while maintaining compliance.",
      audience: "HR Professionals",
      benefits: [
        "Candidate verification",
        "Risk factor identification",
        "Compliance reporting",
        "Professional network analysis"
      ],
      color: "secondary"
    },
    {
      icon: Shield,
      title: "Identity Theft Prevention",
      description: "Proactive monitoring and assessment to prevent identity theft by identifying vulnerable data exposure points.",
      audience: "Security Conscious",
      benefits: [
        "Vulnerability scanning",
        "Dark web monitoring",
        "Alert system setup",
        "Mitigation strategies"
      ],
      color: "warning"
    },
    {
      icon: Search,
      title: "Digital Reputation Management",
      description: "Monitor and manage your online reputation by understanding what information is discoverable about you.",
      audience: "Professionals & Executives",
      benefits: [
        "Reputation scoring",
        "Content analysis",
        "Brand monitoring",
        "Crisis prevention"
      ],
      color: "success"
    }
  ];

  const industries = [
    { name: "Financial Services", count: "12K+ users" },
    { name: "Healthcare", count: "8K+ users" },
    { name: "Technology", count: "15K+ users" },
    { name: "Legal", count: "6K+ users" },
    { name: "Government", count: "4K+ users" },
    { name: "Education", count: "7K+ users" }
  ];

  return (
    <section id="use-cases" className="py-20 px-6 bg-surface/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Versatile <span className="gradient-text">Use Cases</span> for Every Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From personal privacy protection to enterprise security, our platform serves diverse privacy assessment needs across industries.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className="glass-card p-8 interactive-hover animate-scale-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 bg-gradient-${useCase.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <useCase.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {useCase.title}
                  </h3>
                  <div className="inline-flex items-center gap-2 bg-surface-elevated px-3 py-1 rounded-lg text-xs font-medium text-secondary">
                    <Users className="w-3 h-3" />
                    {useCase.audience}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {useCase.description}
              </p>

              {/* Benefits */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Key Benefits:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {useCase.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 bg-${useCase.color} rounded-full`}></div>
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Industry Adoption */}
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold text-center mb-8">
            <span className="gradient-text">Trusted Across Industries</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <div 
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-surface-elevated rounded-lg p-4 mb-3">
                  <Eye className="w-8 h-8 text-primary mx-auto" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {industry.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {industry.count}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Start Your <span className="gradient-text">Privacy Assessment</span>?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of users who trust our platform to protect their digital privacy and manage online risks.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={onGetStartedClick}
                className="glass-button bg-gradient-primary text-white font-semibold"
              >
                Start Free Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};