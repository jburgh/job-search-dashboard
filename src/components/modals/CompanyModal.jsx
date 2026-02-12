import React, { useState } from 'react';
import { getFitLevelLabel, getFitLevelValue } from '../../utils/fitLevel';

/**
 * Modal for adding new companies
 */
function CompanyModal({ onSave, onClose, existingCategories }) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    category: "None",
    newCategory: "",
    fitLevel: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const category = formData.newCategory.trim() || formData.category;
      if (!category || !formData.name.trim() || !formData.url.trim()) {
        alert("Fill in all required fields to continue.");
        return;
      }
      onSave({
        name: formData.name.trim(),
        url: formData.url.trim(),
        category: category.trim(),
        fitLevel: formData.fitLevel
      });
    } catch (error) {
      console.error("Error submitting company:", error);
      alert("Something went wrong while saving. Try again.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add company</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Company name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp"
              />
            </div>

            <div className="form-group">
              <label>Careers page URL *</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://company.com/careers/jobs"
              />
              <span className="form-hint">Save their jobs page for quick check-ins.</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, newCategory: "" })}
                  required={!formData.newCategory}
                >
                  <option value="None">None</option>
                  <option value="">Create new category</option>
                  <option disabled>──────────</option>
                  {existingCategories.filter(cat => cat !== "None").map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className="form-hint">Group similar companies to stay organized.</span>
              </div>
              <div className="form-group">
                <label>Fit level</label>
                <select
                  value={getFitLevelLabel(formData.fitLevel)}
                  onChange={(e) => setFormData({ ...formData, fitLevel: getFitLevelValue(e.target.value) })}
                >
                  <option value="—">—</option>
                  <option value="Strong">Strong</option>
                  <option value="Decent">Decent</option>
                  <option value="Long shot">Long shot</option>
                </select>
                <span className="form-hint">Think location, comp, role availability, and hiring patterns.</span>
              </div>
            </div>

            {formData.category === "" && (
              <div className="form-group">
                <label>New category name *</label>
                <input
                  type="text"
                  required={formData.category === ""}
                  value={formData.newCategory}
                  onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
                  placeholder="e.g., SaaS Platforms"
                />
                <span className="form-hint">Pick a label that makes sense to you.</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">Add company</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyModal;
