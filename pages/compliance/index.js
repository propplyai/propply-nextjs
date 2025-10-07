import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers, supabase } from '@/lib/supabase';
import { 
  FileText, Building2, Calendar, TrendingUp, AlertTriangle, 
  CheckCircle, ExternalLink 
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function ComplianceIndexPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user: currentUser } = await authHelpers.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    await loadReports(currentUser.id);
  };

  const loadReports = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('nyc_compliance_reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error loading reports:', error);
        throw error;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  const getScoreBadge = (score) => {
    if (score >= 70) {
      return { color: 'text-emerald-400 bg-emerald-500/10', label: 'GOOD' };
    } else if (score >= 40) {
      return { color: 'text-gold-400 bg-gold-500/10', label: 'CAUTION' };
    }
    return { color: 'text-ruby-400 bg-ruby-500/10', label: 'CRITICAL' };
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Compliance Reports</h1>
          <p className="text-slate-400">View all generated compliance reports for your properties</p>
        </div>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="card text-center py-20">
            <FileText className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">
              No Compliance Reports Yet
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Generate your first compliance report by going to a property and clicking 
              "Generate NYC Compliance Report".
            </p>
            <Link href="/properties" className="btn-primary inline-flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Go to Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const badge = getScoreBadge(report.overall_score);
              const totalViolations = (report.hpd_violations_active || 0) + (report.dob_violations_active || 0);
              
              return (
                <Link 
                  key={report.id} 
                  href={`/compliance/${report.id}`}
                  className="card hover:scale-102 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-corporate-400 transition-colors">
                        {report.address}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {report.borough} • BIN: {report.bin}
                      </p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-corporate-400 transition-colors" />
                  </div>

                  {/* Score Display */}
                  <div className="mb-4 p-4 bg-slate-800/50 rounded-lg text-center">
                    <div className="text-4xl font-bold text-white mb-1">
                      {report.overall_score}%
                    </div>
                    <div className={cn('text-xs font-bold uppercase px-3 py-1 rounded-full inline-block', badge.color)}>
                      {badge.label}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Active Violations:</span>
                      <span className={cn(
                        'font-semibold',
                        totalViolations > 0 ? 'text-ruby-400' : 'text-emerald-400'
                      )}>
                        {totalViolations}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">HPD:</span>
                      <span className="text-white">{report.hpd_violations_active || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">DOB:</span>
                      <span className="text-white">{report.dob_violations_active || 0}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Generated {formatDate(report.generated_at)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
