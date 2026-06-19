export default function ValueMyVesselPage() {
  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <div style={{ backgroundColor: '#0c1f3f' }} className="py-20 text-center text-white">
        <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: '#c9a84c' }}>Sell Your Vessel</p>
        <h1 className="text-4xl font-bold">Value My Vessel</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-gray-500 text-lg text-center mb-12 leading-relaxed">
          Get a complimentary market valuation from our team. Fill out the form below and a Breck Yacht Group broker will be in touch within 24 hours with a detailed assessment of your vessel&apos;s current market value.
        </p>

        <div className="bg-white shadow-md p-10">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0c1f3f' }}>Tell Us About Your Vessel</h2>
          <form className="flex flex-col gap-4">
            {/* Owner Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="First Name" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              <input type="text" placeholder="Last Name" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <input type="email" placeholder="Email Address" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            <input type="tel" placeholder="Phone Number" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />

            {/* Vessel Info */}
            <p className="text-xs tracking-widest uppercase font-semibold mt-4" style={{ color: '#0c1f3f' }}>Vessel Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input type="number" placeholder="Year" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              <input type="text" placeholder="Make" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              <input type="text" placeholder="Model" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Length (ft)" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
              <input type="number" placeholder="Engine Hours" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <input type="text" placeholder="Engine Configuration (e.g. Triple Yamaha 425)" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            <input type="text" placeholder="Current Location" className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400" />
            <textarea
              placeholder="Notable features, upgrades, or condition notes..."
              rows={4}
              className="border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            <button
              type="submit"
              className="py-4 text-sm tracking-widest uppercase font-semibold text-white transition-opacity hover:opacity-90 mt-2"
              style={{ backgroundColor: '#c9a84c' }}
            >
              Request My Valuation
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
