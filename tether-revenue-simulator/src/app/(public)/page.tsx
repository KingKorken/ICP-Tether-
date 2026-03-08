import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <SocialProof />
      <FeatureHighlights />

      {/* Footer */}
      <footer className="bg-brand-dark py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white font-semibold text-lg">Tether</p>
            <p className="text-brand-muted text-sm">
              Unlocking revenue from every charge point.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-brand-muted">
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <span>&copy; {new Date().getFullYear()} Tether EV</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
