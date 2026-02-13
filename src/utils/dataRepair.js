import { SecurityUtil } from './security';
import { APP_CONFIG } from '../constants/appConfig';

/**
 * Detect and repair orphaned applications (jobs without corresponding company entries)
 */
export const repairOrphanedApplications = (jobs, companies) => {
  if (!jobs || !Array.isArray(jobs) || !companies || typeof companies !== 'object') {
    return { companiesCreated: 0, companiesChecked: new Set() };
  }

  // Build a map of existing company names (lowercased for comparison)
  const existingCompanies = new Set();
  Object.values(companies).forEach(categoryList => {
    if (Array.isArray(categoryList)) {
      categoryList.forEach(company => {
        const name = typeof company?.name === 'string' ? company.name.trim().toLowerCase() : '';
        if (name) existingCompanies.add(name);
      });
    }
  });

  // Find unique job company names that aren't in the companies table
  const orphanedCompanies = new Set();
  jobs.forEach(job => {
    const companyName = typeof job?.company === 'string' ? job.company.trim() : '';
    if (companyName) {
      const companyKey = companyName.toLowerCase();
      if (!existingCompanies.has(companyKey)) {
        orphanedCompanies.add(companyName);
      }
    }
  });

  return {
    orphanedCount: orphanedCompanies.size,
    orphanedCompanies: Array.from(orphanedCompanies),
    existingCompanies
  };
};

/**
 * Create company entries for orphaned applications
 * Returns updated companies object
 */
export const createCompaniesForOrphaned = (jobs, companies, orphanedCompanyNames) => {
  if (!orphanedCompanyNames || orphanedCompanyNames.length === 0) {
    return companies;
  }

  let updated = { ...companies };

  orphanedCompanyNames.forEach(companyName => {
    try {
      const validated = SecurityUtil.validateCompanyData({
        name: companyName.trim(),
        url: '',
        category: 'None',
        fitLevel: null
      });

      const category = validated.category || 'None';
      if (!updated[category]) {
        updated[category] = [];
      }

      // Check if company already exists (case-insensitive)
      const companyKey = validated.name.toLowerCase();
      const exists = updated[category].some(
        c => typeof c?.name === 'string' && c.name.toLowerCase() === companyKey
      );

      if (!exists) {
        updated[category].push({
          name: validated.name,
          url: validated.url,
          fitLevel: validated.fitLevel
        });
      }
    } catch (error) {
      console.warn(`Failed to create company entry for "${companyName}":`, error);
    }
  });

  return updated;
};

/**
 * Run data repair check and return updated companies if needed
 * This is meant to be called on app initialization
 */
export const checkAndRepairData = (jobs, companies) => {
  const repair = repairOrphanedApplications(jobs, companies);

  if (repair.orphanedCount > 0) {
    console.warn(
      `Detected ${repair.orphanedCount} orphaned application(s) with missing companies:`,
      repair.orphanedCompanies
    );

    const repaired = createCompaniesForOrphaned(jobs, companies, repair.orphanedCompanies);
    return {
      repaired: true,
      companiesCreated: repair.orphanedCount,
      updatedCompanies: repaired
    };
  }

  return {
    repaired: false,
    companiesCreated: 0,
    updatedCompanies: companies
  };
};
