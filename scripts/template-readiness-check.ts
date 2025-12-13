/**
 * Template Readiness Check Script
 * 
 * Validates that all demo templates meet minimum content and industry compliance requirements.
 * 
 * Requirements:
 * 1. Template Readiness Minimums:
 *    - Must have: businessName default
 *    - Must have: operatingHours structure
 *    - Must have: 6+ services OR 8+ FAQs OR about >= 50 chars
 * 
 * 2. Industry Disclaimers Enforced:
 *    - Law firm: not legal advice disclaimer
 *    - Dental/Med spa: not medical advice/emergency guidance
 *    - Recovery: safety/crisis guidance toggle
 * 
 * Output: TEMPLATE_READINESS_REPORT.md
 * 
 * Usage:
 *   npx tsx scripts/template-readiness-check.ts
 */

import {
  DEMO_TEMPLATE_CONFIGS,
  DemoTemplateConfig,
  getDemoTemplateSlugs,
} from '../shared/demo-template-configs';
import {
  getBookingProfileForBotType,
} from '../shared/industry-booking-profiles';
import * as fs from 'fs';
import * as path from 'path';

const MINIMUM_SERVICES = 6;
const MINIMUM_FAQS = 8;
const MINIMUM_ABOUT_LENGTH = 50;

const DISCLAIMER_REQUIRED_TYPES: Record<string, { requiredPattern: RegExp; description: string; isWarning?: boolean }> = {
  law_firm: {
    requiredPattern: /(not|no)\s*(legal\s*advice|substitute.*legal)/i,
    description: 'Must include "not legal advice" disclaimer',
  },
  legal: {
    requiredPattern: /(not|no)\s*(legal\s*advice|substitute.*legal)/i,
    description: 'Must include "not legal advice" disclaimer',
  },
  dental: {
    requiredPattern: /(not|no)\s*(medical\s*advice|substitute.*medical)|emergenc(y|ies)\s*(call\s*)?911/i,
    description: 'Must include "not medical advice" or emergency 911 guidance',
  },
  dental_clinic: {
    requiredPattern: /(not|no)\s*(medical\s*advice|substitute.*medical)|emergenc(y|ies)\s*(call\s*)?911/i,
    description: 'Must include "not medical advice" or emergency 911 guidance',
  },
  medspa: {
    requiredPattern: /(not|no)\s*(medical\s*advice|substitute.*medical)|emergenc(y|ies)\s*(call\s*)?911/i,
    description: 'Must include "not medical advice" or emergency 911 guidance',
  },
  med_spa: {
    requiredPattern: /(not|no)\s*(medical\s*advice|substitute.*medical)|emergenc(y|ies)\s*(call\s*)?911/i,
    description: 'Must include "not medical advice" or emergency 911 guidance',
  },
  sober_living: {
    requiredPattern: /crisis|safety|hotline|988|emergency/i,
    description: 'Must have crisis/safety guidance toggle enabled',
    isWarning: false,
  },
  recovery_housing: {
    requiredPattern: /crisis|safety|hotline|988|emergency/i,
    description: 'Must have crisis/safety guidance toggle enabled',
    isWarning: false,
  },
  recovery: {
    requiredPattern: /crisis|safety|hotline|988|emergency/i,
    description: 'Must have crisis/safety guidance toggle enabled',
    isWarning: false,
  },
};

interface ValidationResult {
  slug: string;
  businessName: string;
  businessType: string;
  passed: boolean;
  
  contentCheck: {
    hasBusinessName: boolean;
    serviceCount: number;
    faqCount: number;
    aboutLength: number;
    passesMinimum: boolean;
  };
  
  operatingHoursCheck: {
    hasOperatingHours: boolean;
    hasSchedule: boolean;
    hasTimezone: boolean;
    hasAfterHoursMessage: boolean;
    valid: boolean;
  };
  
  disclaimerCheck: {
    required: boolean;
    hasDisclaimer: boolean;
    disclaimerText: string | null;
    templateHasSafetySettings: boolean;
    safetySettingsEnabled: boolean;
    isWarning: boolean;
    description: string | null;
  };
  
  errors: string[];
  warnings: string[];
}

function validateOperatingHours(config: DemoTemplateConfig): ValidationResult['operatingHoursCheck'] {
  const hours = config.operatingHours;
  
  if (!hours) {
    return {
      hasOperatingHours: false,
      hasSchedule: false,
      hasTimezone: false,
      hasAfterHoursMessage: false,
      valid: false,
    };
  }
  
  const hasSchedule = !!hours.schedule && 
    typeof hours.schedule.monday === 'object' &&
    typeof hours.schedule.tuesday === 'object' &&
    typeof hours.schedule.wednesday === 'object' &&
    typeof hours.schedule.thursday === 'object' &&
    typeof hours.schedule.friday === 'object' &&
    typeof hours.schedule.saturday === 'object' &&
    typeof hours.schedule.sunday === 'object';
  
  const hasTimezone = !!hours.timezone && hours.timezone.length > 0;
  const hasAfterHoursMessage = !!hours.afterHoursMessage && hours.afterHoursMessage.length > 0;
  
  return {
    hasOperatingHours: true,
    hasSchedule,
    hasTimezone,
    hasAfterHoursMessage,
    valid: hasSchedule && hasTimezone && hasAfterHoursMessage,
  };
}

function validateTemplate(config: DemoTemplateConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const hasBusinessName = !!config.businessName && config.businessName.trim().length > 0;
  if (!hasBusinessName) {
    errors.push('Missing businessName');
  }
  
  const serviceCount = config.services?.length ?? 0;
  const faqCount = config.faqs?.length ?? 0;
  const aboutLength = config.about?.length ?? 0;
  
  const passesMinimum = 
    serviceCount >= MINIMUM_SERVICES || 
    faqCount >= MINIMUM_FAQS || 
    aboutLength >= MINIMUM_ABOUT_LENGTH;
  
  if (!passesMinimum) {
    errors.push(`Content minimum not met: needs ${MINIMUM_SERVICES}+ services OR ${MINIMUM_FAQS}+ FAQs OR ${MINIMUM_ABOUT_LENGTH}+ char about (has ${serviceCount} services, ${faqCount} FAQs, ${aboutLength} char about)`);
  }
  
  const operatingHoursCheck = validateOperatingHours(config);
  if (!operatingHoursCheck.hasOperatingHours) {
    errors.push('Missing operatingHours structure');
  } else if (!operatingHoursCheck.valid) {
    const missing: string[] = [];
    if (!operatingHoursCheck.hasSchedule) missing.push('schedule');
    if (!operatingHoursCheck.hasTimezone) missing.push('timezone');
    if (!operatingHoursCheck.hasAfterHoursMessage) missing.push('afterHoursMessage');
    errors.push(`operatingHours incomplete: missing ${missing.join(', ')}`);
  }
  
  const profile = getBookingProfileForBotType(config.businessType);
  const disclaimerRule = DISCLAIMER_REQUIRED_TYPES[config.businessType];
  
  const templateHasSafetySettings = !!config.safetySettings;
  const safetySettingsEnabled = config.safetySettings?.crisisGuidanceEnabled === true;
  
  const disclaimerCheck: ValidationResult['disclaimerCheck'] = {
    required: !!disclaimerRule,
    hasDisclaimer: false,
    disclaimerText: profile.disclaimers?.text ?? null,
    templateHasSafetySettings,
    safetySettingsEnabled,
    isWarning: disclaimerRule?.isWarning ?? false,
    description: disclaimerRule?.description ?? null,
  };
  
  if (disclaimerRule) {
    const isRecoveryType = config.businessType.includes('sober') || 
                          config.businessType.includes('recovery');
    
    if (isRecoveryType) {
      disclaimerCheck.hasDisclaimer = safetySettingsEnabled;
      
      if (!safetySettingsEnabled) {
        errors.push(`Missing required safety settings: ${disclaimerRule.description}`);
      }
    } else {
      if (profile.disclaimers?.enabled && profile.disclaimers?.text) {
        disclaimerCheck.hasDisclaimer = disclaimerRule.requiredPattern.test(profile.disclaimers.text);
      }
      
      if (!disclaimerCheck.hasDisclaimer) {
        errors.push(`Missing required disclaimer: ${disclaimerRule.description}`);
      }
    }
  }
  
  const passed = errors.length === 0;
  
  return {
    slug: config.slug,
    businessName: config.businessName,
    businessType: config.businessType,
    passed,
    contentCheck: {
      hasBusinessName,
      serviceCount,
      faqCount,
      aboutLength,
      passesMinimum,
    },
    operatingHoursCheck,
    disclaimerCheck,
    errors,
    warnings,
  };
}

function generateReport(results: ValidationResult[]): string {
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  const withWarnings = results.filter(r => r.warnings.length > 0);
  
  const timestamp = new Date().toISOString();
  
  let report = `# Template Readiness Report

Generated: ${timestamp}

## Summary

| Metric | Count |
|--------|-------|
| Total Templates | ${results.length} |
| Passed | ${passed.length} |
| Failed | ${failed.length} |
| With Warnings | ${withWarnings.length} |

**Overall Status: ${failed.length === 0 ? '✅ ALL TEMPLATES READY' : '❌ ISSUES DETECTED'}**

---

## Template Status

`;

  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    const warningBadge = r.warnings.length > 0 ? ' ⚠️' : '';
    
    report += `### ${r.businessName} (${r.businessType}) ${status}${warningBadge}

| Check | Status | Details |
|-------|--------|---------|
| Business Name | ${r.contentCheck.hasBusinessName ? '✅' : '❌'} | "${r.businessName}" |
| Services | ${r.contentCheck.serviceCount >= MINIMUM_SERVICES ? '✅' : '⚪'} | ${r.contentCheck.serviceCount} (min: ${MINIMUM_SERVICES}) |
| FAQs | ${r.contentCheck.faqCount >= MINIMUM_FAQS ? '✅' : '⚪'} | ${r.contentCheck.faqCount} (min: ${MINIMUM_FAQS}) |
| About | ${r.contentCheck.aboutLength >= MINIMUM_ABOUT_LENGTH ? '✅' : '⚪'} | ${r.contentCheck.aboutLength} chars (min: ${MINIMUM_ABOUT_LENGTH}) |
| Content Minimum | ${r.contentCheck.passesMinimum ? '✅' : '❌'} | ${r.contentCheck.passesMinimum ? 'Met' : 'Not Met'} |
| Operating Hours | ${r.operatingHoursCheck.valid ? '✅' : '❌'} | ${r.operatingHoursCheck.valid ? 'Valid structure' : 'Missing or invalid'} |
`;

    if (r.operatingHoursCheck.hasOperatingHours) {
      report += `| - Schedule | ${r.operatingHoursCheck.hasSchedule ? '✅' : '❌'} | ${r.operatingHoursCheck.hasSchedule ? 'Complete' : 'Missing'} |
| - Timezone | ${r.operatingHoursCheck.hasTimezone ? '✅' : '❌'} | ${r.operatingHoursCheck.hasTimezone ? 'Set' : 'Missing'} |
| - After Hours Msg | ${r.operatingHoursCheck.hasAfterHoursMessage ? '✅' : '❌'} | ${r.operatingHoursCheck.hasAfterHoursMessage ? 'Set' : 'Missing'} |
`;
    }

    if (r.disclaimerCheck.required) {
      const disclaimerStatus = r.disclaimerCheck.hasDisclaimer 
        ? '✅' 
        : (r.disclaimerCheck.isWarning ? '⚠️' : '❌');
      report += `| Disclaimer | ${disclaimerStatus} | ${r.disclaimerCheck.description} |
`;
      if (r.disclaimerCheck.disclaimerText) {
        report += `| Disclaimer Text | - | "${r.disclaimerCheck.disclaimerText}" |
`;
      }
      if (r.disclaimerCheck.templateHasSafetySettings) {
        report += `| Safety Settings | ${r.disclaimerCheck.safetySettingsEnabled ? '✅' : '❌'} | Crisis guidance ${r.disclaimerCheck.safetySettingsEnabled ? 'enabled' : 'disabled'} |
`;
      }
    }

    if (r.errors.length > 0) {
      report += `
**Errors:**
`;
      for (const err of r.errors) {
        report += `- ❌ ${err}
`;
      }
    }

    if (r.warnings.length > 0) {
      report += `
**Warnings:**
`;
      for (const warn of r.warnings) {
        report += `- ⚠️ ${warn}
`;
      }
    }

    report += `
---

`;
  }

  report += `## Industry Compliance Coverage

| Industry Type | Compliance Method | Status | Details |
|---------------|-------------------|--------|---------|
`;

  const industriesChecked = new Set<string>();
  for (const r of results) {
    if (industriesChecked.has(r.businessType)) continue;
    industriesChecked.add(r.businessType);
    
    const profile = getBookingProfileForBotType(r.businessType);
    const hasDisclaimer = profile.disclaimers?.enabled && profile.disclaimers?.text;
    const config = DEMO_TEMPLATE_CONFIGS[r.slug];
    const hasSafety = config?.safetySettings?.crisisGuidanceEnabled ?? false;
    
    const isRecoveryType = r.businessType.includes('sober') || r.businessType.includes('recovery');
    const requiresCompliance = !!DISCLAIMER_REQUIRED_TYPES[r.businessType];
    
    let complianceMethod = 'None Required';
    let status = '⚪';
    let details = 'No special compliance required';
    
    if (isRecoveryType) {
      complianceMethod = 'Safety Settings';
      status = hasSafety ? '✅' : '❌';
      details = hasSafety ? 'Crisis guidance enabled' : 'Missing crisis guidance';
    } else if (requiresCompliance) {
      complianceMethod = 'Booking Profile';
      status = hasDisclaimer ? '✅' : '❌';
      details = profile.disclaimers?.text || 'Missing disclaimer';
    }
    
    report += `| ${r.businessType} | ${complianceMethod} | ${status} | ${details} |
`;
  }

  report += `
---

## Minimum Content Requirements

Templates must meet **at least one** of the following:
- **${MINIMUM_SERVICES}+ services** defined
- **${MINIMUM_FAQS}+ FAQs** defined  
- **${MINIMUM_ABOUT_LENGTH}+ character** about/description text

## Operating Hours Requirements

Templates must have a valid operatingHours structure with:
- **schedule** - Daily open/close times for all 7 days
- **timezone** - Valid timezone string (e.g., "America/New_York")
- **afterHoursMessage** - Message shown outside business hours

## Industry Disclaimer Requirements

| Industry | Requirement |
|----------|-------------|
| Law Firm | Must include "not legal advice" disclaimer in booking profile |
| Dental / Med Spa | Must include "not medical advice" or emergency 911 guidance |
| Sober Living / Recovery | Must have crisis/safety guidance toggle enabled in template |

---

*Report generated by template-readiness-check.ts*
*Using canonical source: shared/demo-template-configs.ts*
`;

  return report;
}

function main(): void {
  console.log('Running template readiness check...\n');
  console.log('Using canonical source: shared/demo-template-configs.ts\n');
  
  const results: ValidationResult[] = [];
  const slugs = getDemoTemplateSlugs();
  
  for (const slug of slugs) {
    const config = DEMO_TEMPLATE_CONFIGS[slug];
    if (!config) continue;
    
    const result = validateTemplate(config);
    results.push(result);
    
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.businessName} (${result.businessType})`);
    
    for (const err of result.errors) {
      console.log(`   ❌ ${err}`);
    }
    for (const warn of result.warnings) {
      console.log(`   ⚠️ ${warn}`);
    }
  }
  
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  
  console.log('\n========================================');
  console.log(`  TEMPLATE READINESS CHECK COMPLETE`);
  console.log('========================================');
  console.log(`Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
  
  const report = generateReport(results);
  const reportPath = path.join(process.cwd(), 'TEMPLATE_READINESS_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport written to: ${reportPath}`);
  
  if (failed.length === 0) {
    console.log('\n✅ ALL TEMPLATES READY');
  } else {
    console.log('\n❌ TEMPLATE READINESS ISSUES DETECTED');
    for (const f of failed) {
      console.log(`   - ${f.businessName}: ${f.errors.join('; ')}`);
    }
  }
  
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
