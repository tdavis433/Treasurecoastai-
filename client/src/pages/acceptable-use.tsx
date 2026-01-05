import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AcceptableUse() {
  return (
    <LegalPageLayout title="Acceptable Use Policy" lastUpdated="January 1, 2025">
      <Section title="1. Overview">
        <p>
          This Acceptable Use Policy outlines the rules and guidelines for using Treasure Coast AI's services. By using our 
          Services, you agree to comply with this policy. Violation of this policy may result in suspension or termination 
          of your account.
        </p>
      </Section>

      <Section title="2. Prohibited Content">
        <p>You may not use our Services to create, distribute, or facilitate:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Illegal content or content that promotes illegal activities</li>
          <li>Content that infringes on intellectual property rights</li>
          <li>Hate speech, harassment, or discriminatory content</li>
          <li>Sexually explicit or pornographic material</li>
          <li>Content promoting violence, terrorism, or self-harm</li>
          <li>Malware, viruses, or other harmful software</li>
          <li>Spam, phishing, or deceptive content</li>
          <li>Content that violates others' privacy rights</li>
        </ul>
      </Section>

      <Section title="3. Prohibited Activities">
        <p>You may not:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
          <li>Interfere with or disrupt the Services or servers</li>
          <li>Use automated systems to access the Services in a manner that exceeds reasonable use</li>
          <li>Reverse engineer, decompile, or attempt to extract source code</li>
          <li>Use the Services to collect information about users without their consent</li>
          <li>Impersonate any person or entity, or falsely state your affiliation</li>
          <li>Use the Services for any purpose that could harm minors</li>
          <li>Resell or redistribute the Services without authorization</li>
        </ul>
      </Section>

      <Section title="4. AI Chatbot Specific Guidelines">
        <p>When configuring and using AI chatbots through our Services, you must:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Ensure your chatbot provides accurate information about your business</li>
          <li>Not program your chatbot to deceive users about its AI nature when directly asked</li>
          <li>Not use the chatbot to collect sensitive personal information beyond what is necessary</li>
          <li>Comply with all applicable laws regarding automated communications</li>
          <li>Not use the chatbot for unsolicited marketing or spam</li>
          <li>Promptly address any errors or issues reported by users</li>
        </ul>
      </Section>

      <Section title="5. Data Collection Guidelines">
        <p>When collecting data through our chatbot services, you must:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Only collect information that is relevant and necessary for your stated purposes</li>
          <li>Provide clear disclosure to users about what data is being collected</li>
          <li>Handle all collected data in accordance with applicable privacy laws</li>
          <li>Not collect sensitive information (health, financial, etc.) without appropriate safeguards</li>
          <li>Respect users' requests to delete their information</li>
        </ul>
      </Section>

      <Section title="6. Industry-Specific Requirements">
        <p>
          If you operate in regulated industries (healthcare, finance, legal, etc.), you are responsible for ensuring your 
          use of our Services complies with all applicable industry regulations, including but not limited to HIPAA, 
          PCI-DSS, and professional conduct rules.
        </p>
      </Section>

      <Section title="7. Enforcement">
        <p>
          We reserve the right to investigate violations of this policy. Actions we may take include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Warning and request for compliance</li>
          <li>Temporary suspension of Services</li>
          <li>Permanent termination of your account</li>
          <li>Legal action where appropriate</li>
        </ul>
      </Section>

      <Section title="8. Reporting Violations">
        <p>
          If you believe someone is violating this policy, please report it to abuse@treasurecoastai.com. Include as much 
          detail as possible to help us investigate.
        </p>
      </Section>

      <Section title="9. Updates to This Policy">
        <p>
          We may update this Acceptable Use Policy from time to time. Continued use of our Services after any changes 
          constitutes acceptance of the updated policy.
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
