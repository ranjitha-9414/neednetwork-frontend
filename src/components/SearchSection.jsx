
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const categories = [
  { name: 'Mobility Aids', icon: '♿', description: 'Wheelchairs, crutches, walkers' },
  { name: 'Education', icon: '📚', description: 'Books, stationery, learning tools' },
  { name: 'Furniture', icon: '🪑', description: 'Tables, chairs, beds' },
  { name: 'Household', icon: '🏠', description: 'Daily household essentials' },
  { name: 'Medical Supplies', icon: '🩺', description: 'Medical and health essentials' },
  { name: 'Electronics', icon: '💻', description: 'Computers and devices' },
]

function SearchSection() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  function handleSearch(event) {
    event.preventDefault()

    navigate(`/resources?search=${encodeURIComponent(search)}`)
  }

  function handleCategory(category) {
    navigate(`/resources?category=${encodeURIComponent(category)}`)
  }

  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-7xl">

        {/* Search */}
        <div className="-mt-24 relative z-10 rounded-2xl bg-white p-5 shadow-xl md:p-8">
          <h2 className="mb-5 text-xl font-bold text-[#145A46]">
            What are you looking for?
          </h2>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search wheelchairs, books, furniture..."
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-5 py-4 outline-none focus:border-[#145A46] focus:ring-2 focus:ring-green-100"
              aria-label="Search resources"
            />

            <button
              type="submit"
              className="rounded-xl bg-[#145A46] px-8 py-4 font-semibold text-white hover:bg-[#104735]"
            >
              Search Resources
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <p className="font-semibold text-amber-500">
              EXPLORE RESOURCES
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#145A46]">
              Find what you need
            </h2>

            <p className="mt-3 text-gray-600">
              Browse resources shared by your community.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategory(category.name)}
                className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8F5EF] text-3xl">
                  {category.icon}
                </div>

                <h3 className="mt-4 text-lg font-bold text-[#145A46]">
                  {category.name}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {category.description}
                </p>

                <span className="mt-4 inline-block font-medium text-[#145A46]">
                  Explore →
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

export default SearchSection
