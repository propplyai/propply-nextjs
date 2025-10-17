/**
 * RFP Documents Page
 *
 * View and download generated RFP documents
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft, FileText, Download, Mail, ClipboardList,
  Calendar, CheckCircle, AlertCircle
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase, authHelpers } from '@/lib/supabase';

export default function RFPDocumentsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rfp, setRfp] = useState(null);
  const [documents, setDocuments] = useState([]);

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
        .select('*, properties(address)')
        .eq('id', id)
        .single();

      if (rfpError) throw rfpError;
      setRfp(rfpData);

      // Load documents
      const { data: docs, error: docsError } = await supabase
        .from('rfp_documents')
        .select('*')
        .eq('rfp_project_id', id)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docs || []);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getDocumentIcon = (type) => {
    const icons = {
      rfp_published: FileText,
      vendor_invitation: Mail,
      evaluation_sheet: ClipboardList
    };
    return icons[type] || FileText;
  };

  const getDocumentLabel = (type) => {
    const labels = {
      rfp_published: 'Main RFP Document',
      vendor_invitation: 'Vendor Invitation Template',
      evaluation_sheet: 'Proposal Evaluation Sheet'
    };
    return labels[type] || type;
  };

  const handleDownloadDocument = (doc) => {
    try {
      const content = JSON.parse(doc.document_content);
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.document_title.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleViewDocument = (doc) => {
    try {
      const content = JSON.parse(doc.document_content);

      // Create a readable HTML preview
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${doc.document_title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              max-width: 900px;
              margin: 0 auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .section {
              background: white;
              padding: 25px;
              margin-bottom: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 { margin: 0 0 10px 0; font-size: 28px; }
            h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
            h3 { color: #764ba2; margin-top: 20px; }
            .metadata { color: rgba(255,255,255,0.9); font-size: 14px; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background: #e0e7ff;
              color: #667eea;
              border-radius: 12px;
              font-size: 12px;
              margin: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${doc.document_title}</h1>
            <div class="metadata">Generated: ${new Date(doc.created_at).toLocaleString()}</div>
          </div>

          <div class="section">
            <h2>Document Content</h2>
            <pre>${JSON.stringify(content, null, 2)}</pre>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document');
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
              <h1 className="text-3xl font-bold gradient-text">RFP Documents</h1>
              <p className="text-slate-400">{rfp.project_title}</p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Documents Generated</h3>
            <p className="text-slate-500 mb-6">
              Click "Generate Documents" on the RFP detail page to create documents.
            </p>
            <button
              onClick={() => router.push(`/rfp/${id}`)}
              className="btn-primary"
            >
              Back to RFP
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {documents.map((doc) => {
              const Icon = getDocumentIcon(doc.document_type);
              const label = getDocumentLabel(doc.document_type);

              return (
                <div key={doc.id} className="card p-6 hover:border-corporate-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 rounded-lg bg-corporate-500/20">
                        <Icon className="w-6 h-6 text-corporate-400" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{label}</h3>
                          {doc.is_template && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                              Template
                            </span>
                          )}
                        </div>

                        <p className="text-slate-400 mb-3">{doc.document_title}</p>

                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Created {new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{doc.document_type.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Document Info */}
        {documents.length > 0 && (
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Document Information</h3>
            <div className="space-y-3 text-sm text-slate-400">
              <p>
                <strong className="text-white">Main RFP Document:</strong> Contains the complete Request for Proposal with project details, scope of work, compliance context, and requirements.
              </p>
              <p>
                <strong className="text-white">Vendor Invitation Template:</strong> Email template to send to potential vendors when inviting them to submit proposals.
              </p>
              <p>
                <strong className="text-white">Evaluation Sheet:</strong> Template for scoring and comparing vendor proposals using weighted criteria.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
