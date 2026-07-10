export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Legal</p>
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-white/50 text-sm mt-4">Effective Date: June 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-600 leading-relaxed space-y-10">

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>1. Overview</h2>
          <p>Breck Yacht Group LLC ("Breck Yacht Group," "we," "us," or "our") operates the website located at www.breckyachtgroup.com (the "Site"). This Privacy Policy explains how we collect, use, and protect information you provide when using our Site, submitting contact or inquiry forms, or applying for vessel financing through our financing partners.</p>
          <p className="mt-3">By using our Site, you agree to the practices described in this policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Contact Information:</strong> Name, email address, and phone number submitted through our contact, inquiry, or vessel valuation forms.</li>
            <li><strong>Financing Application Data:</strong> Information submitted through our third-party financing partner (Intercoastal Financial Group / BoatLoan.com), including financial and personal data entered directly into their embedded application. This data is collected and processed by our financing partner and is subject to their own privacy policy.</li>
            <li><strong>Usage Data:</strong> General analytics data including pages visited, time spent on the Site, device type, and browser information collected through our analytics provider. This data is aggregated and not personally identifiable.</li>
            <li><strong>Communications:</strong> Any messages or correspondence you send to us directly.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Respond to your inquiries and contact form submissions</li>
            <li>Facilitate vessel purchase, sale, or valuation discussions</li>
            <li>Connect you with our financing and insurance partners at your request</li>
            <li>Send relevant listing updates or market information if you have opted in</li>
            <li>Improve the functionality and content of our Site</li>
          </ul>
          <p className="mt-3">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>4. Third-Party Services</h2>
          <p>Our Site integrates with the following third-party services that may process your data independently:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Intercoastal Financial Group / BoatLoan.com:</strong> Financing applications submitted through our Site are processed directly by our financing partner. Please review their privacy policy for details on how your financial information is handled.</li>
            <li><strong>Email Delivery:</strong> Contact form submissions are processed and delivered via a third-party email delivery provider. No personal data is retained by this provider beyond what is necessary for message delivery.</li>
            <li><strong>Site Analytics:</strong> We use a third-party analytics provider to collect anonymous usage data to improve Site performance. No personally identifiable information is collected through this service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>5. Buyer Accounts</h2>
          <p>If you create a buyer account on our Site, we collect and store the following additional information:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Account credentials:</strong> Email address and encrypted password.</li>
            <li><strong>Buyer profile:</strong> Full name, phone number, vessel preferences, and purchase timeline you provide at registration.</li>
            <li><strong>Saved searches:</strong> Search filters you save while browsing our inventory.</li>
          </ul>
          <p className="mt-3">This information is used solely to match you with relevant vessel listings and to enable our brokers to contact you personally when matching inventory becomes available. You may delete your account and all associated data at any time from your <a href="/account/profile" style={{ color: '#c9a84c' }} className="underline">account settings page</a>.</p>
          <p className="mt-3">Account data is stored on Supabase infrastructure hosted in the United States (AWS us-east-2, Ohio) and is protected by row-level security policies that prevent unauthorized access.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>6. Data Security</h2>
          <p>We take reasonable measures to protect your personal information from unauthorized access, disclosure, or misuse. Our Site is served over HTTPS and contact form data is transmitted securely. However, no method of electronic transmission is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>7. Your Rights</h2>
          <p>You may contact us at any time to request access to, correction of, or deletion of personal information we hold about you. Buyer account holders may delete their account and all associated data instantly from their <a href="/account/profile" style={{ color: '#c9a84c' }} className="underline">account settings page</a>. We will respond to all other reasonable requests within a timely manner.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>8. Children's Privacy</h2>
          <p>Our Site is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>9. Changes to This Policy</h2>
          <p>We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with an updated effective date. Continued use of the Site after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <div className="mt-3">
            <p><strong>Breck Yacht Group LLC</strong></p>
            <p>Palm Beach, FL</p>
            <p>Phone: <a href="tel:5612470838">(561) 247-0838</a></p>
            <p>Email: <a href="mailto:austin@breckyachtgroup.com" style={{ color: '#c9a84c' }}>austin@breckyachtgroup.com</a></p>
          </div>
        </section>

      </div>
    </div>
  )
}
