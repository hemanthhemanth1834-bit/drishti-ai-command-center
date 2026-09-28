'use client';
/**
 * Central homepage route configuration — single source of truth for the
 * DRISHTI-X index page. Every href below is a VERIFIED existing route
 * (directory present in src/app + passing production build).
 * Do not hardcode these routes in multiple components: import from here.
 */
import type { LucideIcon } from 'lucide-react';
import {
  HeartPulse, MapPin, Layers, Bell, Siren, Route as RouteIcon,
  LifeBuoy, FileWarning, Users, ClipboardList, Backpack, BookOpen,
  Cpu, Box, Plane, Building2, Tent, BarChart3, Languages,
  Accessibility, Mic, WifiOff,   MonitorSmartphone, Gauge,
  Home, Crosshair, CloudSun, Satellite, Mountain, History,
  AlertTriangle, Ambulance, Map, Database, ShieldAlert, Globe,
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  description?: string;
  icon: LucideIcon;
  /** Registry photo id (disasterImages.ts) for photo-primary cards. */
  photoId?: string;
  /** Short factual topic explanation shown under the description. */
  explainer?: string;
}

export interface ActionCard extends NavigationItem {
  action?: 'public-mode' | 'command-mode' | 'cycle-lang' | 'large-text';
}

/** Top header nav — all verified routes. */
export const HEADER_NAV: NavigationItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Command Center', href: '/command', icon: Gauge },
  { label: 'Intelligence', href: '/intelligence', icon: Crosshair },
  { label: 'Prediction', href: '/prediction', icon: AlertTriangle },
  { label: 'Risk Map', href: '/risk-map', icon: Map },
  { label: 'Incidents', href: '/incidents', icon: FileWarning },
  { label: 'Resources', href: '/resources', icon: Building2 },
  { label: 'Drones', href: '/drones', icon: Plane },
  { label: 'Weather', href: '/weather', icon: CloudSun },
  { label: 'Satellite', href: '/satellite', icon: Satellite },
  { label: 'Terrain', href: '/terrain', icon: Mountain },
  { label: 'History', href: '/history', icon: History },
  { label: 'Response', href: '/response', icon: Ambulance },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Reports', href: '/reports', icon: ClipboardList },
  { label: 'Settings', href: '/settings', icon: ShieldAlert },
  { label: 'Regions', href: '/regions', icon: MapPin },
  { label: 'Data Sources', href: '/data-sources', icon: Database },
  { label: 'Offline', href: '/offline', icon: WifiOff },
  { label: 'Admin', href: '/admin', icon: ShieldAlert },
];

/** Primary citizen action cards. */
export const PRIMARY_ACTIONS: NavigationItem[] = [
  { label: 'My Safety', href: '/safety', description: 'Check your risk. Stay informed.', icon: HeartPulse,
    photoId: 'safety-sandbags-missouri',
    explainer: 'Community preparedness — volunteers preparing flood defenses before waters rise.' },
  { label: 'Live Location', href: '/location', description: 'Explore hazards. View risk layers.', icon: MapPin,
    photoId: 'storm-lightning-india',
    explainer: 'Location-aware hazard layers built from satellite and field observations.' },
  { label: 'Hazard Maps', href: '/risk-map', description: 'Flood, Cyclone, Earthquake, Fire, Landslide & more.', icon: Layers,
    photoId: 'cyclone-ilsa',
    explainer: 'Satellite-observed hazards rendered as map layers for regional awareness.' },
  { label: 'Alert Center', href: '/alerts', description: 'Real-time alerts. Know what to do.', icon: Bell,
    photoId: 'command-eoc',
    explainer: 'Operations centers monitor feeds and issue alerts to exposed communities.' },
  { label: 'Emergency Mode', href: '/emergency', description: 'One tap for help. Contacts & navigation.', icon: Siren,
    photoId: 'response-nebraska-taskforce',
    explainer: 'Search-and-rescue teams operate in affected areas during flood response.' },
  { label: 'Safe Evacuation', href: '/evacuate', description: 'Find the safest route. Reach shelter.', icon: RouteIcon,
    photoId: 'response-katrina-staging',
    explainer: 'Coordinated evacuation moves residents by bus out of flooded districts.' },
];

/** Secondary capability cards. */
export const SECONDARY_FEATURES: NavigationItem[] = [
  { label: 'Nearby Help', href: '/nearby', description: 'Hospitals, Shelters, Police, Fire & more.', icon: LifeBuoy,
    photoId: 'nearby-hospital-dmat' },
  { label: 'Citizen Reporting', href: '/report', description: 'Report incidents. Be the eyes on ground.', icon: FileWarning,
    photoId: 'report-assessment-team' },
  { label: 'Family Safety', href: '/family', description: 'Keep your loved ones safe.', icon: Users,
    photoId: 'family-preparedness-day' },
  { label: 'Personal Plan', href: '/plan', description: 'Be prepared. Step by step.', icon: ClipboardList,
    photoId: 'plan-eoc-texas' },
  { label: 'Emergency Kit', href: '/kit', description: 'Essentials for any disaster.', icon: Backpack,
    photoId: 'kit-supply' },
  { label: 'Disaster Education', href: '/learn', description: 'Before • During • After. Learn & stay ready.', icon: BookOpen,
    photoId: 'learn-cert-rebuild' },
  { label: 'What-If Copilot', href: '/simulation', description: 'Simulate scenarios. See possible impact.', icon: Cpu,
    photoId: 'whatif-shakemap' },
  { label: '3D Digital Twin', href: '/twin', description: 'Explore realistic 3D environments.', icon: Box,
    photoId: 'twin-himalaya-iss' },
  { label: 'Drone SAR', href: '/drones', description: 'Search • Locate • Assist. Save lives.', icon: Plane,
    photoId: 'drone-global-hawk' },
];

/** Operational / platform cards. href: string = navigate; action = real store state change. */
export const OPERATIONAL_FEATURES: ActionCard[] = [
  { label: 'Hospital Intelligence', href: '/resources', description: 'ICU status • Capacity. Resource view.', icon: Building2 },
  { label: 'Shelter Management', href: '/shelter', description: 'Find & track shelters. Real-time status.', icon: Tent },
  { label: 'Recovery Insights', href: '/recovery', description: 'Damage assessment. Rebuild smarter.', icon: BarChart3 },
  { label: 'Multi-Language', href: '/welcome', description: 'English • తెలుగు • हिन्दी & more.', icon: Languages, action: 'cycle-lang' },
  { label: 'Accessibility', href: '/welcome', description: 'Inclusive for everyone. Larger text, voice assist.', icon: Accessibility, action: 'large-text' },
  { label: 'Voice Assistant', href: '/talk', description: 'Talk to DRISHTI. Get help instantly.', icon: Mic },
  { label: 'Offline Mode', href: '/offline', description: 'Works even without internet. Stay prepared.', icon: WifiOff },
  { label: 'Public Mode', href: '/safety', description: 'Simple. Clear. Actionable. For everyone.', icon: MonitorSmartphone, action: 'public-mode' },
  { label: 'Command Mode', href: '/command', description: 'Advanced tools. For authorities.', icon: Gauge, action: 'command-mode' },
];

/** Disaster overview categories — statuses resolve live-or-DEMO at runtime. */
export const DISASTER_CATEGORIES = [
  'Cyclone', 'Flood', 'Landslide', 'Heatwave', 'Earthquake', 'Wildfire',
] as const;

/** Footer links — all verified routes/pages. */
export const FOOTER_LINKS: NavigationItem[] = [
  { label: 'About', href: '/welcome', icon: Home },
  { label: 'Platform', href: '/platform', icon: Layers },
  { label: 'Sources', href: '/sources', icon: Database },
  { label: 'Data Sources', href: '/data-sources', icon: Database },
  { label: 'Accessibility', href: '/learn', icon: Accessibility },
  { label: 'Documentation', href: '/platform', icon: BookOpen },
  { label: 'System Status', href: '/model-health', icon: Gauge },
  { label: 'Contact', href: '/contact', icon: Globe },
  { label: 'Privacy', href: '/privacy', icon: Globe },
  { label: 'Terms', href: '/terms', icon: Globe },
  { label: 'GitHub', href: 'https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center', icon: Globe },
];

/** All internal hrefs, for the route audit (no invented routes). */
export function allInternalHrefs(): string[] {
  const all = [...HEADER_NAV, ...PRIMARY_ACTIONS, ...SECONDARY_FEATURES, ...OPERATIONAL_FEATURES, ...FOOTER_LINKS]
    .map((i) => i.href)
    .filter((h) => h.startsWith('/'));
  return Array.from(new Set(all));
}
