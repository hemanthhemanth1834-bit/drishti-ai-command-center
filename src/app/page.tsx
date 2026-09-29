import type { Metadata } from 'next';
import HomeHeader from '@/components/home/HomeHeader';
import HeroCommandCenter from '@/components/home/HeroCommandCenter';
import HeroFeatureStrip from '@/components/home/HeroFeatureStrip';
import DisasterTypes from '@/components/home/DisasterTypes';
import { PrimaryActionGrid, IntelligenceFeatureGrid, OperationalGrid } from '@/components/home/HomeGrids';
import { DisasterOverview, RegionalStatus, RealtimeFeed, MissionBanner } from '@/components/home/HomePanels';
import { MissionSection, DataSourcesSection, AiMlSection, GisSection, SatelliteSection, TwinSection, TerrainSection, CommandSection, EmergencySection, FinalCta } from '@/components/home/HomeSections';
import HomeFooter from '@/components/home/HomeFooter';

export const metadata: Metadata = {
  title: 'DRISHTI-X | Heavy Rainfall Early Warning & Inundation Prediction',
  description:
    'AI/ML-based heavy rainfall early warning and inundation prediction: rainfall monitoring, forecasting, flood extent mapping, satellite and radar data, GIS, and emergency response.',
};

// DRISHTI-X index: reference-design landing wired to real routes (see src/config/navigation.ts).
// /welcome is preserved as the legacy cinematic entry.
export default function Home() {
  return (
    <div className="home-page">
      <HomeHeader />
      <main id="home-main">
        <HeroCommandCenter />
        <HeroFeatureStrip />
        <MissionSection />
        <DisasterTypes />
        <PrimaryActionGrid />
        <DataSourcesSection />
        <AiMlSection />
        <GisSection />
        <SatelliteSection />
        <TwinSection />
        <TerrainSection />
        <CommandSection />
        <EmergencySection />
        <IntelligenceFeatureGrid />
        <OperationalGrid />
        <DisasterOverview />
        <RegionalStatus />
        <RealtimeFeed />
        <MissionBanner />
        <FinalCta />
      </main>
      <HomeFooter />
    </div>
  );
}
