import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authHelpers } from '@/lib/supabase';
import { FileText, ArrowLeft } from 'lucide-react';

export default function ComplianceIndexPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

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
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        <div className="card text-center py-20">
          <FileText className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Compliance Reports
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Compliance reports are accessed through individual properties. 
            Go to a property and generate or view its compliance report.
          </p>
          <Link href="/properties" className="btn-primary inline-flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go to Properties
          </Link>
        </div>
      </div>
    </Layout>
  );
}
