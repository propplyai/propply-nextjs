/**
 * RFP Evaluation Page
 *
 * Compare and evaluate vendor proposals
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft, Users, DollarSign, Clock, Star,
  Award, CheckCircle, TrendingUp, FileText
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase, authHelpers } from '@/lib/supabase';

export default function RFPEvaluatePage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rfp, setRfp] = useState(null);
  const [vendors, setVendors] = useState([]);
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
      // Load RFP
      const { data: rfpData, error: rfpError } = await supabase
        .from('rfp_projects')
        .select('*, properties(address, city, state)')
        .eq('id', id)
        .single();

      if (rfpError) throw rfpError;
      setRfp(rfpData);

      // Load vendor invitations
      const { data: vendorData, error: vendorError } = await supabase
        .from('rfp_vendor_invitations')
        .select('*')
        .eq('rfp_project_id', id)
        .order('created_at', { ascending: true });

      if (vendorError) throw vendorError;
      setVendors(vendorData || []);

      // Load proposals
      const { data: proposalData, error: proposalError } = await supabase
        .from('rfp_vendor_proposals')
        .select(`
          *,
          rfp_vendor_invitations (
            vendor_name, vendor_email, vendor_phone, vendor_company
          )
        `)
        .eq('rfp_project_id', id)
        .order('submitted_at', { ascending: false });

      if (proposalError) throw proposalError;
      setProposals(proposalData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
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

  if (!rfp) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
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
              <h1 className="text-3xl font-bold gradient-text">Vendor Evaluation</h1>
              <p className="text-slate-400">{rfp.project_title}</p>
            </div>
          </div>
        </div>

        {/* Evaluation Criteria Legend */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Evaluation Criteria</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-400">30%</div>
              <div className="text-sm text-slate-400">Technical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-400">25%</div>
              <div className="text-sm text-slate-400">Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-400">20%</div>
              <div className="text-sm text-slate-400">Timeline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-400">15%</div>
              <div className="text-sm text-slate-400">Qualifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-400">10%</div>
              <div className="text-sm text-slate-400">Compliance</div>
            </div>
          </div>
        </div>

        {/* Vendor Comparison Table */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Vendor Comparison</span>
            </h2>
            <div className="text-sm text-slate-400">
              {vendors.length} vendors invited • {proposals.length} proposals received
            </div>
          </div>

          {vendors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No Vendors Invited</h3>
              <p className="text-slate-500 mb-6">Invite vendors to see them in the evaluation table.</p>
              <button
                onClick={() => router.push(`/rfp/${id}/invite-vendors`)}
                className="btn-primary"
              >
                Invite Vendors
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-4 text-slate-400 font-semibold">Vendor</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-semibold">Status</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-semibold">Cost</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-semibold">Timeline</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-semibold">Score</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-semibold">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor, index) => {
                    const proposal = proposals.find(p => p.invitation_id === vendor.id);
                    const hasProposal = !!proposal;

                    return (
                      <tr
                        key={vendor.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Vendor Info */}
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-semibold text-white">{vendor.vendor_name}</div>
                            <div className="text-sm text-slate-400">{vendor.vendor_email}</div>
                            {vendor.vendor_company && (
                              <div className="text-xs text-slate-500">{vendor.vendor_company}</div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 text-center">
                          {hasProposal ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/50">
                              Submitted
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/50">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Cost */}
                        <td className="py-4 px-4 text-center">
                          {hasProposal && proposal.proposed_cost ? (
                            <div>
                              <div className="text-white font-semibold">
                                ${proposal.proposed_cost.toLocaleString()}
                              </div>
                              {proposal.cost_breakdown && (
                                <div className="text-xs text-slate-400">+ breakdown</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Timeline */}
                        <td className="py-4 px-4 text-center">
                          {hasProposal && proposal.proposed_timeline_days ? (
                            <div className="text-white">{proposal.proposed_timeline_days} days</div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-4 px-4 text-center">
                          {hasProposal && proposal.overall_score ? (
                            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getScoreBg(proposal.overall_score)}`}>
                              <Star className={`w-4 h-4 ${getScoreColor(proposal.overall_score)}`} />
                              <span className={`font-bold ${getScoreColor(proposal.overall_score)}`}>
                                {proposal.overall_score}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Rank */}
                        <td className="py-4 px-4 text-center">
                          {hasProposal && proposal.overall_score ? (
                            <div className="flex items-center justify-center">
                              {proposals
                                .filter(p => p.overall_score)
                                .sort((a, b) => b.overall_score - a.overall_score)
                                .findIndex(p => p.id === proposal.id) + 1 === 1 ? (
                                <div className="flex items-center space-x-1">
                                  <Award className="w-5 h-5 text-yellow-400" />
                                  <span className="text-white font-bold">#1</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">
                                  #{proposals
                                    .filter(p => p.overall_score)
                                    .sort((a, b) => b.overall_score - a.overall_score)
                                    .findIndex(p => p.id === proposal.id) + 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Proposals Details */}
        {proposals.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Proposal Details</h2>
            {proposals.map((proposal) => (
              <div key={proposal.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {proposal.rfp_vendor_invitations?.vendor_name}
                    </h3>
                    <p className="text-sm text-slate-400">{proposal.proposal_title}</p>
                  </div>
                  {proposal.overall_score && (
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getScoreBg(proposal.overall_score)}`}>
                      <Star className={`w-5 h-5 ${getScoreColor(proposal.overall_score)}`} />
                      <span className={`text-2xl font-bold ${getScoreColor(proposal.overall_score)}`}>
                        {proposal.overall_score}
                      </span>
                    </div>
                  )}
                </div>

                {proposal.proposal_summary && (
                  <p className="text-slate-300 mb-4">{proposal.proposal_summary}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-400 mb-2" />
                    <div className="text-xs text-slate-400">Proposed Cost</div>
                    <div className="text-lg font-semibold text-white">
                      ${proposal.proposed_cost?.toLocaleString() || 'N/A'}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-400 mb-2" />
                    <div className="text-xs text-slate-400">Timeline</div>
                    <div className="text-lg font-semibold text-white">
                      {proposal.proposed_timeline_days || 'N/A'} days
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mb-2" />
                    <div className="text-xs text-slate-400">Status</div>
                    <div className="text-lg font-semibold text-white capitalize">
                      {proposal.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
                    <div className="text-xs text-slate-400">Submitted</div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(proposal.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
