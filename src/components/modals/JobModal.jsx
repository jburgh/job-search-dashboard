import React, { useState } from 'react';
import { STATUSES } from '../../constants/jobStatuses';
import { PROGRESSIONS } from '../../constants/progressionStages';
import { PRIORITIES } from '../../constants/priorities';
import { CLOSE_REASONS } from '../../constants/closeReasons';

/**
 * Modal for adding/editing job applications
 * @param {Object} job - Existing job to edit (optional)
 * @param {Object} prefillCompany - Company object to prefill when adding from companies view (optional)
 * @param {Function} onSave - Callback when job is saved
 * @param {Function} onClose - Callback to close the modal
 */
function JobModal({ job, prefillCompany, onSave, onClose }) {
  const [formData, setFormData] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const defaults = {
      company: prefillCompany?.name || "",
      role: "",
      url: "",
      status: "Applied",
      priority: "Tier 2",
      salary: "",
      location: "",
      contact: "",
      notes: "",
      followUp: "",
      dateApplied: today,
      closeReason: "",
      progression: "Application",
      resumeUrl: "",
      coverLetterUrl: ""
    };

    if (job) {
      return {
        ...defaults,
        ...job,
        status: job.status || "Applied",
        priority: job.priority || "Tier 2",
        progression: job.progression || "Application",
        dateApplied: job.dateApplied || today
      };
    }

    return defaults;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!formData.company.trim() || !formData.role.trim()) {
        alert("Company and Role are required");
        return;
      }

      const jobToSave = {
        ...formData,
        status: formData.status || "Applied",
        priority: formData.priority || "Tier 2",
        progression: formData.progression || "Application"
      };

      onSave(jobToSave);
    } catch (error) {
      console.error("Error submitting job:", error);
      alert("Error saving job: " + error.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{job?.id ? "Edit application" : "Add application"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Company *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role title *</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Job URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Resume URL</label>
                <input
                  type="url"
                  placeholder="Link to resume used for this application"
                  value={formData.resumeUrl}
                  onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Cover letter URL</label>
                <input
                  type="url"
                  placeholder="Link to cover letter used for this application"
                  value={formData.coverLetterUrl}
                  onChange={(e) => setFormData({ ...formData, coverLetterUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status *</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date applied</label>
                <input
                  type="date"
                  value={formData.dateApplied}
                  onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              {(formData.status === "In Progress" || formData.status === "Closed") && (
                <div className="form-group">
                  <label>Progression {formData.status === "Closed" && "(final stage)"}</label>
                  <select
                    value={formData.progression || ""}
                    onChange={(e) => setFormData({ ...formData, progression: e.target.value })}
                    disabled={formData.status === "Closed"}
                    style={formData.status === "Closed" ? { backgroundColor: '#2a3248', cursor: 'not-allowed' } : {}}
                  >
                    <option value="">Select progression...</option>
                    {PROGRESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {formData.status === "Closed" && (
              <div className="form-row">
                <div className="form-group">
                  <label>Close reason *</label>
                  <select
                    required
                    value={formData.closeReason || ""}
                    onChange={(e) => setFormData({ ...formData, closeReason: e.target.value })}
                  >
                    <option value="">Select a reason...</option>
                    {Object.values(CLOSE_REASONS).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Close date</label>
                  <input
                    type="date"
                    value={formData.followUp}
                    onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Salary range</label>
                <input
                  type="text"
                  placeholder="e.g., $150k-$180k"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="Remote, Pittsburgh, etc."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact name</label>
              <input
                type="text"
                placeholder="Recruiter or hiring manager"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Interview notes, referral info, etc."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">Save application</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobModal;
