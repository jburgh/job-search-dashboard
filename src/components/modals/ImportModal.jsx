import React, { useState } from 'react';

/**
 * Modal for importing backup data
 */
function ImportModal({ onImport, onClose }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importMode, setImportMode] = useState('merge');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.name.endsWith('.json')) {
      alert('Select a JSON backup file to continue.');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);
        const data = parsed.data || parsed;

        const companyCollections = (
          data.customCompanies ??
          data.categories ??
          data.companyCategories ??
          data.companies ??
          {}
        );

        const companyCount = Array.isArray(companyCollections)
          ? companyCollections.filter(entry => entry && typeof entry === 'object').length
          : (companyCollections && typeof companyCollections === 'object'
              ? Object.values(companyCollections).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0)
              : 0);

        if (!data.jobs || !Array.isArray(data.jobs)) {
          alert('Invalid backup file: missing jobs data');
          return;
        }

        setFileContent(content);
        setPreview({
          jobCount: data.jobs.length,
          companyCount,
          exportDate: parsed.exportDate || data.exportDate ? new Date(parsed.exportDate || data.exportDate).toLocaleString() : 'Unknown',
          companies: data.jobs.map(j => j.company).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10)
        });
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Couldn\'t read this file. Make sure it\'s a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (fileContent) {
      onImport(fileContent, importMode);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>Import backup</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {!preview ? (
            <div
              style={{
                border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                borderRadius: '8px',
                padding: '3rem 2rem',
                textAlign: 'center',
                background: dragActive ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
                transition: 'all 0.3s'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Drop your backup file here
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                or click to browse
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                id="backup-file-input"
              />
              <label htmlFor="backup-file-input">
                <span className="btn">Choose file</span>
              </label>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>📊 Preview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Jobs to import</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{preview.jobCount}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Companies to import</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{preview.companyCount}</div>
                  </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Backup created: {preview.exportDate}
                </div>
                {preview.companies.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      Companies (first 10):
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {preview.companies.join(', ')}
                      {preview.jobCount > 10 && '...'}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Import mode</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    padding: '0.75rem',
                    background: importMode === 'merge' ? 'var(--bg-hover)' : 'transparent',
                    borderRadius: '6px',
                    border: `1px solid ${importMode === 'merge' ? 'var(--accent-primary)' : 'var(--border-primary)'}`
                  }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={(e) => setImportMode(e.target.value)}
                      style={{ marginRight: '0.75rem', marginTop: '0.25rem' }}
                    />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                        🔄 Merge (recommended for historical data)
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Adds new jobs and companies without deleting existing data. Skips duplicates based on company + role + date.
                      </div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    padding: '0.75rem',
                    background: importMode === 'replace' ? 'var(--bg-hover)' : 'transparent',
                    borderRadius: '6px',
                    border: `1px solid ${importMode === 'replace' ? 'var(--accent-primary)' : 'var(--border-primary)'}`
                  }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value)}
                      style={{ marginRight: '0.75rem', marginTop: '0.25rem' }}
                    />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                        ⚠️ Replace all
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Deletes all current data and replaces with backup. Use when restoring from backup.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => { setPreview(null); setSelectedFile(null); setFileContent(null); }}
                style={{ width: '100%' }}
              >
                ← Choose different file
              </button>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {preview && (
            <button type="button" className="btn" onClick={handleImport}>
              {importMode === 'merge' ? '🔄 Merge data' : '⚠️ Replace all data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
