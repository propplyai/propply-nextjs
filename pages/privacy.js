import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { authHelpers } from '@/lib/supabase';
import { Shield, Lock, Eye, Globe, Database, UserCheck, Bell, Cookie, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user: currentUser } = await authHelpers.getUser();
    setUser(currentUser);
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-6">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Privacy Policy</h1>
          <p className="text-slate-400 text-lg">Effective Date: October 2025</p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="card space-y-8">
            {/* Intro */}
            <section>
              <p className="text-slate-300 leading-relaxed">
                Propply AI LLC ("Company," "we") provides Propply AI and related websites/services (collectively, the "Services"). This Privacy Policy explains how we collect, use, disclose, and protect personal information.
              </p>
            </section>

            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">1</span>
                Scope
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  This Policy applies to personal information we process as Controller (e.g., our website, marketing, account administration). When we provide the Services to a business customer, we typically act as a Processor of Customer Data under our DPA. If you are an end user whose data is submitted by a customer, please direct privacy questions to that customer.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <Database className="w-5 h-5" />
                </span>
                Information We Collect
              </h2>
              <div className="pl-11 space-y-6">
                {/* Subsection a */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">a) You Provide to Us</h3>
                  <ul className="list-disc list-outside space-y-2 ml-5 text-slate-300">
                    <li>Account and profile (name, email, password, role, company, phone)</li>
                    <li>Billing (payment card token, billing address) processed by our payment processor; we do not store full card numbers</li>
                    <li>Content you upload/submit (files, messages, form inputs)</li>
                    <li>Support and communications</li>
                  </ul>
                </div>

                {/* Subsection b */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">b) Collected Automatically</h3>
                  <ul className="list-disc list-outside space-y-2 ml-5 text-slate-300">
                    <li>Log and device data (IP address, browser type/version, OS, device identifiers, language, referring URLs)</li>
                    <li>Usage data (feature interactions, pages viewed, timestamps, crash reports)</li>
                    <li>Cookies and similar technologies (pixels, SDKs). See our Cookie Notice at [link].</li>
                  </ul>
                </div>

                {/* Subsection c */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">c) From Third Parties</h3>
                  <ul className="list-disc list-outside space-y-2 ml-5 text-slate-300">
                    <li>Single sign-on providers, identity verification</li>
                    <li>Payment processors</li>
                    <li>Referrals/partners, marketing platforms</li>
                  </ul>
                </div>

                {/* Subsection d */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">d) Sensitive Data</h3>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-slate-300">
                      We do not seek to collect Sensitive Personal Information unless necessary and permitted by law. Do not submit such data without an appropriate agreement and safeguards.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <Eye className="w-5 h-5" />
                </span>
                How We Use Personal Information (Purposes)
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li>Provide, maintain, and improve the Services</li>
                  <li>Create and manage accounts; authenticate users</li>
                  <li>Process transactions; send invoices/receipts</li>
                  <li>Provide support; respond to inquiries</li>
                  <li>Analyze usage and develop new features</li>
                  <li>Detect, prevent, and respond to security incidents and abuse</li>
                  <li>Comply with law and enforce terms; protect rights, safety, and property</li>
                  <li>Send service-related and (with consent or as permitted) marketing communications, which you can opt out of at any time</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">4</span>
                Legal Bases (EEA/UK)
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  Where GDPR/UK GDPR applies, we process personal data on the following bases: (i) contract performance, (ii) legitimate interests (e.g., to secure, improve, and market our Services), (iii) consent (where required, e.g., certain cookies/marketing), and (iv) legal obligations.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">5</span>
                How We Share Information
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li><strong className="text-white">Service Providers/Processors</strong> (hosting, analytics, email, support, payments, fraud prevention)</li>
                  <li><strong className="text-white">Partners</strong> (with consent or as permitted for referrals/integrations)</li>
                  <li><strong className="text-white">Corporate Transactions</strong> (merger, financing, acquisition)</li>
                  <li><strong className="text-white">Legal/Compliance</strong> (to comply with law, protect rights/safety)</li>
                  <li><strong className="text-white">Aggregated/De-identified</strong> data that cannot reasonably be used to identify you</li>
                </ul>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mt-4">
                  <p className="text-slate-300">
                    We do not sell personal information. We may share identifiers and internet activity with advertising/analytics partners for cross-context behavioral advertising where permitted—see Your Privacy Rights for opt-out options.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <Globe className="w-5 h-5" />
                </span>
                International Transfers
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We may transfer personal information to countries with different data protection laws. Where required, we use appropriate safeguards, such as Standard Contractual Clauses and supplementary measures.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">7</span>
                Data Retention
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We retain personal information for as long as necessary to fulfill the purposes above, comply with legal obligations, resolve disputes, and enforce agreements. Criteria include the type of data, the nature of our relationship, and legal/accounting requirements.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <Lock className="w-5 h-5" />
                </span>
                Security
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We employ administrative, technical, and organizational measures designed to protect personal information. No security program is perfect; we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <UserCheck className="w-5 h-5" />
                </span>
                Your Privacy Rights
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  Depending on your location, you may have rights to request: access, correction, deletion, portability, restriction/objection to processing, and to withdraw consent. Residents of certain U.S. states (e.g., CA, CO, CT, UT, VA) may also opt out of sales, sharing for cross-context behavioral advertising/targeted advertising, and certain profiling. You will not face discrimination for exercising rights.
                </p>
                <div className="bg-corporate-500/10 border border-corporate-500/30 rounded-lg p-4 mt-4">
                  <p className="text-white font-semibold mb-2">How to exercise rights:</p>
                  <p className="text-slate-300">
                    Email <a href="mailto:propplyai@gmail.com" className="text-corporate-400 hover:text-corporate-300 underline">propplyai@gmail.com</a>. We will verify your request and respond as required by law. Authorized agents may submit requests with proof of authority and identity.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 - California Residents */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">10</span>
                Notice to California Residents (CPRA)
              </h2>
              <div className="pl-11 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Categories Collected:</h3>
                  <p className="text-slate-300">
                    identifiers (name, email, IP), commercial information (transaction history), internet/network activity (usage, logs), geolocation (coarse), inferences (product interest). We do not knowingly collect "sensitive personal information" for the purpose of inferring characteristics.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Sources:</h3>
                  <p className="text-slate-300">you, your devices, our service providers/partners.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Purposes:</h3>
                  <p className="text-slate-300">as listed above.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Retention:</h3>
                  <p className="text-slate-300">as described above.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Disclosure:</h3>
                  <p className="text-slate-300">to service providers/processors and, where applicable, advertising/analytics partners.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Sales/Sharing:</h3>
                  <p className="text-slate-300">
                    We do not sell personal information for money. We may share limited identifiers and internet activity with advertising/analytics partners for cross-context behavioral advertising. You can opt out via "Do Not Sell or Share My Personal Information" at [link] and by adjusting cookie preferences in our Cookie Notice.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Right to Limit Use of Sensitive Personal Information:</h3>
                  <p className="text-slate-300">
                    Not applicable unless we collect such data for non-exempt purposes.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">11</span>
                Children's Privacy
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p>
                    The Services are not directed to children under 13 (or 16 in the EEA/UK). We do not knowingly collect personal information from children. If you believe a child has provided information, contact us to delete it.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <Cookie className="w-5 h-5" />
                </span>
                Cookies and Tracking
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We use cookies and similar technologies for authentication, preferences, analytics, and advertising. You can manage preferences in our Cookie Notice and via your browser settings. Where required, we obtain consent for non-essential cookies.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <Mail className="w-5 h-5" />
                </span>
                Data Controller; Contact
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-white">Contact:</strong> <a href="mailto:propplyai@gmail.com" className="text-corporate-400 hover:text-corporate-300 underline">propplyai@gmail.com</a>
                </p>
              </div>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">14</span>
                Third-Party Links and Services
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  Our Services may link to third-party sites or services. We are not responsible for their privacy practices.
                </p>
              </div>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3 text-emerald-400 font-bold">
                  <Bell className="w-5 h-5" />
                </span>
                Changes to this Policy
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We may update this Policy from time to time. We will post changes and update the Effective Date. Material changes will be notified via the Service or email.
                </p>
              </div>
            </section>

            {/* Contact Box */}
            <section className="border-t border-slate-700 pt-8">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-emerald-400" />
                  Questions About Your Privacy?
                </h3>
                <div className="space-y-2 text-slate-300">
                  <p>
                    If you have questions about this Privacy Policy or how we handle your personal information, please contact us:
                  </p>
                  <p className="mt-4">
                    <strong className="text-white">Email:</strong> <a href="mailto:propplyai@gmail.com" className="text-corporate-400 hover:text-corporate-300 underline">propplyai@gmail.com</a>
                  </p>
                  <p>
                    <strong className="text-white">Company:</strong> Propply AI, LLC
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
