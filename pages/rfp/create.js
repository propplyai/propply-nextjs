/**
 * Create RFP Page
 * 
 * Form to create a new Request for Proposal
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Save, FileText, AlertTriangle, 
  DollarSign, Clock, MapPin, CheckCircle
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase, authHelpers } from '@/lib/supabase';

export default function CreateRFPPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState([]);
  const [complianceReports, setComplianceReports] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    property_id: '',
    compliance_report_id: '',
    project_title: '',
    project_description: '',
    project_type: 'compliance_fix',
    scope_of_work: '',
    technical_requirements: '',
    materials_specifications: '',
    quality_standards: '',
    project_timeline_days: '',
    deadline_date: '',
    budget_range_min: '',
    budget_range_max: '',
    urgency_level: 'normal',
    compliance_issues: [],
    regulatory_requirements: '',
    permit_requirements: '',
    inspection_requirements: ''
  });

  const [generateFromCompliance, setGenerateFromCompliance] = useState(false);
  const [selectedComplianceIssues, setSelectedComplianceIssues] = useState([]);

  const projectTypes = [
    { value: 'compliance_fix', label: 'Compliance Fix' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'renovation', label: 'Renovation' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'permit_work', label: 'Permit Work' },
    { value: 'violation_remediation', label: 'Violation Remediation' },
    { value: 'equipment_repair', label: 'Equipment Repair' },
    { value: 'other', label: 'Other' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'text-green-400' },
    { value: 'normal', label: 'Normal', color: 'text-blue-400' },
    { value: 'high', label: 'High', color: 'text-yellow-400' },
    { value: 'critical', label: 'Critical', color: 'text-red-400' }
  ];

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (formData.property_id) {
      loadComplianceReports(formData.property_id);
    }
  }, [formData.property_id]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadProperties(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadComplianceReports = async (propertyId) => {
    try {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplianceReports(data || []);
    } catch (error) {
      console.error('Error loading compliance reports:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplianceIssueToggle = (issue) => {
    setSelectedComplianceIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        compliance_issues: generateFromCompliance ? selectedComplianceIssues : formData.compliance_issues,
        generate_from_compliance: generateFromCompliance
      };

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch('/api/rfp/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/rfp/${result.rfp.id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating RFP:', error);
      alert('Failed to create RFP: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Create RFP</h1>
            <p className="text-slate-400">Create a new Request for Proposal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Selection */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Property Selection</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Property *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => handleInputChange('property_id', e.target.value)}
                  className="input-modern w-full"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.address} - {property.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Compliance Report
                </label>
                <select
                  value={formData.compliance_report_id}
                  onChange={(e) => handleInputChange('compliance_report_id', e.target.value)}
                  className="input-modern w-full"
                >
                  <option value="">Select a compliance report (optional)</option>
                  {complianceReports.map(report => (
                    <option key={report.id} value={report.id}>
                      {new Date(report.created_at).toLocaleDateString()} - Score: {report.overall_score}%
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Project Details</span>
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.project_title}
                    onChange={(e) => handleInputChange('project_title', e.target.value)}
                    className="input-modern w-full"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Type *
                  </label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="input-modern w-full"
                    required
                  >
                    {projectTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={formData.project_description}
                  onChange={(e) => handleInputChange('project_description', e.target.value)}
                  className="input-modern w-full h-24"
                  placeholder="Describe the project in detail"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Scope of Work *
                </label>
                <textarea
                  value={formData.scope_of_work}
                  onChange={(e) => handleInputChange('scope_of_work', e.target.value)}
                  className="input-modern w-full h-32"
                  placeholder="Define the scope of work required"
                  required
                />
              </div>
            </div>
          </div>

          {/* Timeline and Budget */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Timeline & Budget</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Timeline (days)
                </label>
                <input
                  type="number"
                  value={formData.project_timeline_days}
                  onChange={(e) => handleInputChange('project_timeline_days', e.target.value)}
                  className="input-modern w-full"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deadline Date
                </label>
                <input
                  type="date"
                  value={formData.deadline_date}
                  onChange={(e) => handleInputChange('deadline_date', e.target.value)}
                  className="input-modern w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Urgency Level
                </label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => handleInputChange('urgency_level', e.target.value)}
                  className="input-modern w-full"
                >
                  {urgencyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Budget Range (Min)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.budget_range_min}
                    onChange={(e) => handleInputChange('budget_range_min', e.target.value)}
                    className="input-modern w-full pl-10"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Budget Range (Max)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.budget_range_max}
                    onChange={(e) => handleInputChange('budget_range_max', e.target.value)}
                    className="input-modern w-full pl-10"
                    placeholder="5000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical Requirements */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Technical Requirements</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Technical Requirements
                </label>
                <textarea
                  value={formData.technical_requirements}
                  onChange={(e) => handleInputChange('technical_requirements', e.target.value)}
                  className="input-modern w-full h-24"
                  placeholder="Specify technical requirements and standards"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Materials Specifications
                </label>
                <textarea
                  value={formData.materials_specifications}
                  onChange={(e) => handleInputChange('materials_specifications', e.target.value)}
                  className="input-modern w-full h-24"
                  placeholder="Specify required materials and specifications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quality Standards
                </label>
                <textarea
                  value={formData.quality_standards}
                  onChange={(e) => handleInputChange('quality_standards', e.target.value)}
                  className="input-modern w-full h-24"
                  placeholder="Define quality standards and expectations"
                />
              </div>
            </div>
          </div>

          {/* Compliance Context */}
          {formData.property_id && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Compliance Context</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="generateFromCompliance"
                    checked={generateFromCompliance}
                    onChange={(e) => setGenerateFromCompliance(e.target.checked)}
                    className="w-4 h-4 text-corporate-500 bg-slate-700 border-slate-600 rounded focus:ring-corporate-500"
                  />
                  <label htmlFor="generateFromCompliance" className="text-slate-300">
                    Generate RFP from compliance issues
                  </label>
                </div>

                {generateFromCompliance && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select Compliance Issues
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'HPD Violations', 'DOB Violations', 'L&I Violations',
                        'Elevator Issues', 'Boiler Issues', 'Electrical Issues',
                        'Fire Safety', 'Permit Issues', 'Inspection Issues'
                      ].map(issue => (
                        <label key={issue} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedComplianceIssues.includes(issue)}
                            onChange={() => handleComplianceIssueToggle(issue)}
                            className="w-4 h-4 text-corporate-500 bg-slate-700 border-slate-600 rounded focus:ring-corporate-500"
                          />
                          <span className="text-slate-300">{issue}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Regulatory Requirements
                  </label>
                  <textarea
                    value={formData.regulatory_requirements}
                    onChange={(e) => handleInputChange('regulatory_requirements', e.target.value)}
                    className="input-modern w-full h-24"
                    placeholder="Specify regulatory requirements and compliance needs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Permit Requirements
                    </label>
                    <textarea
                      value={formData.permit_requirements}
                      onChange={(e) => handleInputChange('permit_requirements', e.target.value)}
                      className="input-modern w-full h-20"
                      placeholder="Specify permit requirements"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Inspection Requirements
                    </label>
                    <textarea
                      value={formData.inspection_requirements}
                      onChange={(e) => handleInputChange('inspection_requirements', e.target.value)}
                      className="input-modern w-full h-20"
                      placeholder="Specify inspection requirements"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Creating...' : 'Create RFP'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
