import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import {
  Building2, ArrowLeft, RefreshCw, TrendingUp, Flame, Zap, AlertTriangle
} from 'lucide-react';
import { cn, authenticatedFetch } from '@/lib/utils';

export default function DismissedSectionsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [dismissedSections, setDismissedSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady && id) {
      checkAuth();
    }
  }, [id, router.isReady]);

  const checkAuth = async () => {
    try {
      const { user: currentUser, error: authError } = await authHelpers.getUser();
      
      if (authError || !currentUser) {
        const returnUrl = router.asPath;
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        }, 100);
        return;
      }
      
      setUser(currentUser);
      await loadData(id);
    } catch (error) {
      console.error('Error during auth check:', error);
      setLoading(false);
    }
  };

  const loadData = async (reportId) => {
    try {
      // Load report
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No valid session');

      const { data: reportData, error: reportError } = await supabase
        .from('compliance_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;
      setReport(reportData);

      // Load dismissed sections
      const response = await authenticatedFetch(`/api/compliance/dismissed?report_id=${reportId}`);
      const result = await response.json();
      
      if (result.success) {
        setDismissedSections(result.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (sectionType) => {
    try {
      const response = await authenticatedFetch('/api/compliance/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: id,
          section_type: sectionType
        })
      });

      const result = await response.json();
      if (result.success) {
        setDismissedSections(dismissedSections.filter(d => d.section_type !== sectionType));
      }
    } catch (error) {
      console.error('Error restoring section:', error);
    }
  };

  const getSectionIcon = (sectionType) => {
    const icons = {
      elevators: <TrendingUp className="w-6 h-6" />,
      boilers: <Flame className="w-6 h-6" />,
      electrical: <Zap className="w-6 h-6" />,
      hpd: <AlertTriangle className="w-6 h-6" />,
      dob: <AlertTriangle className="w-6 h-6" />
    };
    return icons[sectionType] || <Building2 className="w-6 h-6" />;
  };

  const getSectionName = (sectionType) => {
    const names = {
      elevators: 'Elevator Equipment',
      boilers: 'Boiler Equipment',
      electrical: 'Electrical Permits',
      hpd: 'HPD Violations',
      dob: 'DOB Violations'
    };
    return names[sectionType] || sectionType;
  };

  const getSectionColor = (sectionType) => {
    const colors = {
      elevators: 'bg-corporate-500/10 text-corporate-400',
      boilers: 'bg-ruby-500/10 text-ruby-400',
      electrical: 'bg-gold-500/10 text-gold-400',
      hpd: 'bg-ruby-500/10 text-ruby-400',
      dob: 'bg-ruby-500/10 text-ruby-400'
    };
    return colors[sectionType] || 'bg-slate-500/10 text-slate-400';
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="text-center text-white">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="container-modern py-8">
          <div className="text-center text-white">Report not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        {/* Back Button */}
        <Link
          href={`/compliance/${id}`}
          className="inline-flex items-center text-corporate-400 hover:text-corporate-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Compliance Report
        </Link>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dismissed Sections</h1>
              <p className="text-slate-400">
                {report.address}
              </p>
            </div>
          </div>
        </div>

        {/* Dismissed Sections */}
        {dismissedSections.length === 0 ? (
          <div className="card text-center py-12">
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Dismissed Sections</h2>
            <p className="text-slate-400 mb-6">
              You haven't dismissed any sections yet. Swipe sections left or right on the compliance page to dismiss them.
            </p>
            <Link href={`/compliance/${id}`} className="btn-primary inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {dismissedSections.map((section) => (
              <div key={section.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', getSectionColor(section.section_type))}>
                      {getSectionIcon(section.section_type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {getSectionName(section.section_type)}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Dismissed {new Date(section.dismissed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(section.section_type)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

