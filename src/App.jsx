import React, { useState, useEffect, useRef } from 'react';
import { APP_CONFIG } from './constants/appConfig';
import { JOB_STATUSES } from './constants/jobStatuses';
import { PROGRESSION_STAGES } from './constants/progressionStages';
import { StorageUtil } from './utils/storage';
import { SecurityUtil } from './utils/security';
import { PerformanceUtil } from './utils/performance';
import { Header, Footer } from './components/layout';
import { AnalyticsDashboard } from './components/dashboard';
import { JobModal, ImportModal, CompanyModal } from './components/modals';
import { Companies, JobsTable } from './components/pages';

/**
 * Main App Component
 *
 * Full-featured job search dashboard with:
 * - Dashboard analytics view
 * - Companies management view
 * - Jobs table view with filtering and sorting
 * - Import/export functionality
 * - Theme toggling
 */
function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Core state
  const [view, setView] = useState("dashboard");
  const [jobs, setJobs] = useState([]);
  const [customCompanies, setCustomCompanies] = useState({});
  const [blockedCompanies, setBlockedCompanies] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [lastBackupTime, setLastBackupTime] = useState(null);
  const [prefillCompany, setPrefillCompany] = useState(null);
  const hasLoadedRef = useRef(false);
  const skipCompaniesSaveRef = useRef(true);
  const skipBlockedSaveRef = useRef(true);

  const normalizeBlockedCompanies = (value) => {
    if (!value) return [];
    const list = Array.isArray(value) ? value : [value];
    return list
      .map(item => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') return String(item.name || item.company || '').trim();
        return '';
      })
      .filter(Boolean);
  };

  // Jobs table filters and sorting
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', company: '', search: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'dateApplied', direction: 'desc' });

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedJobs = StorageUtil.get(APP_CONFIG.STORAGE_KEYS.JOBS, []);
      if (Array.isArray(savedJobs) && savedJobs.length > 0) {
        const validJobs = savedJobs.filter(job => {
          try {
            return SecurityUtil.validateJobData(job);
          } catch {
            return false;
          }
        });
        setJobs(validJobs);
      }

      const savedCompanies = StorageUtil.get(APP_CONFIG.STORAGE_KEYS.CUSTOM_COMPANIES, {});
      if (savedCompanies) {
        const normalizedSource = normalizeCompanySource(savedCompanies);
        if (normalizedSource && (typeof normalizedSource === 'object' || Array.isArray(normalizedSource))) {
          setCustomCompanies(normalizeCompanyCollections(normalizedSource));
        }
      }

      const savedBlocked = StorageUtil.get(APP_CONFIG.STORAGE_KEYS.BLOCKED_COMPANIES, []);
      setBlockedCompanies(normalizeBlockedCompanies(savedBlocked));

      const savedDeleted = localStorage.getItem('deletedCategories');
      if (savedDeleted) {
        setDeletedCategories(JSON.parse(savedDeleted));
      }

      const savedBackupTime = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LAST_BACKUP);
      if (savedBackupTime) {
        const backupDate = new Date(savedBackupTime);
        if (!isNaN(backupDate.getTime())) {
          setLastBackupTime(backupDate);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      hasLoadedRef.current = true;
    }
  }, []);

  // Debounced save for jobs
  const debouncedSaveJobs = useRef(
    PerformanceUtil.debounce((jobsData) => {
      StorageUtil.set(APP_CONFIG.STORAGE_KEYS.JOBS, jobsData);
    }, 1000)
  ).current;

  // Save jobs when changed
  useEffect(() => {
    if (jobs.length > 0) {
      debouncedSaveJobs(jobs);
    }
  }, [jobs, debouncedSaveJobs]);

  // Save companies when changed
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (skipCompaniesSaveRef.current) {
      skipCompaniesSaveRef.current = false;
      return;
    }
    StorageUtil.set(APP_CONFIG.STORAGE_KEYS.CUSTOM_COMPANIES, customCompanies);
  }, [customCompanies]);

  // Save blocked companies when changed
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (skipBlockedSaveRef.current) {
      skipBlockedSaveRef.current = false;
      return;
    }
    StorageUtil.set(APP_CONFIG.STORAGE_KEYS.BLOCKED_COMPANIES, blockedCompanies);
  }, [blockedCompanies]);

  // Save deleted categories when changed
  useEffect(() => {
    localStorage.setItem('deletedCategories', JSON.stringify(deletedCategories));
  }, [deletedCategories]);

  // Confetti animation for progression
  const launchConfetti = () => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999';
    document.body.appendChild(container);

    const colors = ['#6b8aff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const total = 36;

    for (let i = 0; i < total; i++) {
      const piece = document.createElement('div');
      const width = 6 + Math.random() * 6;
      const height = width * (1.4 + Math.random() * 0.6);
      const startLeft = Math.random() * 100;
      const rotateStart = Math.random() * 360;

      piece.style.cssText = `position:absolute;top:-16px;left:${startLeft}%;width:${width}px;height:${height}px;background:${colors[i % colors.length]};opacity:1;border-radius:2px;transform:translate3d(0,0,0) rotate(${rotateStart}deg);mix-blend-mode:screen;`;
      container.appendChild(piece);

      const xOffset = (Math.random() - 0.5) * 220;
      const yOffset = window.innerHeight * 0.98 + Math.random() * 200;
      const rotateEnd = rotateStart + (Math.random() - 0.5) * 1440;

      requestAnimationFrame(() => {
        piece.style.transition = `transform 2.2s ease-out, opacity 2.2s ease-out`;
        piece.style.transitionDelay = `${Math.random() * 0.16}s`;
        piece.style.transform = `translate(${xOffset}px, ${yOffset}px) rotate(${rotateEnd}deg)`;
        piece.style.opacity = '0.4';
      });
    }

    setTimeout(() => container.remove(), 2600);
  };

  // Job CRUD operations
  const addJob = (job) => {
    try {
      const validatedJob = SecurityUtil.validateJobData({
        ...job,
        id: Date.now()
      });
      setJobs(prev => [...prev, validatedJob]);
      setShowModal(false);
      setEditingJob(null);
      setPrefillCompany(null);
    } catch (error) {
      alert('Error saving job: ' + error.message);
    }
  };

  const updateJob = (updatedJob) => {
    try {
      const validatedJob = SecurityUtil.validateJobData(updatedJob);
      const oldJob = jobs.find(j => j.id === validatedJob.id);

      // Check for progression advancement
      const progressionOrder = Object.values(PROGRESSION_STAGES);
      const oldProgIdx = progressionOrder.indexOf(oldJob?.progression || PROGRESSION_STAGES.APPLICATION);
      const newProgIdx = progressionOrder.indexOf(validatedJob.progression || PROGRESSION_STAGES.APPLICATION);

      if (newProgIdx > oldProgIdx ||
          (oldJob?.status === JOB_STATUSES.APPLIED && validatedJob.status === JOB_STATUSES.IN_PROGRESS)) {
        launchConfetti();
      }

      setJobs(jobs.map(j => j.id === validatedJob.id ? validatedJob : j));
      setShowModal(false);
      setEditingJob(null);
    } catch (error) {
      alert('Error updating job: ' + error.message);
    }
  };

  const deleteJob = (id) => {
    if (confirm("Are you sure you want to delete this job?")) {
      setJobs(jobs.filter(j => j.id !== id));
    }
  };

  // Export backup
  const exportBackup = () => {
    try {
      const backupData = {
        jobs,
        customCompanies,
        blockedCompanies
      };

      const backup = {
        version: APP_CONFIG.VERSION,
        exportDate: new Date().toISOString(),
        checksum: SecurityUtil.generateChecksum(backupData),
        data: backupData
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      const now = new Date();
      setLastBackupTime(now);
      StorageUtil.set(APP_CONFIG.STORAGE_KEYS.LAST_BACKUP, now.toISOString());
      alert("Backup downloaded successfully!");
    } catch (error) {
      alert('Error exporting backup: ' + error.message);
    }
  };

  // Export CSV
  const exportCSV = () => {
    try {
      const headers = ['Company', 'Role', 'Status', 'Priority', 'Date Applied', 'Salary', 'Location', 'Progression', 'Close Reason', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...jobs.map(job => [
          `"${(job.company || '').replace(/"/g, '""')}"`,
          `"${(job.role || '').replace(/"/g, '""')}"`,
          `"${(job.status || '').replace(/"/g, '""')}"`,
          `"${(job.priority || '').replace(/"/g, '""')}"`,
          `"${job.dateApplied || ''}"`,
          `"${(job.salary || '').replace(/"/g, '""')}"`,
          `"${(job.location || '').replace(/"/g, '""')}"`,
          `"${(job.progression || '').replace(/"/g, '""')}"`,
          `"${(job.closeReason || '').replace(/"/g, '""')}"`,
          `"${(job.notes || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting CSV: ' + error.message);
    }
  };

  function normalizeCompanySource(source) {
    if (!source) return null;

    let normalized = source;
    if (typeof normalized === 'string') {
      try {
        normalized = JSON.parse(normalized);
      } catch (error) {
        console.warn('Unable to parse stored company data:', error);
        return null;
      }
    }

    if (normalized && typeof normalized === 'object' && normalized.data) {
      normalized = normalized.data;
    }

    return normalized;
  }

  function normalizeCompanyCollections(collections) {
    if (!collections || (typeof collections !== 'object' && !Array.isArray(collections))) {
      return { None: [] };
    }

    const normalized = {};
    const rootCollections = Array.isArray(collections)
      ? collections
      : (
          collections.customCompanies ??
          collections.categories ??
          collections.companyCategories ??
          collections.companies ??
          collections
        );

    const upsertCompany = (entry, fallbackCategory = 'None') => {
      if (!entry) {
        return;
      }

      try {
        const validated = SecurityUtil.validateCompanyData({
          ...entry,
          category: entry.category || fallbackCategory || 'None'
        });

        const categoryKey = validated.category || 'None';
        if (!Array.isArray(normalized[categoryKey])) {
          normalized[categoryKey] = [];
        }

        const sanitizedCompany = {
          name: validated.name,
          url: validated.url,
          fitLevel: validated.fitLevel
        };

        const existingIndex = normalized[categoryKey].findIndex(company => company.name === sanitizedCompany.name);
        if (existingIndex >= 0) {
          normalized[categoryKey][existingIndex] = sanitizedCompany;
        } else {
          normalized[categoryKey].push(sanitizedCompany);
        }
      } catch (error) {
        console.warn('Skipping invalid company entry during normalization:', entry, error);
      }
    };

    const processValue = (value, categoryHint) => {
      if (Array.isArray(value)) {
        value.forEach(company => upsertCompany(company, categoryHint));
        return;
      }

      if (value && typeof value === 'object') {
        if (value.name || value.url || value.category) {
          upsertCompany(value, categoryHint);
          return;
        }

        if (Array.isArray(value.companies)) {
          value.companies.forEach(company => upsertCompany(company, categoryHint));
          return;
        }

        if (value.companies && typeof value.companies === 'object') {
          Object.values(value.companies).forEach(company => upsertCompany(company, categoryHint));
          return;
        }

        const nestedCompanies = Object.values(value).filter(entry =>
          entry && typeof entry === 'object' && (entry.name || entry.url || entry.category)
        );
        if (nestedCompanies.length > 0) {
          nestedCompanies.forEach(company => upsertCompany(company, categoryHint));
        }
      }
    };

    if (Array.isArray(rootCollections)) {
      processValue(rootCollections);
    } else {
      Object.entries(rootCollections).forEach(([categoryKey, value]) => {
        processValue(value, categoryKey);
      });
    }

    if (!normalized.None) {
      normalized.None = [];
    }

    return normalized;
  }

  function mergeCompanyCollections(existingCollections = {}, incomingCollections = {}) {
    const base = normalizeCompanyCollections(existingCollections);
    const incoming = normalizeCompanyCollections(incomingCollections);

    const merged = Object.entries(base).reduce((acc, [category, companies]) => {
      acc[category] = [...companies];
      return acc;
    }, {});

    Object.entries(incoming).forEach(([category, companies]) => {
      if (!merged[category]) {
        merged[category] = [];
      }

      const existingNames = new Set(merged[category].map(company => company.name));

      companies.forEach(company => {
        if (existingNames.has(company.name)) {
          merged[category] = merged[category].map(existingCompany =>
            existingCompany.name === company.name ? company : existingCompany
          );
        } else {
          merged[category].push(company);
          existingNames.add(company.name);
        }
      });
    });

    if (!merged.None) {
      merged.None = [];
    }

    return merged;
  }

  // Import backup
  const importBackup = (fileContent, mode = 'replace') => {
    try {
      const data = SecurityUtil.validateImportData(fileContent);
      const importData = normalizeCompanySource(data) || data;
      const importedCompanies = (
        importData.customCompanies ??
        importData.categories ??
        importData.companyCategories ??
        importData.companies ??
        {}
      );
      const normalizedCompanies = normalizeCompanyCollections(importedCompanies);

      if (mode === 'replace') {
        setJobs(importData.jobs || []);
        setCustomCompanies(normalizedCompanies);
        StorageUtil.set(APP_CONFIG.STORAGE_KEYS.CUSTOM_COMPANIES, normalizedCompanies);
        const normalizedBlocked = normalizeBlockedCompanies(importData.blockedCompanies);
        setBlockedCompanies(normalizedBlocked);
        StorageUtil.set(APP_CONFIG.STORAGE_KEYS.BLOCKED_COMPANIES, normalizedBlocked);
      } else {
        // Merge mode
        setJobs(prevJobs => {
          const existingKeys = new Set(prevJobs.map(j => `${j.company}-${j.role}-${j.dateApplied}`));
          const dedupedJobs = (importData.jobs || []).filter(j =>
            !existingKeys.has(`${j.company}-${j.role}-${j.dateApplied}`)
          );
          return [...prevJobs, ...dedupedJobs];
        });

        setCustomCompanies(prev => {
          const merged = mergeCompanyCollections(prev, normalizedCompanies);
          StorageUtil.set(APP_CONFIG.STORAGE_KEYS.CUSTOM_COMPANIES, merged);
          return merged;
        });

        const normalizedBlocked = normalizeBlockedCompanies(importData.blockedCompanies);
        if (normalizedBlocked.length > 0) {
          setBlockedCompanies(prev => {
            const merged = Array.from(new Set([...normalizeBlockedCompanies(prev), ...normalizedBlocked]));
            StorageUtil.set(APP_CONFIG.STORAGE_KEYS.BLOCKED_COMPANIES, merged);
            return merged;
          });
        }
      }

      setShowImportModal(false);
      alert(`Import complete! ${mode === 'replace' ? 'Data replaced.' : 'Data merged.'}`);
    } catch (error) {
      alert('Error importing: ' + error.message);
    }
  };

  // Company operations
  const handleUpdateCompany = (companyName, updates) => {
    if (companyName === null) {
      // Handle category operations
      if (updates.newCategory) {
        setCustomCompanies(prev => ({
          ...prev,
          [updates.newCategory]: prev[updates.newCategory] || []
        }));
      } else if (updates.deleteCategory) {
        const categoryToDelete = updates.deleteCategory;
        setCustomCompanies(prev => {
          const updated = { ...prev };
          const companiesInCategory = updated[categoryToDelete] || [];
          // Move companies to 'None'
          updated['None'] = [...(updated['None'] || []), ...companiesInCategory];
          delete updated[categoryToDelete];
          return updated;
        });
        setDeletedCategories(prev => [...prev, categoryToDelete]);
      } else if (updates.renameCategory) {
        const { oldName, newName } = updates.renameCategory;
        setCustomCompanies(prev => {
          const updated = { ...prev };
          updated[newName] = updated[oldName] || [];
          delete updated[oldName];
          return updated;
        });
      }
      return;
    }

    // Update individual company
    setCustomCompanies(prev => {
      const updated = { ...prev };

      // Find current category
      let currentCategory = null;
      for (const [cat, companies] of Object.entries(updated)) {
        if (companies.some(c => c.name === companyName)) {
          currentCategory = cat;
          break;
        }
      }

      if (currentCategory) {
        // Update the company in its current category
        const companyIndex = updated[currentCategory].findIndex(c => c.name === companyName);
        if (companyIndex !== -1) {
          const company = { ...updated[currentCategory][companyIndex] };

          // Apply updates
          if (updates.name) company.name = updates.name;
          if (updates.url) company.url = updates.url;
          if (updates.fitLevel !== undefined) company.fitLevel = updates.fitLevel;

          // Handle category change
          if (updates.category && updates.category !== currentCategory) {
            // Remove from old category
            updated[currentCategory] = updated[currentCategory].filter((_, i) => i !== companyIndex);
            // Add to new category
            if (!updated[updates.category]) {
              updated[updates.category] = [];
            }
            updated[updates.category].push(company);
          } else {
            updated[currentCategory][companyIndex] = company;
          }
        }
      }

      return updated;
    });
  };

  const handleDeleteCompany = (companyName) => {
    const normalizedName = typeof companyName === 'string'
      ? companyName.trim()
      : String(companyName?.name || companyName?.company || '').trim();
    if (!normalizedName) return;
    setBlockedCompanies(prev => {
      const normalizedPrev = normalizeBlockedCompanies(prev);
      return normalizedPrev.includes(normalizedName)
        ? normalizedPrev
        : [...normalizedPrev, normalizedName];
    });
  };

  const handleUnhideCompany = (companyName) => {
    const normalizedName = typeof companyName === 'string'
      ? companyName.trim()
      : String(companyName?.name || companyName?.company || '').trim();
    if (!normalizedName) return;
    setBlockedCompanies(prev => normalizeBlockedCompanies(prev).filter(name => name !== normalizedName));
  };

  const handleAddJobFromCompany = (company) => {
    setPrefillCompany(company);
    setEditingJob(null);
    setShowModal(true);
  };

  const handleViewCompanyJobs = (companyName) => {
    setFilters(prev => ({ ...prev, search: companyName }));
    setView('jobs');
  };

  // Add company
  const addCompany = (company) => {
    try {
      const validated = SecurityUtil.validateCompanyData(company);
      const category = validated.category || 'None';
      setCustomCompanies(prev => {
        const updated = { ...prev };
        if (!updated[category]) {
          updated[category] = [];
        }
        updated[category].push({
          name: validated.name,
          url: validated.url,
          fitLevel: validated.fitLevel
        });
        return updated;
      });
      setShowCompanyModal(false);
    } catch (error) {
      alert('Error adding company: ' + error.message);
    }
  };

  // Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return ' ⇅';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Get sorted jobs
  const getSortedJobs = () => {
    const sorted = [...jobs];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        if (sortConfig.key === 'dateApplied' || sortConfig.key === 'followUp') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  };

  // Get all categories for the company modal
  const getAllCategories = () => {
    const categories = new Set(['None']);
    Object.keys(customCompanies).forEach(cat => categories.add(cat));
    return Array.from(categories).sort();
  };

  return (
    <div className="app">
      <Header
        view={view}
        setView={setView}
        onBackup={exportBackup}
        onImport={() => setShowImportModal(true)}
        lastBackupTime={lastBackupTime}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="main">
        {view === "dashboard" && <AnalyticsDashboard jobs={jobs} />}

        {view === "companies" && (
          <Companies
            companies={customCompanies}
            jobs={jobs}
            customCompanies={customCompanies}
            blockedCompanies={blockedCompanies}
            deletedCategories={deletedCategories}
            setDeletedCategories={setDeletedCategories}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
            onAddJob={handleAddJobFromCompany}
            onAddCompany={() => setShowCompanyModal(true)}
            onViewCompanyJobs={handleViewCompanyJobs}
            onUnhideCompany={handleUnhideCompany}
          />
        )}

        {view === "jobs" && (
          <JobsTable
            jobs={getSortedJobs()}
            filters={filters}
            setFilters={setFilters}
            onAdd={() => { setEditingJob(null); setPrefillCompany(null); setShowModal(true); }}
            onEdit={(job) => { setEditingJob(job); setShowModal(true); }}
            onUpdateJob={updateJob}
            onDelete={deleteJob}
            onExport={exportCSV}
            onBackup={exportBackup}
            requestSort={requestSort}
            getSortIcon={getSortIcon}
          />
        )}
      </main>

      {showModal && (
        <JobModal
          job={editingJob}
          prefillCompany={prefillCompany}
          onSave={editingJob?.id ? updateJob : addJob}
          onClose={() => { setShowModal(false); setEditingJob(null); setPrefillCompany(null); }}
        />
      )}

      {showCompanyModal && (
        <CompanyModal
          onSave={addCompany}
          onClose={() => setShowCompanyModal(false)}
          existingCategories={getAllCategories()}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={importBackup}
          onClose={() => setShowImportModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
