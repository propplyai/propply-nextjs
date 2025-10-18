/**
 * AddManualRecordModal Component
 *
 * Modal for adding manual property records (permits, inspections, certifications, violations)
 */

import { useState } from 'react';
import { X, Calendar, FileText, AlertTriangle, CheckCircle, Shield, Flame } from 'lucide-react';
import { cn, authenticatedFetch } from '@/lib/utils';

const RECORD_TYPES = [
  { value: 'permit', label: 'Permit', icon: FileText, color: 'text-blue-400' },
  { value: 'inspection', label: 'Inspection', icon: CheckCircle, color: 'text-green-400' },
  { value: 'certification', label: 'Certification', icon: Shield, color: 'text-purple-400' },
  { value: 'violation', label: 'Violation', icon: AlertTriangle, color: 'text-red-400' }
];

const CATEGORIES = [
  'Boiler', 'Fire Safety', 'Electrical', 'Elevator', 'HVAC', 'Plumbing', 
  'Structural', 'Environmental', 'Accessibility', 'Other'
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'text-green-400' },
  { value: 'expired', label: 'Expired', color: 'text-red-400' },
  { value: 'pending', label: 'Pending', color: 'text-yellow-400' },
  { value: 'completed', label: 'Completed', color: 'text-blue-400' }
];

export default function AddManualRecordModal({ 
  isOpen, 
  onClose, 
  propertyId, 
  onRecordAdded 
}) {
  const [formData, setFormData] = useState({
    type: 'permit',
    category: 'Boiler',
    title: '',
    description: '',
    date: '',
    expiration_date: '',
    status: 'active',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/compliance/manual-entries', {
        method: 'POST',
        body: JSON.stringify({
          property_id: propertyId,
          ...formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create record');
      }

      // Reset form
      setFormData({
        type: 'permit',
        category: 'Boiler',
        title: '',
        description: '',
        date: '',
        expiration_date: '',
        status: 'active',
        notes: ''
      });

      // Notify parent component
      if (onRecordAdded) {
        onRecordAdded(data.entry);
      }

      onClose();
    } catch (err) {
      console.error('Error creating manual record:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedType = RECORD_TYPES.find(t => t.value === formData.type);
  const TypeIcon = selectedType?.icon || FileText;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-start justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-corporate-500/20 rounded-lg flex items-center justify-center">
                <TypeIcon className={`w-5 h-5 ${selectedType?.color || 'text-corporate-400'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Manual Record</h2>
                <p className="text-sm text-slate-400">Add a new property compliance record</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Record Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Record Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {RECORD_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange('type', type.value)}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-left',
                        formData.type === type.value
                          ? 'border-corporate-500 bg-corporate-500/10'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${type.color}`} />
                        <span className="font-medium text-white">{type.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="input-modern w-full"
                  required
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="input-modern w-full"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Annual Boiler Inspection"
                className="input-modern w-full"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Additional details about this record..."
                rows={3}
                className="input-modern w-full"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="input-modern w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => handleChange('expiration_date', e.target.value)}
                  className="input-modern w-full"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Internal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Private notes for your reference..."
                rows={2}
                className="input-modern w-full"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg">
                <div className="text-sm text-ruby-300">{error}</div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center space-x-4 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Creating...' : 'Add Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
