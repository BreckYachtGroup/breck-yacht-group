export const metadata = {
  title: 'Auction Terms & Conditions | Breck Yacht Group',
  description: 'Terms and conditions governing all auctions conducted on the Breck Yacht Group auction platform.',
}

export default function AuctionTermsPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">

      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Legal</p>
        <h1 className="text-4xl font-bold">Auction Terms &amp; Conditions</h1>
        <p className="text-white/40 text-sm mt-3">Last updated: July 8, 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Binding Bids</h2>
          <p>All bids placed on the Breck Yacht Group auction platform are legally binding offers to purchase. By placing a bid you agree to complete the transaction at your bid price if you are the winning bidder and the reserve price (if any) has been met. Bids may not be retracted once submitted.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Eligibility</h2>
          <p>You must be at least 18 years of age and legally capable of entering into a binding contract to participate in any auction. By registering and bidding you represent that you meet these requirements.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Reserve Price</h2>
          <p>Some auctions are listed with a confidential reserve price — the minimum amount the seller will accept. If the auction ends without meeting the reserve, no sale is concluded and neither party is obligated. Reserve status (met / not met) is displayed on the auction listing.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Anti-Snipe Extension</h2>
          <p>To ensure fair competition, any bid placed within the final 3 minutes of an auction automatically resets the auction timer to 3 minutes from the time of that bid. This may occur multiple times up to a maximum of 10 extensions per auction.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Buyer&apos;s Premium</h2>
          <p>Breck Yacht Group currently charges no buyer&apos;s premium. The winning bid price is the total purchase price, exclusive of any applicable taxes, registration fees, delivery, or other costs associated with the transfer of ownership. This may be subject to change and will be disclosed on individual auction listings.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Vessel Condition &amp; Inspection</h2>
          <p>All vessels are sold in &quot;as-is, where-is&quot; condition. Breck Yacht Group makes no warranties, express or implied, regarding the condition, seaworthiness, or fitness for any particular purpose of any vessel. Prospective buyers are strongly encouraged to conduct an independent marine survey prior to bidding. Listing descriptions are provided in good faith based on seller representations.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Post-Auction Process</h2>
          <p>The winning bidder will be contacted by Breck Yacht Group within 24 hours of auction close to coordinate the transaction. The buyer and seller agree to act in good faith to complete the sale in a timely manner. Failure by the winning bidder to complete the transaction may result in account suspension and the auction being relisted.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Seller Representations</h2>
          <p>Sellers warrant that they have clear and marketable title to any vessel listed, that all material information disclosed in the listing is accurate to the best of their knowledge, and that they are legally authorized to sell the vessel.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <p>Breck Yacht Group acts solely as a marketplace facilitating the connection between buyers and sellers. We are not a party to any transaction and accept no liability for disputes between buyers and sellers, vessel condition, or failure of either party to complete a transaction.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">10. Modifications</h2>
          <p>Breck Yacht Group reserves the right to modify these terms at any time. Continued participation in auctions after any modification constitutes acceptance of the updated terms. Material changes will be announced on the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">11. Platform Outage &amp; Service Interruption Policy</h2>
          <p>Breck Yacht Group is committed to maintaining platform availability during all active auctions. In the event of a verified service interruption — defined as the platform being inaccessible or non-functional for 2 or more consecutive minutes during an active auction — the following policy applies:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>The affected auction&apos;s end time will be extended by no less than the verified duration of the outage, plus a minimum 10-minute buffer to allow all bidders adequate time to return and bid.</li>
            <li>Extensions due to service interruptions are applied at Breck Yacht Group&apos;s sole discretion and are separate from the standard anti-snipe extensions described in Section 4.</li>
            <li>Breck Yacht Group will communicate outage extensions via the auction listing page, by email to all registered bidders and watchers of the affected auction, and via our social media channels.</li>
            <li>A service interruption caused by factors outside Breck Yacht Group&apos;s reasonable control — including but not limited to third-party infrastructure failures, internet outages, or acts of God — will be handled with the same extension policy on a best-efforts basis.</li>
            <li>No bid placed prior to a verified outage will be invalidated due to the interruption. All bids recorded before the outage remain valid and binding.</li>
          </ul>
          <p className="mt-3">Breck Yacht Group&apos;s platform uptime status can be verified at any time at <a href="/api/health" className="underline text-gray-900">breckyachtgroup.com/api/health</a>. In the event of a suspected outage, bidders are encouraged to contact us directly at <a href="mailto:austin@breckyachtgroup.com" className="underline text-gray-900">austin@breckyachtgroup.com</a> or <a href="tel:5612470838">(561) 247-0838</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">12. Contact</h2>
          <p>Questions regarding these terms may be directed to <a href="mailto:austin@breckyachtgroup.com" className="underline text-gray-900">austin@breckyachtgroup.com</a> or by calling <a href="tel:5612470838">(561) 247-0838</a>.</p>
        </section>

        <div className="pt-6 border-t border-gray-200">
          <a href="/auctions" className="text-sm underline text-gray-500 hover:text-gray-800">← Back to Auctions</a>
        </div>

      </div>
    </div>
  )
}
