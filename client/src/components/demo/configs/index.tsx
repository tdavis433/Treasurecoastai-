import { faithHouseConfig } from "./faith-house";
import { pawsSudsConfig } from "./paws-suds";
import { lawFirmConfig } from "./law-firm";
import { dentalClinicConfig } from "./dental-clinic";
import { boutiqueHotelConfig } from "./boutique-hotel";
import { roofingCompanyConfig } from "./roofing-company";
import { weddingVenueConfig } from "./wedding-venue";
import { autoShopConfig } from "./auto-shop";
import { barberConfig } from "./barber";
import { fitnessConfig } from "./fitness";
import { medSpaConfig } from "./med-spa";
import { realEstateConfig } from "./real-estate";
import { restaurantConfig } from "./restaurant";
import { tattooConfig } from "./tattoo";
import { handymanConfig } from "./handyman";
import { recoveryHouseConfig } from "./recovery-house";
import { DemoPageConfig } from "../DemoPageTemplate";

// Map URL slugs to demo configs
export const demoConfigs: Record<string, DemoPageConfig> = {
  // New premium demos
  "faith-house": faithHouseConfig,
  "paws-suds": pawsSudsConfig,
  "harper-law": lawFirmConfig,
  "coastal-smiles": dentalClinicConfig,
  "palm-resort": boutiqueHotelConfig,
  "tc-roofing": roofingCompanyConfig,
  "oceanview-gardens": weddingVenueConfig,
  // Existing businesses
  "sunrise-auto": autoShopConfig,
  "classic-cuts": barberConfig,
  "neon-harbor-fitness": fitnessConfig,
  "blue-harbor-medspa": medSpaConfig,
  "coastal-realty": realEstateConfig,
  "sunset-bistro": restaurantConfig,
  "inkwell-tattoo": tattooConfig,
  "handy-helpers": handymanConfig,
  "new-horizons": recoveryHouseConfig,
};

// Get demo config by URL slug
export function getDemoConfig(slug: string): DemoPageConfig | undefined {
  return demoConfigs[slug];
}

// Get all demo configs as an array with their slugs
export function getAllDemos(): { slug: string; config: DemoPageConfig }[] {
  return Object.entries(demoConfigs).map(([slug, config]) => ({ slug, config }));
}

// Group demos by category
export function getDemosByCategory(): Record<string, { slug: string; config: DemoPageConfig }[]> {
  const categories: Record<string, string[]> = {
    "Healthcare & Wellness": ["faith-house", "new-horizons", "coastal-smiles", "blue-harbor-medspa", "neon-harbor-fitness"],
    "Professional Services": ["harper-law", "coastal-realty"],
    "Home Services": ["tc-roofing", "handy-helpers", "sunrise-auto"],
    "Hospitality & Events": ["palm-resort", "oceanview-gardens", "sunset-bistro"],
    "Personal Care": ["paws-suds", "classic-cuts", "inkwell-tattoo"],
  };

  const result: Record<string, { slug: string; config: DemoPageConfig }[]> = {};
  
  for (const [category, slugs] of Object.entries(categories)) {
    result[category] = slugs
      .filter(slug => demoConfigs[slug])
      .map(slug => ({ slug, config: demoConfigs[slug] }));
  }
  
  return result;
}

export {
  faithHouseConfig,
  pawsSudsConfig,
  lawFirmConfig,
  dentalClinicConfig,
  boutiqueHotelConfig,
  roofingCompanyConfig,
  weddingVenueConfig,
  autoShopConfig,
  barberConfig,
  fitnessConfig,
  medSpaConfig,
  realEstateConfig,
  restaurantConfig,
  tattooConfig,
  handymanConfig,
  recoveryHouseConfig,
};
