import { Shield, Lock, Award, CheckCircle, Users, Globe } from 'lucide-react';
import { useCounter } from '@/contexts/CounterContext';
import { AnimatedCounter } from '@/components/AnimatedCounter';

export const TrustSection = () => {
  const { count } = useCounter();
  
  const trustSignals = [
    {
      icon: Shield,
      title: "SOC 2 Compliant",
      description: "Enterprise security standards"
    },
    {
      icon: Lock,
      title: "Zero Data Storage",
      description: "No personal data retained"
    },
    {
      icon: Award,
      title: "GDPR & CCPA",
      description: "Privacy regulation compliant"
    },
    {
      icon: CheckCircle,
      title: "ISO 27001",
      description: "Information security certified"
    },
    {
      icon: Users,
      title: "Trusted by 50K+",
      description: "Users worldwide"
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Worldwide web scanning"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Trusted by Privacy Professionals</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade security and compliance standards ensure your data remains protected throughout the assessment process.
          </p>
        </div>

        {/* Trust Signals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustSignals.map((signal, index) => (
            <div 
              key={index}
              className="glass-card p-6 interactive-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <signal.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {signal.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {signal.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Counter */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 bg-secondary rounded-full animate-glow"></div>
              <span className="text-muted-foreground text-sm font-medium">LIVE COUNTER</span>
            </div>
            <div className="text-4xl font-bold gradient-text mb-2">
              <AnimatedCounter value={count} />
            </div>
            <p className="text-muted-foreground">
              Privacy assessments completed this month
            </p>
          </div>
        </div>

        {/* Security Badges */}
        <div className="mt-16 flex justify-center items-center gap-8 opacity-60">
          <div className="glass-card p-4 px-6 text-sm font-medium">
            <span className="text-primary">🛡️</span> SOC 2 Type II
          </div>
          <div className="glass-card p-4 px-6 text-sm font-medium">
            <span className="text-secondary">🔒</span> GDPR Compliant
          </div>
          <div className="glass-card p-4 px-6 text-sm font-medium">
            <span className="text-warning">⭐</span> ISO 27001
          </div>
          <div className="glass-card p-4 px-6 text-sm font-medium">
            <span className="text-danger">🎯</span> CCPA Ready
          </div>
        </div>
      </div>
    </section>
  );
};