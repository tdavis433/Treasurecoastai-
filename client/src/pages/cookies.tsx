import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Cookies() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="January 1, 2025">
      <Section title="1. What Are Cookies">
        <p>
          Cookies are small text files that are stored on your device when you visit a website. They help the website 
          remember your preferences and improve your browsing experience. We use cookies and similar technologies 
          (such as web beacons and local storage) on our Services.
        </p>
      </Section>

      <Section title="2. Types of Cookies We Use">
        <h3 className="font-semibold text-white/80 mt-4 mb-2">Essential Cookies</h3>
        <p>
          These cookies are necessary for the Services to function properly. They enable core functionality such as 
          security, authentication, and accessibility. You cannot opt out of these cookies.
        </p>
        
        <h3 className="font-semibold text-white/80 mt-4 mb-2">Performance Cookies</h3>
        <p>
          These cookies help us understand how visitors interact with our Services by collecting and reporting 
          information anonymously. This helps us improve our Services.
        </p>
        
        <h3 className="font-semibold text-white/80 mt-4 mb-2">Functionality Cookies</h3>
        <p>
          These cookies enable the Services to remember choices you make (such as your preferred language or theme) 
          and provide enhanced, personalized features.
        </p>
        
        <h3 className="font-semibold text-white/80 mt-4 mb-2">Analytics Cookies</h3>
        <p>
          We use analytics cookies to understand how our Services are being used, which helps us identify areas for 
          improvement and optimize user experience.
        </p>
      </Section>

      <Section title="3. Third-Party Cookies">
        <p>
          Some cookies on our Services are placed by third parties, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Analytics providers</strong> (to help us understand usage patterns)</li>
          <li><strong>Payment processors</strong> (to facilitate secure transactions)</li>
          <li><strong>Customer support tools</strong> (to provide better assistance)</li>
        </ul>
        <p className="mt-2">
          These third parties have their own privacy policies governing the use of such cookies.
        </p>
      </Section>

      <Section title="4. How Long Do Cookies Last">
        <p>
          <strong>Session cookies</strong> are temporary and are deleted when you close your browser. 
          <strong> Persistent cookies</strong> remain on your device for a set period or until you delete them manually.
        </p>
      </Section>

      <Section title="5. Managing Cookies">
        <p>
          Most web browsers allow you to control cookies through their settings. You can:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>View what cookies are stored on your device</li>
          <li>Delete all or specific cookies</li>
          <li>Block cookies from specific sites or all sites</li>
          <li>Set your browser to notify you when a cookie is set</li>
        </ul>
        <p className="mt-2">
          Please note that blocking or deleting cookies may impact your ability to use certain features of our Services.
        </p>
      </Section>

      <Section title="6. Browser-Specific Instructions">
        <p>To manage cookies in your browser:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
          <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
        </ul>
      </Section>

      <Section title="7. Do Not Track">
        <p>
          Some browsers have a "Do Not Track" feature that signals to websites that you do not want your browsing 
          activity tracked. Our Services currently do not respond to Do Not Track signals.
        </p>
      </Section>

      <Section title="8. Updates to This Policy">
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, 
          operational, or regulatory reasons. The updated policy will be posted on this page with a revised 
          "Last updated" date.
        </p>
      </Section>

      <Section title="9. Contact Us">
        <p>
          If you have questions about our use of cookies, please contact us at privacy@treasurecoastai.com.
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
