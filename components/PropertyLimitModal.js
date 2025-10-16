import { useState } from 'react';
import { X, Building2, Sparkles, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function PropertyLimitModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-corporate-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            Property Limit Reached
          </h2>
          
          <p className="text-slate-400 mb-6">
            Free tier allows 1 property and 1 report. Upgrade to add unlimited properties and get AI-powered insights.
          </p>

          {/* Features List */}
          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-slate-300">Unlimited Properties</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-slate-300">AI Property Analysis</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-slate-300">Multiple Compliance Reports</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link 
              href="/pricing" 
              className="w-full btn-primary inline-flex items-center justify-center"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              View Pricing Plans
            </Link>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

