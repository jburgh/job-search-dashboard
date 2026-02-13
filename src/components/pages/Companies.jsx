import React, { useState, useEffect } from 'react';
import { getFitLevelLabel, getFitLevelValue, sortByFitLevel } from '../../utils/fitLevel';

/**
 * Companies Component
 *
 * Full-featured company management with:
 * - Multi-select filtering by category, fit level, applied status
 * - Bulk actions (category change, hide)
 * - Category management (add, rename, delete)
 * - Inline fit level editing
 * - Sortable columns
 */
function Companies({
  companies,
  jobs,
  customCompanies,
  blockedCompanies,
  deletedCategories,
  setDeletedCategories,
  onUpdateCompany,
  onDeleteCompany,
  onAddJob,
  onAddCompany,
  onViewCompanyJobs,
  onUnhideCompany
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'company', direction: 'asc' });
  const [editingCompany, setEditingCompany] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNewCategory, setEditNewCategory] = useState('');
  const [editFitLevel, setEditFitLevel] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('all');
  const [showAppliedDropdown, setShowAppliedDropdown] = useState(false);
  const [selectedFitLevels, setSelectedFitLevels] = useState([]);
  const [showFitLevelDropdown, setShowFitLevelDropdown] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkNewCategory, setBulkNewCategory] = useState('');

  const blockedNameSet = new Set(
    Array.isArray(blockedCompanies)
      ? blockedCompanies
          .map(name => (typeof name === 'string' ? name.trim().toLowerCase() : ''))
          .filter(Boolean)
      : []
  );

  if (!companies || typeof companies !== 'object') {
    console.error("Invalid companies prop:", companies);
    return <div className="empty-state"><h3>Error loading companies</h3></div>;
  }

  // Get all unique categories from companies object, with None first
  const allCategories = Object.keys(companies).sort((a, b) => {
    if (a === 'None') return -1;
    if (b === 'None') return 1;
    return a.localeCompare(b);
  });

  // Filter categories by search term
  const filteredCategories = allCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // Get all unique companies across categories
  const allUniqueCompanies = Object.values(companies)
    .flat()
    .filter((company, index, self) =>
      index === self.findIndex(c => c.name === company.name)
    );

  // Count how many actual companies are hidden
  const hiddenCount = allUniqueCompanies.filter(company => {
    const companyName = company?.name ? company.name.trim().toLowerCase() : '';
    return blockedNameSet.has(companyName);
  }).length;

  // Get all companies from all categories
  const allCompaniesList = allUniqueCompanies
    .filter(company => {
      if (showHidden) return true;
      const companyName = company?.name ? company.name.trim().toLowerCase() : '';
      return !blockedNameSet.has(companyName);
    });

  function findCompanyCategory(companyName) {
    if (!companyName) return 'None';
    const entry = Object.entries(companies).find(([_, companiesList]) =>
      Array.isArray(companiesList) && companiesList.some(c => c.name === companyName)
    );
    return entry?.[0] || 'None';
  }

  // Filter by search term and selected categories
  const filteredCompaniesList = allCompaniesList.filter(company => {
    const matchesSearch = company && company.name && company.name.toLowerCase().includes(searchTerm.toLowerCase());

    // If no filters selected, show all companies
    if (selectedCategories.length === 0 && appliedFilter === 'all' && selectedFitLevels.length === 0) return matchesSearch;

    // Find which category this company belongs to
    const companyCategory = findCompanyCategory(company.name);

    // Apply category filter
    if (selectedCategories.length > 0 && !(companyCategory && selectedCategories.includes(companyCategory))) {
      return false;
    }

    // Apply "Applied" filter
    if (appliedFilter !== 'all') {
      const applicationCount = jobs.filter(j => j.company === company.name).length;
      if (appliedFilter === 'applied' && applicationCount === 0) return false;
      if (appliedFilter === 'not-applied' && applicationCount > 0) return false;
    }

    // Apply fit level filter
    if (selectedFitLevels.length > 0) {
      const companyFitLabel = getFitLevelLabel(company.fitLevel || null);
      if (!selectedFitLevels.includes(companyFitLabel)) return false;
    }

    return matchesSearch;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    // Special case: fitLevel should start with descending order
    if (key === 'fitLevel' && sortConfig.key !== 'fitLevel') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return ' ⇅';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const handleFitLevelChange = (companyName, newValue) => {
    onUpdateCompany(companyName, { fitLevel: newValue });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (allCategories.includes(newCategoryName)) {
      alert('Category already exists');
      return;
    }
    // Remove from deleted list if user is recreating
    setDeletedCategories(prev => prev.filter(cat => cat !== newCategoryName));
    // Create new category with empty array
    onUpdateCompany(null, { newCategory: newCategoryName });
    setNewCategoryName('');
  };

  const handleDeleteCategory = (categoryName) => {
    if (categoryName === 'None') {
      alert("You can't delete the \"None\" category.");
      return;
    }
    if (!confirm(`Delete category "${categoryName}"? Companies in this category will be moved to "None".`)) return;
    onUpdateCompany(null, { deleteCategory: categoryName });
  };

  const handleRenameCategory = (oldName, newName) => {
    if (!newName.trim()) return;
    if (allCategories.includes(newName) && newName !== oldName) {
      alert('Category name already exists');
      return;
    }
    onUpdateCompany(null, { renameCategory: { oldName, newName } });
    setEditingCategoryName(null);
    setEditingCategoryNewName('');
  };

  const handleSelectAll = () => {
    const allCompanyNames = sortedCompaniesList.map(c => c.name);
    setSelectedCompanies(allCompanyNames);
  };

  const handleDeselectAll = () => {
    setSelectedCompanies([]);
  };

  const handleToggleCompany = (companyName) => {
    setSelectedCompanies(prev =>
      prev.includes(companyName)
        ? prev.filter(n => n !== companyName)
        : [...prev, companyName]
    );
  };

  const handleBulkCategoryUpdate = () => {
    if (!bulkCategory && !bulkNewCategory) {
      alert('Select or enter a category to continue.');
      return;
    }
    const category = bulkCategory === '' ? bulkNewCategory : bulkCategory;
    selectedCompanies.forEach(companyName => {
      onUpdateCompany(companyName, { category });
    });
    setSelectedCompanies([]);
    setShowBulkActions(false);
    setBulkCategory('');
    setBulkNewCategory('');
  };

  const handleBulkHide = () => {
    if (!confirm(`Hide ${selectedCompanies.length} selected companies?`)) return;
    selectedCompanies.forEach(companyName => {
      onDeleteCompany(companyName);
    });
    setSelectedCompanies([]);
  };

  // Sort the filtered list
  const sortedCompaniesList = [...filteredCompaniesList].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aVal, bVal;
    if (sortConfig.key === 'applications') {
      aVal = jobs.filter(j => j.company === a.name).length;
      bVal = jobs.filter(j => j.company === b.name).length;
    } else if (sortConfig.key === 'company') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else if (sortConfig.key === 'category') {
      const aCat = findCompanyCategory(a.name) || 'None';
      const bCat = findCompanyCategory(b.name) || 'None';
      aVal = aCat.toLowerCase();
      bVal = bCat.toLowerCase();
    } else if (sortConfig.key === 'fitLevel') {
      return sortByFitLevel(a.fitLevel || null, b.fitLevel || null, sortConfig.direction);
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(sortedCompaniesList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompaniesList = sortedCompaniesList.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories.length, selectedFitLevels.length, appliedFilter, showHidden, sortConfig.key, sortConfig.direction]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.filter-select') && !event.target.closest('[data-dropdown="category"]')) {
        setShowCategoryDropdown(false);
        setCategorySearchTerm('');
      }
      if (showAppliedDropdown && !event.target.closest('.filter-select') && !event.target.closest('[data-dropdown="applied"]')) {
        setShowAppliedDropdown(false);
      }
      if (showFitLevelDropdown && !event.target.closest('.filter-select') && !event.target.closest('[data-dropdown="fitlevel"]')) {
        setShowFitLevelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown, showAppliedDropdown, showFitLevelDropdown]);

  // Get CSS class name for category
  const getCategoryClassName = (category) => {
    const normalizedCategory = (category || 'None')
      .toString()
      .trim()
      .replace(/\s+/g, ' ');

    const classMap = {
      'Developer Tools': 'category-developer-tools',
      'Data Infrastructure': 'category-data-infrastructure',
      'Cloud/Infrastructure': 'category-cloud-infrastructure',
      'Enterprise Software': 'category-enterprise-software',
      'Consumer Tech': 'category-consumer-tech',
      'None': 'category-none'
    };

    if (classMap[normalizedCategory]) {
      return `category-pill ${classMap[normalizedCategory]}`;
    }

    // For custom categories, hash the name to pick a color consistently
    let hash = 0;
    for (let i = 0; i < normalizedCategory.length; i++) {
      hash = ((hash << 5) - hash) + normalizedCategory.charCodeAt(i);
      hash = hash & hash;
    }
    const colorIndex = Math.abs(hash) % 12;
    return `category-pill category-custom-${colorIndex}`;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h1 style={{ color: "var(--accent-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "1.75rem" }}>Target companies</h1>
          <span className="heading-count">
            {filteredCompaniesList.length} {filteredCompaniesList.length === 1 ? 'company' : 'companies'}
          </span>
          {selectedCompanies.length > 0 && (
            <span style={{ color: "var(--accent-primary)", fontSize: "0.9rem", marginLeft: "0.5rem", fontWeight: "500" }}>
              ({selectedCompanies.length} selected)
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Show hidden ({hiddenCount})
          </label>
          <button className="btn" onClick={onAddCompany}>Add company</button>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedCompanies.length > 0 && (
        <div style={{
          background: 'var(--accent-primary)',
          color: 'white',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '500' }}>{selectedCompanies.length} companies selected</span>
            <button onClick={handleDeselectAll} style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}>
              Clear selection
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowBulkActions(!showBulkActions)} style={{
              background: 'rgba(255,255,255,0.9)',
              color: 'var(--accent-primary)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Change category
            </button>
            <button onClick={handleBulkHide} style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              Hide
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Change category for {selectedCompanies.length} companies</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category</label>
              <select
                value={bulkCategory}
                onChange={(e) => {
                  setBulkCategory(e.target.value);
                  setBulkNewCategory('');
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Select category...</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="">Create new category</option>
              </select>
            </div>
            {bulkCategory === '' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>New category name</label>
                <input
                  type="text"
                  value={bulkNewCategory}
                  onChange={(e) => setBulkNewCategory(e.target.value)}
                  placeholder="e.g., AI/ML"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}
            <button onClick={handleBulkCategoryUpdate} className="btn">
              Apply
            </button>
            <button onClick={() => setShowBulkActions(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="action-bar" style={{ marginBottom: "2rem" }}>
        <div className="filters" style={{ flex: 1 }}>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>

          {/* Category Multiselect Filter */}
          <div style={{ position: "relative" }}>
            <button
              className="filter-select"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
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
                {selectedCategories.length === 0
                  ? 'All categories'
                  : `Categories (${selectedCategories.length})`}
              </span>
              <span style={{ fontSize: "0.7rem" }}>▼</span>
            </button>
            {showCategoryDropdown && (
              <div data-dropdown="category" style={{
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
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <button
                    onClick={() => setSelectedCategories([])}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
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
                  <button
                    onClick={() => {
                      setShowCategoryDropdown(false);
                      setShowCategoryManager(true);
                    }}
                    title="Manage categories"
                    style={{
                      padding: "0.5rem",
                      width: "36px",
                      height: "36px",
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                    ⚙️
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                />
                {filteredCategories.map(category => (
                  <label
                    key={category}
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
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        }
                      }}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: "var(--accent-primary)"
                      }}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Fit Level Filter */}
          <div style={{ position: "relative" }}>
            <button
              className="filter-select"
              onClick={() => setShowFitLevelDropdown(!showFitLevelDropdown)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                minWidth: "150px",
                cursor: "pointer"
              }}
            >
              <span>
                {selectedFitLevels.length === 0
                  ? 'All fit levels'
                  : `Fit level (${selectedFitLevels.length})`}
              </span>
              <span style={{ fontSize: "0.7rem" }}>▼</span>
            </button>
            {showFitLevelDropdown && (
              <div data-dropdown="fitlevel" style={{
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
                  onClick={() => setSelectedFitLevels([])}
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
                {['Strong', 'Decent', 'Long shot', '—'].map(level => (
                  <label
                    key={level}
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
                      checked={selectedFitLevels.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFitLevels([...selectedFitLevels, level]);
                        } else {
                          setSelectedFitLevels(selectedFitLevels.filter(l => l !== level));
                        }
                      }}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                        accentColor: "var(--accent-primary)"
                      }}
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Applied Filter Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className="filter-select"
              onClick={() => setShowAppliedDropdown(!showAppliedDropdown)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                minWidth: "150px",
                cursor: "pointer"
              }}
            >
              <span>
                {appliedFilter === 'all' ? 'All companies' : (appliedFilter === 'applied' ? 'Applied to' : 'Not applied to')}
              </span>
              <span style={{ fontSize: "0.7rem" }}>▼</span>
            </button>
            {showAppliedDropdown && (
              <div data-dropdown="applied" style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)",
                borderRadius: "10px",
                padding: "0.5rem",
                boxShadow: "var(--shadow-lg)",
                zIndex: 1000,
                minWidth: "160px"
              }}>
                {['All companies', 'Applied to', 'Not applied to'].map(option => {
                  const value = option === 'All companies' ? 'all' : (option === 'Applied to' ? 'applied' : 'not-applied');
                  return (
                    <label
                      key={option}
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
                        background: appliedFilter === value ? "var(--bg-hover)" : "transparent"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = appliedFilter === value ? "var(--bg-hover)" : "transparent"}
                    >
                      <input
                        type="radio"
                        name="applied-filter"
                        checked={appliedFilter === value}
                        onChange={() => {
                          setAppliedFilter(value);
                          setShowAppliedDropdown(false);
                        }}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          accentColor: "var(--accent-primary)"
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear All Filters */}
          {(searchTerm || selectedCategories.length > 0 || selectedFitLevels.length > 0 || appliedFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategories([]);
                setSelectedFitLevels([]);
                setAppliedFilter('all');
              }}
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

      {/* Companies Table */}
      {filteredCompaniesList.length === 0 ? (
        <div className="empty-state">
          {allCompaniesList.length === 0 ? (
            <>
              <div className="empty-state-icon">🏢</div>
              <h3>No companies yet</h3>
              <p>Add a company to start building your target list.</p>
            </>
          ) : (
            <>
              <div className="empty-state-icon">🔍</div>
              <h3>No companies match your filters</h3>
              <p>Try broadening your search or clearing some filters.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedCompanies.length === sortedCompaniesList.length && sortedCompaniesList.length > 0}
                      onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                      style={{ cursor: 'pointer' }}
                      title={selectedCompanies.length === sortedCompaniesList.length ? 'Deselect all' : 'Select all'}
                    />
                  </th>
                  <th onClick={() => requestSort('company')} style={{ cursor: 'pointer' }}>
                    Company{getSortIcon('company')}
                  </th>
                  <th onClick={() => requestSort('category')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Category{getSortIcon('category')}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCategoryManager(true);
                      }}
                      title="Manage categories"
                      aria-label="Manage categories"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      ⚙️
                    </button>
                  </th>
                  <th onClick={() => requestSort('fitLevel')} style={{ cursor: 'pointer' }} title="Fit level reflects how well this company tends to match your goals based on role availability, location, hiring patterns, or past experience. It's subjective and can change over time.">
                    Fit level{getSortIcon('fitLevel')}
                  </th>
                  <th onClick={() => requestSort('applications')} style={{ cursor: 'pointer' }}>
                    Applications{getSortIcon('applications')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompaniesList.map(company => {
                  const isHidden = blockedNameSet.has((company?.name || '').trim().toLowerCase());
                  const companyCategory = findCompanyCategory(company.name) || 'None';

                  return (
                    <tr key={company.name} style={isHidden ? { opacity: 0.6, background: 'var(--bg-tertiary)' } : {}}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(company.name)}
                          onChange={() => handleToggleCompany(company.name)}
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <a href={company.url} target="_blank" rel="noopener noreferrer" className="link">
                          {company.name}&nbsp;<span style={{ fontSize: '0.85em', marginLeft: '0.25rem' }}>↗</span>
                        </a>
                      </td>
                      <td>
                        <span
                          className={getCategoryClassName(companyCategory)}
                          onClick={() => setSelectedCategories([companyCategory])}
                          style={{
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          title={`Filter by ${companyCategory}`}
                        >
                          {companyCategory}
                        </span>
                      </td>
                      <td>
                        <select
                          value={getFitLevelLabel(company.fitLevel || null)}
                          onChange={(e) => handleFitLevelChange(company.name, getFitLevelValue(e.target.value))}
                          style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            padding: '0.375rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: company.fitLevel === 3 ? '600' : company.fitLevel === 1 ? '400' : '500',
                            opacity: company.fitLevel === 1 ? 0.7 : 1
                          }}
                          aria-label={`Fit level: ${getFitLevelLabel(company.fitLevel || null)}`}
                        >
                          <option value="—">—</option>
                          <option value="Strong">Strong</option>
                          <option value="Decent">Decent</option>
                          <option value="Long shot">Long shot</option>
                        </select>
                      </td>
                      <td>
                        {jobs.filter(j => j.company === company.name).length > 0 ? (
                          <button
                            onClick={() => onViewCompanyJobs(company.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6b8aff',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontSize: 'inherit',
                              padding: 0
                            }}
                          >
                            {jobs.filter(j => j.company === company.name).length}
                          </button>
                        ) : (
                          <span style={{ color: '#6b7280' }}>0</span>
                        )}
                      </td>
                      <td>
                        {isHidden ? (
                          <button
                            className="btn btn-sm"
                            onClick={() => onUnhideCompany(company.name)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Unhide
                          </button>
                        ) : (
                          <>
                            <button className="btn btn-sm" onClick={() => onAddJob(company)} style={{ marginRight: '0.5rem' }}>
                              Add application
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                if (confirm(`Hide ${company.name} from this list?`)) {
                                  onDeleteCompany(company.name);
                                }
                              }}
                              style={{ marginRight: '0.5rem' }}
                            >
                              Hide
                            </button>
                          </>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => {
                          setEditingCompany(company);
                          setEditUrl(company.url);
                          setEditCompanyName(company.name);
                          setEditCategory(companyCategory);
                          setEditNewCategory('');
                          setEditFitLevel(company.fitLevel || null);
                        }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                title="First page"
                aria-label="First page"
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
                title="Previous page"
                aria-label="Previous page"
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
                Page {currentPage} of {totalPages} ({sortedCompaniesList.length} total)
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                title="Next page"
                aria-label="Next page"
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
                title="Last page"
                aria-label="Last page"
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

      {/* Edit Company Modal */}
      {editingCompany && (
        <div className="modal-overlay" onClick={() => setEditingCompany(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit company</h2>
              <button className="modal-close" onClick={() => setEditingCompany(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Company name</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="form-group">
                <label>Careers page URL</label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://company.com/careers"
                />
                <span className="form-hint">Save their jobs page for quick check-ins.</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value);
                      setEditNewCategory("");
                    }}
                  >
                    <option value="None">None</option>
                    <option value="">Create new category</option>
                    <option disabled>──────────</option>
                    {allCategories.filter(cat => cat !== "None").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <span className="form-hint">Group similar companies to stay organized.</span>
                </div>
                <div className="form-group">
                  <label>Fit level</label>
                  <select
                    value={getFitLevelLabel(editFitLevel)}
                    onChange={(e) => setEditFitLevel(getFitLevelValue(e.target.value))}
                  >
                    <option value="—">—</option>
                    <option value="Strong">Strong</option>
                    <option value="Decent">Decent</option>
                    <option value="Long shot">Long shot</option>
                  </select>
                  <span className="form-hint">Think location, comp, role availability, and hiring patterns.</span>
                </div>
              </div>
              {editCategory === "" && (
                <div className="form-group">
                  <label>New category name</label>
                  <input
                    type="text"
                    value={editNewCategory}
                    onChange={(e) => setEditNewCategory(e.target.value)}
                    placeholder="e.g., SaaS Platforms"
                  />
                  <span className="form-hint">Pick a label that makes sense to you.</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingCompany(null)}>
                Cancel
              </button>
              <button className="btn" onClick={() => {
                onUpdateCompany(editingCompany.name, {
                  name: editCompanyName,
                  url: editUrl,
                  category: editCategory === "" ? editNewCategory : editCategory,
                  fitLevel: editFitLevel
                });
                setEditingCompany(null);
              }}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage categories</h2>
              <button className="modal-close" onClick={() => setShowCategoryManager(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <p className="form-hint" style={{ marginBottom: "1.25rem" }}>Categories help you sort your target companies into groups that you can filter.</p>
              {/* Add new category */}
              <div style={{ marginBottom: "2rem", padding: "1rem", background: "var(--bg-elevated)", borderRadius: "10px" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: "600" }}>Add new category</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "6px",
                      color: "var(--text-primary)",
                      fontSize: "0.9rem"
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddCategory}
                    className="btn"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing categories */}
              <div>
                <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: "600" }}>Categories ({allCategories.length})</h3>
                {allCategories.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No categories yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {allCategories.map(category => {
                      const companyCount = companies[category]?.length || 0;
                      const isEditing = editingCategoryName === category;

                      return (
                        <div
                          key={category}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem",
                            background: "var(--bg-elevated)",
                            borderRadius: "8px",
                            border: "1px solid var(--border-primary)"
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingCategoryNewName}
                              onChange={(e) => setEditingCategoryNewName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleRenameCategory(category, editingCategoryNewName)}
                              style={{
                                flex: 1,
                                padding: "0.5rem",
                                background: "var(--bg-primary)",
                                border: "1px solid var(--accent-primary)",
                                borderRadius: "4px",
                                color: "var(--text-primary)",
                                marginRight: "0.5rem"
                              }}
                              autoFocus
                            />
                          ) : (
                            <div>
                              <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>{category}</span>
                              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                                ({companyCount} {companyCount === 1 ? 'company' : 'companies'})
                              </span>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleRenameCategory(category, editingCategoryNewName)}
                                  style={{
                                    padding: "0.4rem 0.8rem",
                                    background: "var(--accent-primary)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "0.8rem"
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCategoryName(null)}
                                  style={{
                                    padding: "0.4rem 0.8rem",
                                    background: "var(--bg-hover)",
                                    color: "var(--text-secondary)",
                                    border: "1px solid var(--border-primary)",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "0.8rem"
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (category !== 'None') {
                                      setEditingCategoryName(category);
                                      setEditingCategoryNewName(category);
                                    }
                                  }}
                                  disabled={category === 'None'}
                                  title={category === 'None' ? "Can't edit default category" : ""}
                                  style={{
                                    padding: "0.4rem 0.8rem",
                                    background: category === 'None' ? "var(--bg-primary)" : "var(--bg-hover)",
                                    color: category === 'None' ? "var(--text-tertiary)" : "var(--text-secondary)",
                                    border: "1px solid var(--border-primary)",
                                    borderRadius: "4px",
                                    cursor: category === 'None' ? "not-allowed" : "pointer",
                                    fontSize: "0.8rem",
                                    opacity: category === 'None' ? 0.5 : 1
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (category !== 'None') {
                                      handleDeleteCategory(category);
                                    }
                                  }}
                                  disabled={category === 'None'}
                                  title={category === 'None' ? "Can't delete default category" : ""}
                                  style={{
                                    padding: "0.4rem 0.8rem",
                                    background: category === 'None' ? "var(--bg-primary)" : "rgba(255, 0, 0, 0.1)",
                                    color: category === 'None' ? "var(--text-tertiary)" : "#ff4444",
                                    border: "1px solid var(--border-primary)",
                                    borderRadius: "4px",
                                    cursor: category === 'None' ? "not-allowed" : "pointer",
                                    fontSize: "0.8rem",
                                    opacity: category === 'None' ? 0.5 : 1
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCategoryManager(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Companies;
