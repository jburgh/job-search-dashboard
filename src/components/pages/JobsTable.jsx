import React, { useState, useEffect, useRef } from 'react';
import { StatusBadge, PriorityBadge } from '../common';
import { JOB_STATUSES } from '../../constants/jobStatuses';
import { CLOSE_REASONS } from '../../constants/closeReasons';
import { PRIORITIES } from '../../constants/priorities';
import { PROGRESSIONS } from '../../constants/progressionStages';
import { UIUtil } from '../../utils/ui';

// Status and priority lists for filters
const STATUSES = Object.values(JOB_STATUSES);
const PRIORITY_LIST = Object.values(PRIORITIES);
const OPEN_STATUSES = [JOB_STATUSES.APPLIED, JOB_STATUSES.IN_PROGRESS];
const PROGRESSED_STAGES = PROGRESSIONS.filter(p => p !== 'Application');

/**
 * JobsTable Component
 *
 * Full-featured job applications table with:
 * - Multi-select status/priority filtering
 * - Date range filtering
 * - Column visibility toggle
 * - Sortable columns
 * - Pagination
 * - View/edit modal for job details
 * - Quick close action
 */
function JobsTable({
  jobs,
  filters,
  setFilters,
  onAdd,
  onEdit,
  onUpdateJob,
  onDelete,
  onExport,
  onBackup,
  requestSort,
  getSortIcon
}) {
  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalJob, setViewModalJob] = useState(null);
  const [viewModalEdit, setViewModalEdit] = useState(false);
  const [editedJobData, setEditedJobData] = useState(null);
  const notesTextareaRef = useRef(null);

  // Auto-expand textarea based on content
  const autoExpandTextarea = () => {
    if (notesTextareaRef.current) {
      notesTextareaRef.current.style.height = 'auto';
      notesTextareaRef.current.style.height = Math.max(notesTextareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    autoExpandTextarea();
  }, [viewModalJob, editedJobData, viewModalEdit]);

  // Read-only styling for view mode fields in job modal
  const viewFieldStyle = viewModalEdit ? {} : {
    background: 'var(--bg-tertiary)',
    border: '1px dashed var(--border-primary)',
    color: 'var(--text-secondary)',
    cursor: 'not-allowed'
  };

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    company: true,
    role: true,
    status: true,
    priority: false,
    dateApplied: true,
    salary: false,
    closeReason: false,
    progression: true,
    followUp: false,
    notes: false,
    resumeUrl: false,
    coverLetterUrl: false
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });

  // Multiselect filters
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedProgressionStages, setSelectedProgressionStages] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProgressionDropdown, setShowProgressionDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.filter-select') && !event.target.closest('[data-dropdown="status"]')) {
        setShowStatusDropdown(false);
      }
      if (showProgressionDropdown && !event.target.closest('.filter-select') && !event.target.closest('[data-dropdown="progression"]')) {
        setShowProgressionDropdown(false);
      }
      if (showPriorityDropdown && !event.target.closest('.filter-select') && !event.target.closest('[data-dropdown="priority"]')) {
        setShowPriorityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown, showProgressionDropdown, showPriorityDropdown]);

  // Apply all filters to jobs
  const filteredJobs = jobs.filter(job => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!job.company?.toLowerCase().includes(searchLower) &&
          !job.role?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Status multiselect filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(job.status)) {
      return false;
    }

    // Progression stages multiselect filter
    if (selectedProgressionStages.length > 0 && !selectedProgressionStages.includes(job.progression)) {
      return false;
    }

    // Priority multiselect filter
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(job.priority)) {
      return false;
    }

    // Date range filter
    if (dateRangeFilter.start || dateRangeFilter.end) {
      const jobDate = new Date(job.dateApplied);
      if (dateRangeFilter.start) {
        const startDate = new Date(dateRangeFilter.start);
        if (jobDate < startDate) return false;
      }
      if (dateRangeFilter.end) {
        const endDate = new Date(dateRangeFilter.end);
        if (jobDate > endDate) return false;
      }
    }

    return true;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, selectedStatuses.length, selectedProgressionStages.length, selectedPriorities.length, dateRangeFilter]);

  // Count active filters
  const activeFiltersCount = [
    filters.search,
    selectedStatuses.length > 0,
    selectedProgressionStages.length > 0,
    selectedPriorities.length > 0,
    dateRangeFilter.start || dateRangeFilter.end
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ status: 'all', priority: 'all', company: '', search: '' });
    setSelectedStatuses([]);
    setSelectedProgressionStages([]);
    setSelectedPriorities([]);
    setDateRangeFilter({ start: '', end: '' });
  };

  const handleQuickClose = (job) => {
    const today = new Date().toISOString().split('T')[0];
    const proceed = confirm(`Close "${job.role}" at ${job.company} as Rejected today?`);
    if (!proceed) return;

    onUpdateJob({
      ...job,
      status: JOB_STATUSES.CLOSED,
      closeReason: CLOSE_REASONS.REJECTED,
      followUp: today
    });
  };

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const allOpenSelected = OPEN_STATUSES.every(s => selectedStatuses.includes(s));
  const toggleAllOpen = () => {
    if (allOpenSelected) {
      setSelectedStatuses(prev => prev.filter(s => !OPEN_STATUSES.includes(s)));
    } else {
      setSelectedStatuses(prev => [...new Set([...prev, ...OPEN_STATUSES])]);
    }
  };

  const toggleProgressionStage = (stage) => {
    setSelectedProgressionStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const allProgressedSelected = PROGRESSED_STAGES.every(s => selectedProgressionStages.includes(s));
  const toggleAllProgressed = () => {
    if (allProgressedSelected) {
      setSelectedProgressionStages(prev => prev.filter(s => !PROGRESSED_STAGES.includes(s)));
    } else {
      setSelectedProgressionStages(prev => [...new Set([...prev, ...PROGRESSED_STAGES])]);
    }
  };

  const togglePriority = (priority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const columns = [
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'dateApplied', label: 'Date applied' },
    { key: 'salary', label: 'Salary' },
    { key: 'closeReason', label: 'Reason' },
    { key: 'progression', label: 'Progress' },
    { key: 'followUp', label: 'Close date' },
    { key: 'notes', label: 'Notes' },
    { key: 'resumeUrl', label: 'Resume' },
    { key: 'coverLetterUrl', label: 'Cover letter' }
  ];

  return (
    <div>
      <div className="action-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h1 style={{ color: "var(--accent-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "1.75rem" }}>Applications</h1>
          <span style={{ color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
            {filteredJobs.length === jobs.length
              ? `${jobs.length} ${jobs.length === 1 ? 'application' : 'applications'}`
              : `${filteredJobs.length} of ${jobs.length}`
            }
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={onExport}>📊 Export CSV</button>
          <button className="btn" onClick={onAdd}>Add application</button>
        </div>
      </div>

      <div className="action-bar" style={{ marginTop: "1rem" }}>
        <div className="filters-section" data-filter-group="applications-filters" style={{ flex: 1 }}>
          <div className="filters-row" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search applications by role or company"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              {filters.search && (
                <button
                  className="clear-search"
                  onClick={() => setFilters({ ...filters, search: "" })}
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Multiselect */}
            <div style={{ position: "relative" }}>
              <button
                className="filter-select"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  minWidth: "160px",
                  cursor: "pointer"
                }}
              >
                <span>
                  {selectedStatuses.length === 0
                    ? 'All statuses'
                    : `Status (${selectedStatuses.length})`}
                </span>
                <span style={{ fontSize: "0.7rem" }}>▼</span>
              </button>
              {showStatusDropdown && (
                <div data-dropdown="status" style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "10px",
                  padding: "0.5rem",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 1000,
                  minWidth: "200px",
                  maxHeight: "300px",
                  overflowY: "auto"
                }}>
                  <button
                    onClick={() => setSelectedStatuses([])}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: "500",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-primary)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Clear all
                  </button>
                  <div style={{ borderBottom: "1px solid var(--border-primary)", margin: "0.5rem 0" }} />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      cursor: "pointer",
                      borderRadius: "6px",
                      transition: "background 0.2s",
                      fontSize: "0.9rem",
                      color: "var(--text-primary)",
                      fontWeight: "500"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <input
                      type="checkbox"
                      checked={allOpenSelected}
                      onChange={toggleAllOpen}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: "var(--accent-primary)"
                      }}
                    />
                    <span>All open</span>
                  </label>
                  <div style={{ borderBottom: "1px solid var(--border-primary)", margin: "0.5rem 0" }} />
                  {STATUSES.map(status => (
                    <label
                      key={status}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem",
                        cursor: "pointer",
                        borderRadius: "6px",
                        transition: "background 0.2s",
                        fontSize: "0.9rem",
                        color: "var(--text-primary)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => toggleStatus(status)}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          accentColor: "var(--accent-primary)"
                        }}
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Progression Stages Multiselect */}
            <div style={{ position: "relative" }}>
              <button
                className="filter-select"
                onClick={() => setShowProgressionDropdown(!showProgressionDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  minWidth: "160px",
                  cursor: "pointer"
                }}
              >
                <span>
                  {selectedProgressionStages.length === 0
                    ? 'All stages'
                    : `Stage (${selectedProgressionStages.length})`}
                </span>
                <span style={{ fontSize: "0.7rem" }}>▼</span>
              </button>
              {showProgressionDropdown && (
                <div data-dropdown="progression" style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "10px",
                  padding: "0.5rem",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 1000,
                  minWidth: "200px",
                  maxHeight: "300px",
                  overflowY: "auto"
                }}>
                  <button
                    onClick={() => setSelectedProgressionStages([])}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: "500",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-primary)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Clear all
                  </button>
                  <div style={{ borderBottom: "1px solid var(--border-primary)", margin: "0.5rem 0" }} />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      cursor: "pointer",
                      borderRadius: "6px",
                      transition: "background 0.2s",
                      fontSize: "0.9rem",
                      color: "var(--text-primary)",
                      fontWeight: "500"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <input
                      type="checkbox"
                      checked={allProgressedSelected}
                      onChange={toggleAllProgressed}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: "var(--accent-primary)"
                      }}
                    />
                    <span>All engagements</span>
                  </label>
                  <div style={{ borderBottom: "1px solid var(--border-primary)", margin: "0.5rem 0" }} />
                  {PROGRESSIONS.map(stage => (
                    <label
                      key={stage}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem",
                        cursor: "pointer",
                        borderRadius: "6px",
                        transition: "background 0.2s",
                        fontSize: "0.9rem",
                        color: "var(--text-primary)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProgressionStages.includes(stage)}
                        onChange={() => toggleProgressionStage(stage)}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          accentColor: "var(--accent-primary)"
                        }}
                      />
                      <span>{stage}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Multiselect */}
            <div style={{ position: "relative" }}>
              <button
                className="filter-select"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  minWidth: "160px",
                  cursor: "pointer"
                }}
              >
                <span>
                  {selectedPriorities.length === 0
                    ? 'All priorities'
                    : `Priority (${selectedPriorities.length})`}
                </span>
                <span style={{ fontSize: "0.7rem" }}>▼</span>
              </button>
              {showPriorityDropdown && (
                <div data-dropdown="priority" style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "10px",
                  padding: "0.5rem",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 1000,
                  minWidth: "200px"
                }}>
                  <button
                    onClick={() => setSelectedPriorities([])}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: "500",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-primary)";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Clear all
                  </button>
                  {PRIORITY_LIST.map(priority => (
                    <label
                      key={priority}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem",
                        cursor: "pointer",
                        borderRadius: "6px",
                        transition: "background 0.2s",
                        fontSize: "0.9rem",
                        color: "var(--text-primary)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPriorities.includes(priority)}
                        onChange={() => togglePriority(priority)}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          accentColor: "var(--accent-primary)"
                        }}
                      />
                      <span>{priority}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`advanced-filters-toggle ${showAdvancedFilters ? 'active' : ''}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                background: showAdvancedFilters ? "var(--accent-primary)" : "var(--bg-tertiary)",
                color: showAdvancedFilters ? "white" : "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
                padding: "0.6rem 1rem",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease"
              }}
            >
              📅 Application date
              {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
            </button>

            {/* Clear All Filters */}
            {(filters.search || selectedStatuses.length > 0 || selectedProgressionStages.length > 0 || selectedPriorities.length > 0 || dateRangeFilter.start || dateRangeFilter.end) && (
              <button
                onClick={clearFilters}
                style={{
                  background: "transparent",
                  color: "var(--accent-primary)",
                  border: "none",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setShowColumnSelector(!showColumnSelector)}
        >
          ⚙️ Columns
        </button>
      </div>

      {showAdvancedFilters && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-md)",
          animation: "slideDown 0.3s ease"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            <div className="filter-group">
              <label className="filter-label" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
                Date from
              </label>
              <input
                type="date"
                className="filter-select"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "500", marginBottom: "0.5rem", display: "block" }}>
                Date to
              </label>
              <input
                type="date"
                className="filter-select"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {showColumnSelector && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem"
        }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "1rem", color: "var(--text-primary)" }}>
            Visible columns
          </h4>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "0.75rem"
          }}>
            {columns.map(col => (
              <label key={col.key} className="checkbox-label" style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                padding: "0.5rem",
                borderRadius: "6px",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="checkbox"
                  checked={visibleColumns[col.key]}
                  onChange={() => toggleColumn(col.key)}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No applications. Let's change that!</h3>
          <p>Add an application or adjust your filters</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {visibleColumns.company && (
                    <th onClick={() => requestSort('company')} style={{ cursor: 'pointer' }}>
                      Company{getSortIcon('company')}
                    </th>
                  )}
                  {visibleColumns.role && (
                    <th onClick={() => requestSort('role')} style={{ cursor: 'pointer' }}>
                      Role{getSortIcon('role')}
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>
                      Status{getSortIcon('status')}
                    </th>
                  )}
                  {visibleColumns.priority && (
                    <th onClick={() => requestSort('priority')} style={{ cursor: 'pointer' }}>
                      Priority{getSortIcon('priority')}
                    </th>
                  )}
                  {visibleColumns.dateApplied && (
                    <th onClick={() => requestSort('dateApplied')} style={{ cursor: 'pointer' }}>
                      Date applied{getSortIcon('dateApplied')}
                    </th>
                  )}
                  {visibleColumns.salary && (
                    <th onClick={() => requestSort('salary')} style={{ cursor: 'pointer' }}>
                      Salary{getSortIcon('salary')}
                    </th>
                  )}
                  {visibleColumns.closeReason && (
                    <th onClick={() => requestSort('closeReason')} style={{ cursor: 'pointer' }}>
                      Reason{getSortIcon('closeReason')}
                    </th>
                  )}
                  {visibleColumns.progression && (
                    <th onClick={() => requestSort('progression')} style={{ cursor: 'pointer' }}>
                      Progress{getSortIcon('progression')}
                    </th>
                  )}
                  {visibleColumns.followUp && (
                    <th onClick={() => requestSort('followUp')} style={{ cursor: 'pointer' }}>
                      Close date{getSortIcon('followUp')}
                    </th>
                  )}
                  {visibleColumns.notes && (
                    <th>Notes</th>
                  )}
                  {visibleColumns.resumeUrl && (
                    <th>Resume</th>
                  )}
                  {visibleColumns.coverLetterUrl && (
                    <th>Cover letter</th>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.map(job => (
                  <tr key={job.id}>
                    {visibleColumns.company && <td><strong>{job.company}</strong></td>}
                    {visibleColumns.role && (
                      <td style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                          className="icon-btn"
                          title="View"
                          style={{
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border-primary)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            color: "var(--text-secondary)",
                            fontSize: "1.1rem"
                          }}
                          onClick={() => {
                            setViewModalJob(job);
                            setViewModalOpen(true);
                            setViewModalEdit(false);
                          }}
                        >
                          <span role="img" aria-label="View">👁️</span>
                        </button>
                        {job.url ? (
                          <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>{job.role}&nbsp;<span style={{ fontSize: '0.85em', marginLeft: '0.25rem' }}>↗</span></a>
                        ) : job.role}
                      </td>
                    )}
                    {visibleColumns.status && <td><StatusBadge status={job.status} /></td>}
                    {visibleColumns.priority && <td><PriorityBadge priority={job.priority} /></td>}
                    {visibleColumns.dateApplied && <td>{job.dateApplied ? new Date(job.dateApplied + 'T00:00:00').toLocaleDateString() : '-'}</td>}
                    {visibleColumns.salary && <td>{job.salary || "-"}</td>}
                    {visibleColumns.closeReason && <td>{job.closeReason || "-"}</td>}
                    {visibleColumns.progression && <td>{job.progression || "-"}</td>}
                    {visibleColumns.followUp && <td>{job.followUp ? new Date(job.followUp + 'T00:00:00').toLocaleDateString() : "-"}</td>}
                    {visibleColumns.notes && (
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {job.notes || "-"}
                      </td>
                    )}
                    {visibleColumns.resumeUrl && (
                      <td>
                        {job.resumeUrl ? (
                          <a href={job.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
                            📄&nbsp;View
                          </a>
                        ) : "-"}
                      </td>
                    )}
                    {visibleColumns.coverLetterUrl && (
                      <td>
                        {job.coverLetterUrl ? (
                          <a href={job.coverLetterUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
                            📝&nbsp;View
                          </a>
                        ) : "-"}
                      </td>
                    )}
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="icon-btn"
                          onClick={() => onEdit(job)}
                          title="Edit"
                          style={{
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border-primary)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            color: "var(--text-secondary)",
                            fontSize: "0.9rem"
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleQuickClose(job)}
                          title="Close as rejected today"
                          style={{
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border-primary)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            color: "var(--text-secondary)",
                            fontSize: "0.9rem"
                          }}
                        >
                          🚫
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => onDelete(job.id)}
                          title="Delete"
                          style={{
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border-primary)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            color: "var(--text-secondary)",
                            fontSize: "0.9rem"
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "2rem",
              padding: "1rem"
            }}>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                  opacity: currentPage === 1 ? 0.4 : 1
                }}
              >
                ««
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                  opacity: currentPage === 1 ? 0.4 : 1
                }}
              >
                ‹
              </button>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Page {currentPage} of {totalPages} ({filteredJobs.length} total)
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                  opacity: currentPage === totalPages ? 0.4 : 1
                }}
              >
                ›
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                  opacity: currentPage === totalPages ? 0.4 : 1
                }}
              >
                »»
              </button>
            </div>
          )}
        </>
      )}

      {/* View Modal for job details */}
      {viewModalOpen && (
        <div className="modal-overlay" onClick={() => setViewModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Application details</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {viewModalEdit ? (
                  <button
                    className="btn"
                    onClick={() => {
                      onUpdateJob(editedJobData);
                      setViewModalOpen(false);
                      setViewModalEdit(false);
                      setEditedJobData(null);
                    }}
                  >
                    Save & close
                  </button>
                ) : (
                  <button className="icon-btn" title="Edit" style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '1.1rem'
                  }} onClick={() => {
                    if (!viewModalEdit) {
                      setEditedJobData({ ...viewModalJob });
                    }
                    setViewModalEdit(true);
                  }}>
                    <span role="img" aria-label="Edit">✏️</span>
                  </button>
                )}
                <button className="modal-close" onClick={() => setViewModalOpen(false)}>×</button>
              </div>
            </div>
            <div className="modal-body">
              {viewModalJob ? (
                <div style={{ borderBottom: '1px solid var(--border-primary)', marginBottom: '1.5rem', paddingBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{viewModalEdit ? editedJobData?.role : viewModalJob.role} @ {viewModalEdit ? editedJobData?.company : viewModalJob.company}</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Company</label>
                      <input type="text" value={viewModalEdit ? editedJobData?.company || '' : viewModalJob.company} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, company: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <input type="text" value={viewModalEdit ? editedJobData?.role || '' : viewModalJob.role} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, role: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Job URL</label>
                    {viewModalEdit ? (
                      <input type="url" value={editedJobData?.url || ''} onChange={e => {
                        setEditedJobData({ ...editedJobData, url: e.target.value });
                      }} />
                    ) : (
                      viewModalJob.url ? (
                        <div style={{
                          ...viewFieldStyle,
                          cursor: 'default',
                          padding: '0.75rem',
                          wordBreak: 'break-all'
                        }}>
                          <a
                            href={viewModalJob.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {viewModalJob.url}
                          </a>
                        </div>
                      ) : (
                        <div style={viewFieldStyle}>-</div>
                      )
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Resume URL</label>
                      {viewModalEdit ? (
                        <input type="url" value={editedJobData?.resumeUrl || ''} onChange={e => {
                          setEditedJobData({ ...editedJobData, resumeUrl: e.target.value });
                        }} />
                      ) : (
                        viewModalJob.resumeUrl ? (
                          <div style={{
                            ...viewFieldStyle,
                            cursor: 'default',
                            padding: '0.75rem',
                            wordBreak: 'break-all'
                          }}>
                            <a
                              href={viewModalJob.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {viewModalJob.resumeUrl}
                            </a>
                          </div>
                        ) : (
                          <div style={viewFieldStyle}>-</div>
                        )
                      )}
                    </div>
                    <div className="form-group">
                      <label>Cover letter URL</label>
                      {viewModalEdit ? (
                        <input type="url" value={editedJobData?.coverLetterUrl || ''} onChange={e => {
                          setEditedJobData({ ...editedJobData, coverLetterUrl: e.target.value });
                        }} />
                      ) : (
                        viewModalJob.coverLetterUrl ? (
                          <div style={{
                            ...viewFieldStyle,
                            cursor: 'default',
                            padding: '0.75rem',
                            wordBreak: 'break-all'
                          }}>
                            <a
                              href={viewModalJob.coverLetterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {viewModalJob.coverLetterUrl}
                            </a>
                          </div>
                        ) : (
                          <div style={viewFieldStyle}>-</div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Status</label>
                      <input type="text" value={viewModalEdit ? editedJobData?.status || '' : viewModalJob.status || ''} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, status: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                    <div className="form-group">
                      <label>Date applied</label>
                      <input type="date" value={viewModalEdit ? editedJobData?.dateApplied || '' : viewModalJob.dateApplied || ''} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, dateApplied: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Progression</label>
                      <input type="text" value={viewModalEdit ? editedJobData?.progression || '' : viewModalJob.progression || ''} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, progression: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <input type="text" value={viewModalEdit ? editedJobData?.priority || '' : viewModalJob.priority || ''} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, priority: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                  </div>
                  {(viewModalJob.closeReason || viewModalJob.followUp) && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Close reason</label>
                        <input type="text" value={viewModalEdit ? editedJobData?.closeReason || '' : viewModalJob.closeReason || ''} readOnly={!viewModalEdit} onChange={e => {
                          setEditedJobData({ ...editedJobData, closeReason: e.target.value });
                        }} style={viewFieldStyle} />
                      </div>
                      <div className="form-group">
                        <label>Close date</label>
                        <input type="date" value={viewModalEdit ? editedJobData?.followUp || '' : viewModalJob.followUp || ''} readOnly={!viewModalEdit} onChange={e => {
                          setEditedJobData({ ...editedJobData, followUp: e.target.value });
                        }} style={viewFieldStyle} />
                      </div>
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Salary</label>
                      <input type="text" value={viewModalEdit ? editedJobData?.salary || '' : viewModalJob.salary || ''} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, salary: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input type="text" value={viewModalEdit ? editedJobData?.location || '' : viewModalJob.location || ''} readOnly={!viewModalEdit} onChange={e => {
                        setEditedJobData({ ...editedJobData, location: e.target.value });
                      }} style={viewFieldStyle} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Contact name</label>
                    <input type="text" value={viewModalEdit ? editedJobData?.contact || '' : viewModalJob.contact || ''} readOnly={!viewModalEdit} onChange={e => {
                      setEditedJobData({ ...editedJobData, contact: e.target.value });
                    }} style={viewFieldStyle} />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    {viewModalEdit ? (
                      <textarea value={editedJobData?.notes || ''} onChange={e => {
                        setEditedJobData({ ...editedJobData, notes: e.target.value });
                        autoExpandTextarea();
                      }} ref={notesTextareaRef} style={{ minHeight: '120px', resize: 'vertical', overflow: 'hidden' }} />
                    ) : (
                      <div style={{
                        ...viewFieldStyle,
                        cursor: 'default',
                        minHeight: '120px',
                        padding: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }} dangerouslySetInnerHTML={{ __html: viewModalJob.notes ? UIUtil.linkify(viewModalJob.notes) : '-' }}>
                      </div>
                    )}
                  </div>
                  {viewModalEdit && (
                    <div className="modal-footer" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => {
                        setViewModalEdit(false);
                        setEditedJobData(null);
                      }}>Cancel</button>
                      <button className="btn" onClick={() => {
                        onUpdateJob(editedJobData);
                        setViewModalOpen(false);
                        setViewModalEdit(false);
                        setEditedJobData(null);
                      }}>Save & Close</button>
                    </div>
                  )}
                </div>
              ) : (
                <div>No job found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobsTable;
