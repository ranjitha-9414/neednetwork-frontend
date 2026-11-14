import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <h2 className="text-2xl font-bold text-green-400">
            NeedNetwork 💚
          </h2>

          <p className="mt-4 max-w-sm leading-7 text-gray-400">
            Connecting people, sharing resources, and building
            stronger communities through kindness.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Quick Links</h3>

          <div className="mt-4 flex flex-col gap-3 text-gray-400">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/resources" className="hover:text-white">
              Find Resources
            </Link>
            <Link to="/offer-resource" className="hover:text-white">
              Offer Resources
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Our Mission</h3>

          <p className="mt-4 leading-7 text-gray-400">
            We believe everyone deserves access to essential
            resources and that communities grow stronger when
            people help each other.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
        © 2026 NeedNetwork. Built with care for the community.
      </div>
    </footer>
  )
}

export default Footer