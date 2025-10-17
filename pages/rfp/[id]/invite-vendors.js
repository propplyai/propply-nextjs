/**
 * Invite Vendors Page
 *
 * Invite vendors to submit proposals for an RFP
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft, UserPlus, Mail, Phone, Building2, Send,
  Trash2, CheckCircle, AlertCircle, Plus
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase, authHelpers } from '@/lib/supabase';

export default function InviteVendorsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rfpLoading, setRfpLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rfp, setRfp] = useState(null);
  const [invitationTemplate, setInvitationTemplate] = useState(null);
  const [vendors, setVendors] = useState([
    { name: '', email: '', phone: '', place_id: null }
  ]);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadData();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setRfpLoading(true);
      
      // Load RFP
      const { data: rfpData, error: rfpError } = await supabase
        .from('rfp_projects')
        .select('*, properties(address, city, state)')
        .eq('id', id)
        .single();

      if (rfpError) throw rfpError;
      setRfp(rfpData);

      // Load invitation template
      const { data: docs, error: docsError } = await supabase
        .from('rfp_documents')
        .select('*')
        .eq('rfp_project_id', id)
        .eq('document_type', 'vendor_invitation')
        .single();

      if (!docsError && docs) {
        const templateContent = JSON.parse(docs.document_content);
        setInvitationTemplate(templateContent);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRfpLoading(false);
    }
  };

  const addVendor = () => {
    setVendors([...vendors, { name: '', email: '', phone: '', place_id: null }]);
  };

  const removeVendor = (index) => {
    setVendors(vendors.filter((_, i) => i !== index));
  };

  const updateVendor = (index, field, value) => {
    const updated = [...vendors];
    updated[index][field] = value;
    setVendors(updated);
  };

  const handleSendInvitations = async () => {
    try {
      setSubmitting(true);

      // Validate vendors
      const validVendors = vendors.filter(v => v.name && v.email);
      if (validVendors.length === 0) {
        alert('Please add at least one vendor with name and email');
        return;
      }

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Send invitations via API
      const response = await fetch('/api/rfp/invite-vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          rfp_project_id: id,
          vendors: validVendors
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully invited ${validVendors.length} vendor(s)!`);
        router.push(`/rfp/${id}`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  if (loading || rfpLoading) {
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

  if (!rfp) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">RFP Not Found</h3>
            <button onClick={() => router.push('/rfp')} className="btn-primary">
              Back to RFPs
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/rfp/${id}`)}
              className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Invite Vendors</h1>
              <p className="text-slate-400">{rfp.project_title}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vendor List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Vendor List</span>
                </h2>
                <button
                  onClick={addVendor}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vendor</span>
                </button>
              </div>

              <div className="space-y-4">
                {vendors.map((vendor, index) => (
                  <div key={index} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-white font-medium">Vendor #{index + 1}</h3>
                      {vendors.length > 1 && (
                        <button
                          onClick={() => removeVendor(index)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          value={vendor.name}
                          onChange={(e) => updateVendor(index, 'name', e.target.value)}
                          placeholder="John Doe"
                          className="input-modern w-full"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={vendor.email}
                          onChange={(e) => updateVendor(index, 'email', e.target.value)}
                          placeholder="john@company.com"
                          className="input-modern w-full"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={vendor.phone}
                          onChange={(e) => updateVendor(index, 'phone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className="input-modern w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  * Required fields
                </p>
                <button
                  onClick={handleSendInvitations}
                  disabled={submitting}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send Invitations'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            {invitationTemplate && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Preview</span>
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">Subject:</div>
                    <div className="text-white font-medium">{invitationTemplate.subject}</div>
                  </div>

                  <div>
                    <div className="text-slate-400 mb-1">Message:</div>
                    <div className="p-3 bg-slate-800 rounded text-slate-300 whitespace-pre-line text-xs">
                      {invitationTemplate.template}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Information</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <Building2 className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <div className="text-slate-400">Property</div>
                    <div className="text-white">{rfp.properties?.address}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <div className="text-slate-400">Status</div>
                    <div className="text-white capitalize">{rfp.status.replace('_', ' ')}</div>
                  </div>
                </div>

                {rfp.deadline_date && (
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <div className="text-slate-400">Deadline</div>
                      <div className="text-white">
                        {new Date(rfp.deadline_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>

              <div className="space-y-3 text-sm text-slate-400">
                <p>
                  1. Add vendor contact information
                </p>
                <p>
                  2. Review the email preview
                </p>
                <p>
                  3. Click "Send Invitations" to notify vendors
                </p>
                <p>
                  4. Vendors will receive an email with RFP details and submission instructions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
