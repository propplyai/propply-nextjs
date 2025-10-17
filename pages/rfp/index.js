/**
 * RFP Management Dashboard
 * 
 * Main page for managing Request for Proposals
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Plus, FileText, Users, Clock, DollarSign,
  AlertTriangle, CheckCircle, XCircle, Eye,
  Edit, Trash2, Send, Download, MapPin
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase, authHelpers } from '@/lib/supabase';

export default function RFPDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rfps, setRfps] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadRFPs(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRFPs = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('rfp_projects')
        .select(`
          *,
          properties (
            id, address, city, state
          ),
          rfp_vendor_invitations (
            id, vendor_name, invitation_status, vendor_response_at
          ),
          rfp_vendor_proposals (
            id, proposal_title, proposed_cost, status, overall_score
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfps(data || []);
    } catch (error) {
      console.error('Error loading RFPs:', error);
    }
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

  const filteredRFPs = rfps.filter(rfp => {
    const matchesFilter = filter === 'all' || rfp.status === filter;
    const matchesSearch = rfp.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rfp.properties?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateRFP = () => {
    router.push('/rfp/create');
  };

  const handleViewRFP = (rfpId) => {
    router.push(`/rfp/${rfpId}`);
  };

  const handleEditRFP = (rfpId) => {
    router.push(`/rfp/${rfpId}/edit`);
  };

  const handleDeleteRFP = async (rfpId) => {
    if (!confirm('Are you sure you want to delete this RFP? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('[RFP Delete] Attempting to delete RFP:', rfpId);
      
      const { error } = await supabase
        .from('rfp_projects')
        .delete()
        .eq('id', rfpId);

      if (error) {
        console.error('[RFP Delete] Database error:', error);
        throw error;
      }

      console.log('[RFP Delete] Successfully deleted RFP:', rfpId);
      setRfps(rfps.filter(rfp => rfp.id !== rfpId));
      
      // Show success message
      alert('RFP deleted successfully!');
    } catch (error) {
      console.error('[RFP Delete] Error deleting RFP:', error);
      alert(`Failed to delete RFP: ${error.message}`);
    }
  };

  const handleGenerateDocuments = async (rfpId) => {
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
        body: JSON.stringify({ rfp_project_id: rfpId })
      });

      const result = await response.json();

      if (result.success) {
        const message = result.regenerated
          ? 'RFP documents regenerated successfully!'
          : 'RFP documents generated successfully!';
        alert(message);

        // Refresh the list to show updated status
        await loadRFPs(user.id);
      } else {
        throw new Error(result.error || result.message);
      }
    } catch (error) {
      console.error('Error generating documents:', error);
      alert('Failed to generate documents: ' + error.message);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">RFP Management</h1>
            <p className="text-slate-400">Manage your Request for Proposals</p>
          </div>
          <button
            onClick={handleCreateRFP}
            className="btn-primary flex items-center space-x-2 mt-4 md:mt-0"
          >
            <Plus className="w-5 h-5" />
            <span>Create RFP</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All', icon: FileText },
                { value: 'draft', label: 'Draft', icon: Edit },
                { value: 'documents_generated', label: 'Docs Generated', icon: FileText },
                { value: 'vendors_contacted', label: 'Vendors Contacted', icon: Send },
                { value: 'published', label: 'Published', icon: CheckCircle }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    filter === value
                      ? 'bg-corporate-500 text-white shadow-lg shadow-corporate-500/30'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <input
                type="text"
                placeholder="Search RFPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern w-full"
              />
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-slate-400">
            <span>Total: <span className="text-white font-semibold">{rfps.length}</span></span>
            <span>•</span>
            <span>Showing: <span className="text-white font-semibold">{filteredRFPs.length}</span></span>
          </div>
        </div>

        {/* RFP List */}
        <div className="space-y-4">
          {filteredRFPs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No RFPs Found</h3>
              <p className="text-slate-500 mb-6">
                {filter === 'all' 
                  ? 'Create your first RFP to get started'
                  : `No RFPs found with status "${filter}"`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={handleCreateRFP}
                  className="btn-primary"
                >
                  Create RFP
                </button>
              )}
            </div>
          ) : (
            filteredRFPs.map(rfp => {
              const StatusIcon = getStatusIcon(rfp.status);
              const vendorCount = rfp.rfp_vendor_invitations?.length || 0;
              const proposalCount = rfp.rfp_vendor_proposals?.length || 0;

              return (
                <div
                  key={rfp.id}
                  className="card p-6 hover:border-corporate-500/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleViewRFP(rfp.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white group-hover:text-corporate-400 transition-colors">
                          {rfp.project_title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rfp.status)}`}>
                          {getStatusLabel(rfp.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-400 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{rfp.properties?.address}, {rfp.properties?.city}</span>
                      </div>
                      <p className="text-slate-300 text-sm line-clamp-2">{rfp.project_description}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Edit button - show for draft, documents_generated, and vendors_contacted */}
                      {['draft', 'documents_generated', 'vendors_contacted'].includes(rfp.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRFP(rfp.id);
                          }}
                          className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-white transition-all border border-slate-600/50"
                          title="Edit RFP"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {/* Generate Documents button - only for draft status */}
                      {rfp.status === 'draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateDocuments(rfp.id);
                          }}
                          className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/50"
                          title="Generate Documents"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}

                      {/* Invite Vendors button - for documents_generated and vendors_contacted */}
                      {['documents_generated', 'vendors_contacted'].includes(rfp.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/rfp/${rfp.id}/invite-vendors`);
                          }}
                          className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/50"
                          title="Invite Vendors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}

                      {/* Evaluate button - for vendors_contacted and beyond */}
                      {['vendors_contacted', 'published', 'vendor_responses', 'evaluation'].includes(rfp.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/rfp/${rfp.id}/evaluate`);
                          }}
                          className="p-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all border border-purple-500/50"
                          title="Evaluate Proposals"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRFP(rfp.id);
                        }}
                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-500/50"
                        title="Delete RFP"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-slate-700/30">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Vendors</p>
                        <p className="text-sm font-semibold text-white">{vendorCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-slate-700/30">
                        <FileText className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Proposals</p>
                        <p className="text-sm font-semibold text-white">{proposalCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-slate-700/30">
                        <Clock className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Timeline</p>
                        <p className="text-sm font-semibold text-white">
                          {rfp.project_timeline_days ? `${rfp.project_timeline_days}d` : 'TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-slate-700/30">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Budget</p>
                        <p className="text-sm font-semibold text-white">
                          {rfp.budget_range_min && rfp.budget_range_max
                            ? `$${(rfp.budget_range_min / 1000).toFixed(0)}k-${(rfp.budget_range_max / 1000).toFixed(0)}k`
                            : 'TBD'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
