
import { Link } from 'react-router-dom'

function Hero() {
  return (
    <section className="bg-[#E8F5EF]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">

        {/* Left content */}
        <div>
          <span className="inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-[#145A46]">
            💚 Together, we make a difference
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-[#145A46] md:text-6xl">
            Find help.
            <br />
            Give hope.
            <br />
            <span className="text-amber-500">
              Build community.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
            NeedNetwork connects people who need support with those
            who have resources to share. A little help can make a
            big difference.
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/resources"
              className="rounded-xl bg-[#145A46] px-7 py-3.5 font-semibold text-white shadow hover:bg-[#104735]"
            >
              Find Help →
            </Link>

            <Link
              to="/offer-resource"
              className="rounded-xl border-2 border-[#145A46] px-7 py-3.5 font-semibold text-[#145A46] hover:bg-white"
            >
              Offer Help ❤️
            </Link>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            Free to use • Community-powered • Made with care
          </p>
        </div>

        {/* Right visual */}
        <div className="relative">
          <div className="rounded-3xl bg-white p-4 shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=900&q=80"
              alt="Community members helping each other"
              className="h-72 w-full rounded-2xl object-cover md:h-96"
            />

            <div className="p-4">
              <p className="text-xl font-bold text-[#145A46]">
                Small acts. Big impact.
              </p>

              <p className="mt-2 text-gray-600">
                Every shared resource creates a new opportunity.
              </p>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 rounded-2xl bg-amber-400 px-5 py-4 shadow-lg">
            <p className="text-2xl font-bold text-[#145A46]">
              100% ❤️
            </p>
            <p className="text-sm font-medium text-[#145A46]">
              Community spirit
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero
