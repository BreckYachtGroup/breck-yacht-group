export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Legal</p>
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="text-white/50 text-sm mt-4">Effective Date: June 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-600 leading-relaxed space-y-10">

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using the website located at www.breckyachtgroup.com (the "Site"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Site. These terms apply to all visitors, buyers, sellers, and any other users of the Site.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>2. Brokerage Services</h2>
          <p>Breck Yacht Group LLC is a licensed yacht brokerage operating in the State of Florida. We act as intermediaries between buyers and sellers of vessels. Nothing on this Site constitutes a binding contract for the purchase or sale of any vessel. All transactions are subject to separate written purchase agreements executed by the relevant parties.</p>
          <p className="mt-3">Vessel listings displayed on this Site are provided for informational purposes only. Prices, availability, and specifications are subject to change without notice. Breck Yacht Group makes reasonable efforts to ensure listing accuracy but does not warrant that all information is complete or error-free.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>3. No Guarantee of Financing</h2>
          <p>Financing options displayed or linked from this Site are provided by independent third-party lenders, including Intercoastal Financial Group. Submission of a financing application does not guarantee approval. Breck Yacht Group is not a lender and is not responsible for any financing decisions made by third-party lenders.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>4. Intellectual Property</h2>
          <p>All content on this Site — including but not limited to text, photographs, vessel listings, logos, and design — is the property of Breck Yacht Group LLC or its content suppliers and is protected by applicable copyright and trademark law. You may not reproduce, distribute, or use any content from this Site without prior written permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>5. Limitation of Liability</h2>
          <p>Breck Yacht Group LLC shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this Site or reliance on any information provided herein. This includes but is not limited to damages related to vessel valuations, market conditions, financing decisions, or third-party services.</p>
          <p className="mt-3">All vessel information, pricing, and market commentary provided on this Site is for informational purposes only and does not constitute professional financial or legal advice.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>6. Third-Party Links</h2>
          <p>This Site may contain links to third-party websites including financing partners, insurance providers, and industry resources. These links are provided for convenience only. Breck Yacht Group has no control over the content of those sites and accepts no responsibility for them or for any loss or damage that may arise from your use of them.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>7. Governing Law</h2>
          <p>These Terms of Service shall be governed by and construed in accordance with the laws of the State of Florida. Any disputes arising out of or related to these terms or your use of this Site shall be subject to the exclusive jurisdiction of the courts located in Palm Beach County, Florida.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>8. Changes to These Terms</h2>
          <p>We reserve the right to modify these Terms of Service at any time. Updates will be posted on this page with a revised effective date. Continued use of the Site after any changes constitutes your acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#0c1f3f' }}>9. Contact Us</h2>
          <p>If you have questions about these Terms of Service, please contact us:</p>
          <div className="mt-3">
            <p><strong>Breck Yacht Group LLC</strong></p>
            <p>Palm Beach, FL</p>
            <p>Phone: <a href="tel:5612470838"</a></p>
            <p>Email: <a href="mailto:austin@breckyachtgroup.com" style={{ color: '#c9a84c' }}>austin@breckyachtgroup.com</a></p>
          </div>
        </section>

      </div>
    </div>
  )
}
