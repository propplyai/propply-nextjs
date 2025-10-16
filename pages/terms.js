import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { authHelpers } from '@/lib/supabase';
import { Scale, FileText } from 'lucide-react';

export default function TermsOfService() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-corporate-500/10 rounded-full mb-6">
            <Scale className="w-8 h-8 text-corporate-400" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Terms of Service</h1>
          <p className="text-slate-400 text-lg">Effective Date: October 2025</p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="card space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">1</span>
                Acceptance of Terms
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  These Terms of Service (the "Terms") govern access to and use of Propply AI (the "Service") provided by Propply AI, LLC., a New York State entity with its principal place of business at Propply Address ("Company," "we," "us," "our"). By creating an account, clicking "I agree," or using the Service, you agree to these Terms.
                </p>
                <p>
                  If you are using the Service on behalf of an organization, you represent and warrant that you have authority to bind that organization, and "Customer" refers to that organization.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">2</span>
                Accounts and Eligibility
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li>You must be at least 18 (or the age of majority in your jurisdiction) to use the Service.</li>
                  <li>You are responsible for all activity under your account and for safeguarding credentials.</li>
                  <li>Provide accurate information and keep it updated.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">3</span>
                Subscriptions, Fees, and Taxes
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li>Access may require a paid subscription ("Subscription"). Fees, plan features, and limits are described in your order form or on our pricing page.</li>
                  <li>Subscriptions renew automatically at the then-current rates unless canceled as described below.</li>
                  <li><strong className="text-white">Billing Cycle:</strong> Monthly/annual in advance, unless stated otherwise.</li>
                  <li><strong className="text-white">Trials:</strong> If offered, trials convert to paid plans unless canceled before the trial ends.</li>
                  <li><strong className="text-white">Taxes:</strong> Fees exclude taxes; you are responsible for all applicable taxes, duties, and withholdings.</li>
                  <li><strong className="text-white">Late Payments:</strong> We may suspend or terminate access for unpaid invoices.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">4</span>
                Cancellations; Changes
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li>You may cancel at any time, effective at the end of the current term, via the Service or by contacting <a href="mailto:propplyai@gmail.com" className="text-corporate-400 hover:text-corporate-300 underline">propplyai@gmail.com</a></li>
                  <li>Downgrades or upgrades may change features/limits and take effect at the next renewal unless otherwise stated.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">5</span>
                License and Permitted Use
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to access and use the Service for your internal business purposes during your Subscription term.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">6</span>
                Customer Data &amp; Processing
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li><strong className="text-white">Customer Data</strong> means data, content, and materials submitted to or stored in the Service by or for Customer.</li>
                  <li>Customer retains all rights in Customer Data. You grant us a worldwide, non-exclusive license to host, process, transmit, and display Customer Data to provide and improve the Service, prevent or address technical or security issues, and as required by law.</li>
                  <li>We implement commercially reasonable administrative, technical, and organizational safeguards. See our Security &amp; Privacy Addendum / DPA (if applicable) at [link to DPA].</li>
                  <li>For enterprise customers, we act as a Processor of Customer Data, and Customer is the Controller (as defined under GDPR). Our processing is governed by the DPA.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">7</span>
                Acceptable Use Policy (AUP)
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>You will not (and will not allow any third party to):</p>
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li>copy, modify, or create derivative works of the Service; reverse engineer or attempt to extract source code except to the extent such restrictions are prohibited by law;</li>
                  <li>access the Service to build a competing product or service or to benchmark without our written consent;</li>
                  <li>upload or transmit malware, infringing, or unlawful content; or violate others' rights, including privacy and IP rights;</li>
                  <li>overload, interfere with, or circumvent any security or access controls;</li>
                  <li>use the Service to process Sensitive Personal Data unless permitted in writing (e.g., health, biometric, precise geolocation, financial account numbers, children's data under 13/16, etc.);</li>
                  <li>send unsolicited or deceptive communications or engage in illegal, harmful, or abusive activities.</li>
                </ul>
                <p className="mt-3">We may suspend access for AUP violations.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">8</span>
                Third-Party Services
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  The Service may enable integrations with third-party products or services. Use of third-party services is governed by their terms, not ours. We are not responsible for third-party services.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">9</span>
                Beta/Pre-Release Features
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We may offer beta or experimental features ("Beta Features") for evaluation. Beta Features are provided "AS IS" without warranties and may be discontinued at any time. Usage is at your own risk.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">10</span>
                Intellectual Property; Feedback
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li>We and our licensors retain all right, title, and interest in and to the Service, including all related IP rights.</li>
                  <li>If you provide feedback or suggestions, you grant us a worldwide, perpetual, irrevocable, royalty-free license to use and exploit that feedback without restriction.</li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">11</span>
                Confidentiality
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  "Confidential Information" means non-public information disclosed by one party to the other, which is designated confidential or would reasonably be understood as confidential. Each party will protect the other's Confidential Information using at least the same degree of care it uses to protect its own (but no less than reasonable care) and will use it solely to perform under these Terms.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">12</span>
                Publicity
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We may use Customer's name and logo for identifying Customer as a customer on our website and in marketing materials, subject to your standard brand guidelines. You may opt out by emailing <a href="mailto:propplyai@gmail.com" className="text-corporate-400 hover:text-corporate-300 underline">propplyai@gmail.com</a>.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">13</span>
                Warranties; Disclaimers
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 uppercase text-sm">
                    YOU USE THE SERVICE AT YOUR OWN RISK. EXCEPT AS EXPRESSLY PROVIDED, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">14</span>
                Indemnification
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  Customer will defend, indemnify, and hold harmless Company and its affiliates from and against claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from Customer's (a) use of the Service in violation of these Terms, (b) Customer Data, or (c) violation of law or third-party rights.
                </p>
              </div>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">15</span>
                Limitation of Liability
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
                  <p className="text-slate-300 uppercase text-sm">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                  <ul className="list-disc list-outside space-y-2 ml-5 text-slate-300 text-sm">
                    <li><strong className="text-white">Indirect Damages:</strong> NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, COVER, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, GOODWILL, OR DATA.</li>
                    <li><strong className="text-white">Cap:</strong> EACH PARTY'S TOTAL LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS WILL NOT EXCEED THE AMOUNTS PAID OR PAYABLE BY CUSTOMER TO COMPANY FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO LIABILITY.</li>
                    <li><strong className="text-white">Exclusions:</strong> The above limitations do not apply to amounts owed for fees, breaches of confidentiality, IP infringement obligations (if any), or liability that cannot be limited by law.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">16</span>
                Suspension; Termination
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We may suspend the Service immediately if (a) you breach these Terms (including non-payment or AUP violations) or (b) your use risks security or legal issues. Either party may terminate for material breach after 30 days' written notice if not cured. Upon termination, your license ends and you must stop using the Service. We will make Customer Data export available for 30 days after termination, except where prohibited by law or for cause.
                </p>
              </div>
            </section>

            {/* Section 17 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">17</span>
                Export; Sanctions; Compliance
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  You will comply with all applicable export control, sanctions, and anti-corruption laws. You represent that you are not located in, under control of, or a national or resident of any embargoed country or prohibited party list.
                </p>
              </div>
            </section>

            {/* Section 18 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">18</span>
                Government Use
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  If used by or for the U.S. Government, the Service is Commercial Computer Software and Commercial Computer Software Documentation provided with RESTRICTED RIGHTS as defined in applicable regulations.
                </p>
              </div>
            </section>

            {/* Section 19 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">19</span>
                Changes to Terms
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <p>
                  We may update these Terms from time to time. We will post the updated Terms and update the Effective Date. Material changes will be notified via the Service or email. Continued use after the Effective Date constitutes acceptance.
                </p>
              </div>
            </section>

            {/* Section 20 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">20</span>
                Governing Law; Dispute Resolution
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li><strong className="text-white">Arbitration (U.S. only):</strong> Any dispute will be resolved by binding arbitration administered by [AAA/JAMS] under its rules. <strong className="text-white">CLASS ACTION WAIVER:</strong> Disputes must be brought in an individual capacity; class actions are not permitted. Venue: Westchester, NY.</li>
                </ul>
              </div>
            </section>

            {/* Section 21 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-corporate-500/20 rounded-lg flex items-center justify-center mr-3 text-corporate-400 font-bold">21</span>
                Miscellaneous
              </h2>
              <div className="pl-11 space-y-3 text-slate-300 leading-relaxed">
                <ul className="list-disc list-outside space-y-2 ml-5">
                  <li><strong className="text-white">Notices:</strong> <a href="mailto:propplyai@gmail.com" className="text-corporate-400 hover:text-corporate-300 underline">propplyai@gmail.com</a> (email) and Propply Address (mail), and to Customer at the email/address on file. Electronic notices are sufficient.</li>
                  <li><strong className="text-white">Assignment:</strong> Neither party may assign without the other's consent, except to a successor in a merger, acquisition, or sale of substantially all assets.</li>
                  <li><strong className="text-white">Force Majeure:</strong> Neither party is liable for delays due to causes beyond reasonable control.</li>
                  <li><strong className="text-white">Order of Precedence:</strong> If there is a conflict, the following order controls: (1) any duly executed Order Form or MSA, (2) DPA, (3) these Terms, (4) documentation.</li>
                  <li><strong className="text-white">Severability; Waiver; Entire Agreement:</strong> If a provision is unenforceable, the remainder remains in effect. Failure to enforce is not a waiver. These Terms are the entire agreement on this subject.</li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t border-slate-700 pt-8">
              <div className="bg-corporate-500/10 border border-corporate-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-corporate-400" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong className="text-white">Company:</strong> Propply AI, LLC</p>
                  <p><strong className="text-white">Address:</strong> Propply Address</p>
                  <p><strong className="text-white">Email:</strong> <a href="mailto:propplyai@gmail.com" className="text-corporate-400 hover:text-corporate-300 underline">propplyai@gmail.com</a></p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
