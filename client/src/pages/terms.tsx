import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="January 1, 2025">
      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using Treasure Coast AI's services, website, or any associated applications (collectively, the "Services"), 
          you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not use our Services.
        </p>
      </Section>

      <Section title="2. Description of Services">
        <p>
          Treasure Coast AI provides AI-powered chatbot solutions for businesses, including but not limited to: lead capture, 
          appointment booking assistance, customer service automation, and analytics dashboards. Our Services are designed to 
          help local businesses engage with their customers 24/7.
        </p>
      </Section>

      <Section title="3. User Accounts">
        <p>
          To access certain features of our Services, you must create an account. You are responsible for maintaining the 
          confidentiality of your account credentials and for all activities that occur under your account. You must provide 
          accurate and complete information when creating your account and keep this information up to date.
        </p>
      </Section>

      <Section title="4. Subscription and Billing">
        <p>
          Our Services are provided on a subscription basis. By subscribing, you agree to pay the applicable fees as described 
          on our pricing page. Subscriptions automatically renew unless cancelled before the renewal date. You may cancel your 
          subscription at any time through your account dashboard.
        </p>
      </Section>

      <Section title="5. Acceptable Use">
        <p>
          You agree to use our Services only for lawful purposes and in accordance with these Terms. You shall not use our 
          Services to transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise 
          objectionable. See our <Link href="/acceptable-use" className="text-cyan-400 hover:underline">Acceptable Use Policy</Link> for 
          detailed guidelines.
        </p>
      </Section>

      <Section title="6. Intellectual Property">
        <p>
          The Services and all content, features, and functionality are owned by Treasure Coast AI and are protected by 
          copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create 
          derivative works based on our Services without explicit written permission.
        </p>
      </Section>

      <Section title="7. Data and Privacy">
        <p>
          Your use of our Services is also governed by our <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>, 
          which explains how we collect, use, and protect your data. You retain ownership of all content you provide to our 
          Services, and you grant us a license to use this content solely to provide the Services.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Treasure Coast AI shall not be liable for any indirect, incidental, special, 
          consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use 
          of or inability to use the Services.
        </p>
      </Section>

      <Section title="9. Indemnification">
        <p>
          You agree to indemnify and hold harmless Treasure Coast AI and its officers, directors, employees, and agents from 
          any claims, damages, or expenses arising from your use of the Services or your violation of these Terms.
        </p>
      </Section>

      <Section title="10. Modifications">
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or 
          through the Services. Your continued use of the Services after such modifications constitutes acceptance of the 
          updated Terms.
        </p>
      </Section>

      <Section title="11. Termination">
        <p>
          We may terminate or suspend your access to the Services at any time, with or without cause, and with or without 
          notice. Upon termination, your right to use the Services will immediately cease.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          For questions about these Terms, please contact us at legal@treasurecoastai.com or through our website contact form.
        </p>
      </Section>
    </LegalPageLayout>
  );
}

function LegalPageLayout({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0E13] text-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <Link href="/landing-preview" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{title}</h1>
        <p className="text-white/50 text-sm mb-10">Last updated: {lastUpdated}</p>
        
        <div className="space-y-8">
          {children}
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
            <Link href="/landing-preview" className="hover:text-white transition-colors">Home</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
          <p className="text-white/40 text-xs mt-4">© {new Date().getFullYear()} Treasure Coast AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-semibold text-white/90">{title}</h2>
      <div className="text-white/70 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
