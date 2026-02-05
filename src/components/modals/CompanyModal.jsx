import React, { useState } from 'react';

/**
 * Modal for adding new companies
 */
function CompanyModal({ onSave, onClose, existingCategories }) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    category: existingCategories[0] || "",
    newCategory: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const category = formData.newCategory.trim() || formData.category;
      if (!category || !formData.name.trim() || !formData.url.trim()) {
        alert("Please fill in all required fields");
        return;
      }
      onSave({
        name: formData.name.trim(),
        url: formData.url.trim(),
        category: category.trim()
      });
    } catch (error) {
      console.error("Error submitting company:", error);
      alert("Error saving company. Please try again.");
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
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, newCategory: "" })}
                required={!formData.newCategory}
              >
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="">Create new category</option>
              </select>
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
