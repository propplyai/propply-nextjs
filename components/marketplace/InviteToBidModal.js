/**
 * InviteToBidModal Component
 *
 * Modal for inviting a vendor to an existing RFP or creating a new one
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import {
  X, FileText, Plus, Send, Loader2, AlertCircle,
  CheckCircle, Calendar, DollarSign, Clock, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function InviteToBidModal({ vendor, isOpen, onClose, propertyId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rfps, setRfps] = useState([]);
  const [selectedRfp, setSelectedRfp] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset modal state
      setSuccess(false);
      setError('');
      setSelectedRfp(null);

      // Use requestAnimationFrame to defer body scroll change until after the modal renders
      requestAnimationFrame(() => {
        document.body.style.overflow = 'hidden';
      });

      // Load RFPs asynchronously without blocking
      loadRFPs();
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadRFPs = async () => {
    const startTime = Date.now();

    try {
      setLoading(true);

      // Fetch RFPs that are ready for vendor invitations
      const { data, error } = await supabase
        .from('rfp_projects')
        .select(`
          id,
          project_title,
          status,
          created_at,
          deadline_date,
          budget_range_min,
          budget_range_max,
          project_timeline_days,
          properties!inner (
            id, address, city, state
          )
        `)
        .in('status', ['documents_generated', 'vendors_contacted'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setRfps(data || []);

      // Ensure minimum loading time of 300ms to prevent UI flashing
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 300) {
        await new Promise(resolve => setTimeout(resolve, 300 - elapsedTime));
      }
    } catch (err) {
      console.error('Error loading RFPs:', err);
      setError('Failed to load RFPs');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToExisting = async () => {
    if (!selectedRfp) {
      setError('Please select an RFP');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Send invitation via API
      const response = await fetch('/api/rfp/invite-vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          rfp_project_id: selectedRfp,
          vendors: [{
            place_id: vendor.place_id || vendor.vendor_place_id,
            name: vendor.name || vendor.vendor_name,
            email: vendor.email || vendor.vendor_email,
            phone: vendor.phone || vendor.vendor_phone
          }]
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          // Optionally redirect to the RFP page
          // router.push(`/rfp/${selectedRfp}`);
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      console.error('Error inviting vendor:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewRFP = () => {
    // Navigate to RFP creation with vendor pre-selected
    const params = new URLSearchParams();
    if (propertyId) params.append('property_id', propertyId);

    const vendorId = vendor.place_id || vendor.vendor_place_id;
    const vendorName = vendor.name || vendor.vendor_name;

    if (vendorId) params.append('vendor_id', vendorId);
    if (vendorName) params.append('vendor_name', encodeURIComponent(vendorName));

    router.push(`/rfp/create?${params.toString()}`);
  };

  const getStatusColor = (status) => {
    return status === 'documents_generated'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
  };

  const getStatusLabel = (status) => {
    return status === 'documents_generated' ? 'Ready to Send' : 'Active';
  };

  if (!isOpen || !mounted) return null;

  const vendorName = vendor.name || vendor.vendor_name;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] my-8 overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Send className="w-6 h-6 text-corporate-400" />
              <span>Invite to Bid</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Invite <span className="text-white font-medium">{vendorName}</span> to submit a proposal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-corporate-400 animate-spin" />
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Invitation Sent!</h3>
              <p className="text-slate-400">
                {vendorName} has been invited to bid on this project.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-ruby-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-ruby-300">{error}</div>
                </div>
              )}

              {/* Option 1: Select Existing RFP */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Select Existing RFP
                </h3>

                {rfps.length === 0 ? (
                  <div className="p-4 bg-slate-700/30 rounded-lg text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No active RFPs available for vendor invitations.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      RFPs must have documents generated to invite vendors.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {rfps.map((rfp) => (
                      <div
                        key={rfp.id}
                        onClick={() => setSelectedRfp(rfp.id)}
                        className={cn(
                          'p-4 rounded-lg border-2 cursor-pointer transition-all',
                          selectedRfp === rfp.id
                            ? 'border-corporate-500 bg-corporate-500/10'
                            : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-medium">{rfp.project_title}</h4>
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium border',
                            getStatusColor(rfp.status)
                          )}>
                            {getStatusLabel(rfp.status)}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2 text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{rfp.properties?.address}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            {rfp.deadline_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {new Date(rfp.deadline_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {rfp.project_timeline_days && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{rfp.project_timeline_days} days</span>
                              </div>
                            )}
                            {rfp.budget_range_min && rfp.budget_range_max && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>
                                  ${(rfp.budget_range_min / 1000).toFixed(0)}k-
                                  ${(rfp.budget_range_max / 1000).toFixed(0)}k
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="text-sm text-slate-500">OR</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>

              {/* Option 2: Create New RFP */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Create New RFP
                </h3>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-slate-400 mb-4">
                    Start a new Request for Proposal with this vendor pre-selected.
                  </p>
                  <button
                    onClick={handleCreateNewRFP}
                    className="btn-outline w-full flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New RFP</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !success && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteToExisting}
              disabled={!selectedRfp || submitting}
              className="btn-primary flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
