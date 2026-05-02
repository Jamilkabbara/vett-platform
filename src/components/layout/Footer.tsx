import { Zap, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onAboutClick?: () => void;
  onContactClick?: () => void;
  onTermsClick?: () => void;
  onCareersClick?: () => void;
  onBlogClick?: () => void;
  onApiClick?: () => void;
  onHelpClick?: () => void;
  onPrivacyClick?: () => void;
  onWhiteLabelClick?: () => void;
}

export const Footer = ({ onAboutClick, onContactClick, onTermsClick, onCareersClick, onBlogClick, onApiClick, onHelpClick, onPrivacyClick, onWhiteLabelClick }: FooterProps) => {
  return (
    <footer className="relative z-20 w-full bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 items-start">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center -rotate-3 shadow-lg shadow-primary/20">
                <Zap className="text-white w-6 h-6" fill="currentColor" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white">VETT</h1>
            </div>
            <p className="text-white/50 text-sm font-medium leading-relaxed">
              The operating system for market intelligence.
            </p>
          </div>

          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6">
              Company
            </h3>
            <ul className="space-y-4">
              <li>
                {onAboutClick ? (
                  <button
                    onClick={onAboutClick}
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium text-left"
                  >
                    About Us
                  </button>
                ) : (
                  <Link
                    to="/about"
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium"
                  >
                    About Us
                  </Link>
                )}
              </li>
              <li>
                {onCareersClick ? (
                  <button
                    onClick={onCareersClick}
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium text-left"
                  >
                    Careers
                  </button>
                ) : (
                  <Link
                    to="/careers"
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium"
                  >
                    Careers
                  </Link>
                )}
              </li>
              <li>
                {onContactClick ? (
                  <button
                    onClick={onContactClick}
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium text-left"
                  >
                    Contact
                  </button>
                ) : (
                  <Link
                    to="/contact"
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium"
                  >
                    Contact
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6">
              Resources
            </h3>
            <ul className="space-y-4">
              <li>
                {onBlogClick ? (
                  <button
                    onClick={onBlogClick}
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium text-left"
                  >
                    Blog
                  </button>
                ) : (
                  <Link
                    to="/blog"
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium"
                  >
                    Blog
                  </Link>
                )}
              </li>
              <li>
                {onApiClick ? (
                  <button
                    onClick={onApiClick}
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium text-left"
                  >
                    API
                  </button>
                ) : (
                  <Link
                    to="/api"
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium"
                  >
                    API
                  </Link>
                )}
              </li>
              <li>
                {onHelpClick ? (
                  <button
                    onClick={onHelpClick}
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium text-left"
                  >
                    Help Center
                  </button>
                ) : (
                  <Link
                    to="/help"
                    className="text-white/50 hover:text-white transition-colors text-sm font-medium"
                  >
                    Help Center
                  </Link>
                )}
              </li>
              <li>
                <button
                  onClick={onWhiteLabelClick}
                  className="text-white/50 hover:text-white transition-colors text-sm font-medium text-left"
                >
                  White Label
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6">
              Connect
            </h3>
            <p className="text-white/50 text-sm font-medium mb-4">
              Dubai, UAE
            </p>
            <p className="text-white/50 text-sm font-medium mb-6">
              hello@vettit.ai
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-white/50 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-white/50 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-white/50 hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs font-medium">
            © 2026 VETT Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {onPrivacyClick ? (
              <button
                onClick={onPrivacyClick}
                className="text-white/40 hover:text-white transition-colors text-xs font-medium"
              >
                Privacy Policy
              </button>
            ) : (
              <Link
                to="/privacy"
                className="text-white/40 hover:text-white transition-colors text-xs font-medium"
              >
                Privacy Policy
              </Link>
            )}
            {onTermsClick ? (
              <button
                onClick={onTermsClick}
                className="text-white/40 hover:text-white transition-colors text-xs font-medium"
              >
                Terms of Service
              </button>
            ) : (
              <Link
                to="/terms"
                className="text-white/40 hover:text-white transition-colors text-xs font-medium"
              >
                Terms of Service
              </Link>
            )}
            {/* Pass 24 Bug 24.03 — Refund Policy link */}
            <Link
              to="/refunds"
              className="text-white/40 hover:text-white transition-colors text-xs font-medium"
            >
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
