import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { authHelpers } from '@/lib/supabase';
import { Mail, Send, User, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

export default function Contact() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user: currentUser } = await authHelpers.getUser();
    setUser(currentUser);
    // Pre-fill email if user is logged in
    if (currentUser?.email) {
      setFormData(prev => ({ ...prev, email: currentUser.email }));
    }
  };

  const handleLogout = async () => {
    await authHelpers.signOut();
    router.push('/');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        setStatus({ type: 'error', message: 'Please fill in all fields.' });
        setIsSubmitting(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setStatus({ type: 'error', message: 'Please enter a valid email address.' });
        setIsSubmitting(false);
        return;
      }

      // Send form data to n8n webhook
      const webhookUrl = 'https://klevaideas.app.n8n.cloud/webhook/contact-form';
      const payload = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
      };

      console.log('Sending to webhook:', webhookUrl);
      console.log('Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('Webhook response:', responseData);

      setStatus({
        type: 'success',
        message: 'Thank you for contacting us! We\'ll get back to you shortly at ' + formData.email
      });

      // Reset form
      setFormData({
        name: user?.email ? formData.name : '',
        email: user?.email || '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({
        type: 'error',
        message: 'An error occurred while submitting your message. Please try again or email us directly at propplyai@gmail.com'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-corporate-500/10 rounded-full mb-6">
            <Mail className="w-8 h-8 text-corporate-400" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Contact Us</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Have a question or need assistance? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Contact Info Card */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-corporate-400" />
                Get in Touch
              </h3>
              <div className="space-y-4 text-slate-300">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Email</p>
                  <a
                    href="mailto:propplyai@gmail.com"
                    className="text-corporate-400 hover:text-corporate-300 transition-colors"
                  >
                    propplyai@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Response Time</p>
                  <p className="text-slate-300">We typically respond within 24-48 hours</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Support Hours</p>
                  <p className="text-slate-300">Monday - Friday, 9:00 AM - 5:00 PM EST</p>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-emerald-400" />
                Quick Links
              </h3>
              <div className="space-y-3">
                <a
                  href="/privacy"
                  className="block text-slate-300 hover:text-corporate-400 transition-colors"
                >
                  → Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="block text-slate-300 hover:text-corporate-400 transition-colors"
                >
                  → Terms of Service
                </a>
                <a
                  href="/pricing"
                  className="block text-slate-300 hover:text-corporate-400 transition-colors"
                >
                  → Pricing Plans
                </a>
                {user && (
                  <a
                    href="/dashboard"
                    className="block text-slate-300 hover:text-corporate-400 transition-colors"
                  >
                    → Back to Dashboard
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>

            {/* Status Message */}
            {status.message && (
              <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                status.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-ruby-500/10 border-ruby-500/30 text-ruby-400'
              }`}>
                {status.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p>{status.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:border-transparent transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:border-transparent transition-all"
                  placeholder="How can we help you?"
                />
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:border-transparent transition-all resize-vertical"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>

            {/* Alternative Contact */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center">
                Prefer to email directly? Reach us at{' '}
                <a
                  href="mailto:propplyai@gmail.com"
                  className="text-corporate-400 hover:text-corporate-300 underline"
                >
                  propplyai@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
