import { useRef } from 'react';
import { Header } from '@/components/Header';
import { HeroSection, HeroSectionRef } from '@/components/HeroSection';
import { TrustSection } from '@/components/TrustSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { UseCasesSection } from '@/components/UseCasesSection';
import { FooterSection } from '@/components/FooterSection';

const Index = () => {
  const heroRef = useRef<HeroSectionRef>(null);

  const handleGetStartedClick = () => {
    heroRef.current?.focusSearchInput();
  };

  return (
    <div className="min-h-screen">
      <Header onGetStartedClick={handleGetStartedClick} />
      <HeroSection ref={heroRef} />
      <TrustSection />
      <HowItWorksSection />
      <FeaturesSection />
      <UseCasesSection onGetStartedClick={handleGetStartedClick} />
      <FooterSection />
    </div>
  );
};

export default Index;
