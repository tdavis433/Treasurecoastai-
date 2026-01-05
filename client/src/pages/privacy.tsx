import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="January 1, 2025">
      <Section title="1. Introduction">
        <p>
          Treasure Coast AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how 
          we collect, use, disclose, and safeguard your information when you use our AI chatbot services, website, and 
          associated applications.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <h3 className="font-semibold text-white/80 mt-4 mb-2">Information You Provide</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Account registration details (name, email, business information)</li>
          <li>Payment and billing information</li>
          <li>Content you upload to configure your AI chatbot</li>
          <li>Communications with our support team</li>
        </ul>
        
        <h3 className="font-semibold text-white/80 mt-4 mb-2">Information Collected Automatically</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Device and browser information</li>
          <li>IP addresses and location data</li>
          <li>Usage patterns and interaction data</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h3 className="font-semibold text-white/80 mt-4 mb-2">Chatbot Conversation Data</h3>
        <p>
          We collect and process conversations between your customers and your AI chatbot to provide our Services, 
          improve chatbot responses, and generate analytics for your dashboard.
        </p>
      </Section>

      <Section title="3. How We Use Your Information">
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide, maintain, and improve our Services</li>
          <li>To process transactions and send related information</li>
          <li>To train and improve AI models (in aggregate, anonymized form only)</li>
          <li>To send you technical notices, updates, and support messages</li>
          <li>To respond to your comments, questions, and customer service requests</li>
          <li>To monitor and analyze usage trends and preferences</li>
        </ul>
      </Section>

      <Section title="4. Data Sharing and Disclosure">
        <p>We do not sell your personal information. We may share your information with:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Service Providers:</strong> Third parties who perform services on our behalf (hosting, payment processing, analytics)</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
        </ul>
      </Section>

      <Section title="5. Data Security">
        <p>
          We implement appropriate technical and organizational measures to protect your data, including encryption in transit 
          and at rest, access controls, and regular security assessments. However, no method of transmission over the Internet 
          is 100% secure.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain your information for as long as your account is active or as needed to provide Services. You may request 
          deletion of your account and associated data at any time. We may retain certain information as required by law or 
          for legitimate business purposes.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Access, correct, or delete your personal information</li>
          <li>Object to or restrict certain processing activities</li>
          <li>Request portability of your data</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>
        <p className="mt-2">
          To exercise these rights, contact us at privacy@treasurecoastai.com.
        </p>
      </Section>

      <Section title="8. International Data Transfers">
        <p>
          Your information may be transferred to and processed in countries other than your country of residence. We ensure 
          appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>
          Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information 
          from children under 13. If we learn we have collected such information, we will promptly delete it.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the 
          new Privacy Policy on this page and updating the "Last updated" date.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          If you have questions about this Privacy Policy, please contact us at privacy@treasurecoastai.com.
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
