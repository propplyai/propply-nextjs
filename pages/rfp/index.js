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
  Edit, Trash2, Send, Download
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
      draft: 'bg-slate-500',
      published: 'bg-blue-500',
      vendor_responses: 'bg-yellow-500',
      evaluation: 'bg-purple-500',
      awarded: 'bg-green-500',
      completed: 'bg-emerald-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: Edit,
      published: FileText,
      vendor_responses: Users,
      evaluation: Clock,
      awarded: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle
    };
    return icons[status] || FileText;
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
      const { error } = await supabase
        .from('rfp_projects')
        .delete()
        .eq('id', rfpId);

      if (error) throw error;

      setRfps(rfps.filter(rfp => rfp.id !== rfpId));
    } catch (error) {
      console.error('Error deleting RFP:', error);
      alert('Failed to delete RFP');
    }
  };

  const handleGenerateDocuments = async (rfpId) => {
    try {
      const response = await fetch('/api/rfp/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfp_project_id: rfpId })
      });

      const result = await response.json();

      if (result.success) {
        alert('RFP documents generated successfully!');
        loadRFPs(user.id); // Refresh the list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error generating documents:', error);
      alert('Failed to generate documents');
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
            <h1 className="text-3xl font-bold text-white mb-2">RFP Management</h1>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'published', 'vendor_responses', 'evaluation', 'awarded', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-corporate-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search RFPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-modern w-full"
            />
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
                <div key={rfp.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{rfp.project_title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(rfp.status)}`}>
                          {rfp.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-400 mb-2">{rfp.properties?.address}</p>
                      <p className="text-slate-300 text-sm">{rfp.project_description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewRFP(rfp.id)}
                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
                        title="View RFP"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {rfp.status === 'draft' && (
                        <button
                          onClick={() => handleEditRFP(rfp.id)}
                          className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
                          title="Edit RFP"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {rfp.status === 'draft' && (
                        <button
                          onClick={() => handleGenerateDocuments(rfp.id)}
                          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                          title="Generate Documents"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteRFP(rfp.id)}
                        className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
                        title="Delete RFP"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">Status: {rfp.status}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{vendorCount} vendors</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{proposalCount} proposals</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">
                        {rfp.project_timeline_days ? `${rfp.project_timeline_days} days` : 'TBD'}
                      </span>
                    </div>
                  </div>
                  
                  {rfp.budget_range_min && rfp.budget_range_max && (
                    <div className="mt-4 flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">
                        Budget: ${rfp.budget_range_min.toLocaleString()} - ${rfp.budget_range_max.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
