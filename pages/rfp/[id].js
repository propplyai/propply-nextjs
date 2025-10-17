/**
 * RFP Detail Page
 * 
 * View and manage a specific RFP
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, Edit, FileText, Users, Send, Download,
  Clock, DollarSign, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase, authHelpers } from '@/lib/supabase';

export default function RFPDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rfpLoading, setRfpLoading] = useState(true);
  const [rfp, setRfp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [proposals, setProposals] = useState([]);

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
        loadRFPData();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRFPData = async () => {
    try {
      setRfpLoading(true);
      console.log('[RFP Detail] Loading RFP data for ID:', id);

      // Load RFP with all related data
      const { data: rfpData, error: rfpError } = await supabase
        .from('rfp_projects')
        .select(`
          *,
          properties (
            id, address, city, state, zip_code, property_type,
            compliance_score, active_violations
          )
        `)
        .eq('id', id)
        .single();

      if (rfpError) {
        console.error('[RFP Detail] Error loading RFP:', rfpError);
        throw rfpError;
      }

      console.log('[RFP Detail] RFP loaded successfully:', rfpData);
      setRfp(rfpData);

      // Load documents (don't fail if error)
      const { data: docs, error: docsError } = await supabase
        .from('rfp_documents')
        .select('*')
        .eq('rfp_project_id', id)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.warn('[RFP Detail] Error loading documents:', docsError);
      }
      setDocuments(docs || []);

      // Load vendor invitations (don't fail if error)
      const { data: invs, error: invsError } = await supabase
        .from('rfp_vendor_invitations')
        .select('*')
        .eq('rfp_project_id', id)
        .order('created_at', { ascending: false });

      if (invsError) {
        console.warn('[RFP Detail] Error loading invitations:', invsError);
      }
      setInvitations(invs || []);

      // Load vendor proposals (don't fail if error)
      const { data: props, error: propsError } = await supabase
        .from('rfp_vendor_proposals')
        .select(`
          *,
          rfp_vendor_invitations (
            vendor_name, vendor_email, vendor_phone
          )
        `)
        .eq('rfp_project_id', id)
        .order('submitted_at', { ascending: false });

      if (propsError) {
        console.warn('[RFP Detail] Error loading proposals:', propsError);
      }
      setProposals(props || []);

    } catch (error) {
      console.error('[RFP Detail] Critical error loading RFP data:', error);
      setRfp(null); // Ensure we show "not found" message
    } finally {
      setRfpLoading(false);
    }
  };

  const handleGenerateDocuments = async () => {
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch('/api/rfp/generate-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ rfp_project_id: id })
      });

      const result = await response.json();

      if (result.success) {
        alert('RFP documents generated successfully!');
        loadRFPData(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error generating documents:', error);
      alert('Failed to generate documents: ' + error.message);
    }
  };

  const handleInviteVendors = () => {
    router.push(`/rfp/${id}/invite-vendors`);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-500/20 text-slate-300 border border-slate-500/50',
      documents_generated: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
      vendors_contacted: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50',
      published: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50',
      vendor_responses: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
      evaluation: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
      awarded: 'bg-green-500/20 text-green-400 border border-green-500/50',
      completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border border-red-500/50'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-300 border border-slate-500/50';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: Edit,
      documents_generated: FileText,
      vendors_contacted: Send,
      published: CheckCircle,
      vendor_responses: Users,
      evaluation: Clock,
      awarded: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle
    };
    return icons[status] || FileText;
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      documents_generated: 'Documents Generated',
      vendors_contacted: 'Vendors Contacted',
      published: 'Published',
      vendor_responses: 'Active',
      evaluation: 'In Review',
      awarded: 'Awarded',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
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
            <XCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">RFP Not Found</h3>
            <p className="text-slate-500 mb-6">The requested RFP could not be found.</p>
            <button
              onClick={() => router.push('/rfp')}
              className="btn-primary"
            >
              Back to RFPs
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const StatusIcon = getStatusIcon(rfp.status);

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">{rfp.project_title}</h1>
              <p className="text-slate-400">{rfp.properties?.address}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rfp.status)}`}>
              {getStatusLabel(rfp.status)}
            </span>
            {rfp.status === 'draft' && (
              <button
                onClick={() => router.push(`/rfp/${id}/edit`)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <StatusIcon className="w-5 h-5" />
                <span>Project Overview</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">Description</h3>
                  <p className="text-slate-300">{rfp.project_description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-1">Scope of Work</h3>
                  <p className="text-slate-300 whitespace-pre-wrap">{rfp.scope_of_work}</p>
                </div>
                
                {rfp.technical_requirements && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Technical Requirements</h3>
                    <p className="text-slate-300 whitespace-pre-wrap">{rfp.technical_requirements}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Context */}
            {rfp.compliance_issues && rfp.compliance_issues.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Compliance Context</span>
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Compliance Issues</h3>
                    <div className="flex flex-wrap gap-2">
                      {rfp.compliance_issues.map((issue, index) => (
                        <span key={index} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {rfp.regulatory_requirements && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-1">Regulatory Requirements</h3>
                      <p className="text-slate-300">{rfp.regulatory_requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vendor Proposals */}
            {proposals.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Vendor Proposals ({proposals.length})</span>
                </h2>
                
                <div className="space-y-4">
                  {proposals.map(proposal => (
                    <div key={proposal.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{proposal.proposal_title}</h3>
                          <p className="text-sm text-slate-400">
                            {proposal.rfp_vendor_invitations?.vendor_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">
                            ${proposal.proposed_cost?.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-400">
                            {proposal.proposed_timeline_days} days
                          </div>
                        </div>
                      </div>
                      
                      {proposal.proposal_summary && (
                        <p className="text-sm text-slate-300 mb-2">{proposal.proposal_summary}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          proposal.status === 'submitted' ? 'bg-blue-500/20 text-blue-400' :
                          proposal.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-400' :
                          proposal.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {proposal.status.replace('_', ' ')}
                        </span>
                        
                        {proposal.overall_score && (
                          <span className="text-slate-400">
                            Score: {proposal.overall_score}/100
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-400">Timeline</div>
                    <div className="text-white">
                      {rfp.project_timeline_days ? `${rfp.project_timeline_days} days` : 'TBD'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-400">Budget Range</div>
                    <div className="text-white">
                      {rfp.budget_range_min && rfp.budget_range_max 
                        ? `$${rfp.budget_range_min.toLocaleString()} - $${rfp.budget_range_max.toLocaleString()}`
                        : 'TBD'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-400">Urgency</div>
                    <div className="text-white capitalize">{rfp.urgency_level}</div>
                  </div>
                </div>
                
                {rfp.deadline_date && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-400">Deadline</div>
                      <div className="text-white">
                        {new Date(rfp.deadline_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              
              <div className="space-y-3">
                {rfp.status === 'draft' && (
                  <button
                    onClick={handleGenerateDocuments}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Documents</span>
                  </button>
                )}

                {(rfp.status === 'documents_generated' || rfp.status === 'vendors_contacted') && (
                  <button
                    onClick={handleInviteVendors}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Invite Vendors</span>
                  </button>
                )}

                <button
                  onClick={() => router.push(`/rfp/${id}/documents`)}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>View Documents</span>
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendors Invited</span>
                  <span className="text-white">{invitations.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Proposals Received</span>
                  <span className="text-white">{proposals.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Documents Generated</span>
                  <span className="text-white">{documents.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
