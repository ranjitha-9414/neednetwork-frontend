import { Link } from 'react-router-dom'
import resources from '../data/resources'
import ResourceCard from './ResourceCard'

function FeaturedResources() {
  const featured = resources.slice(0, 3)

  return (
    <section className="bg-[#F8FBF9] px-6 py-20">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-semibold text-amber-500">
              COMMUNITY SHARING
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#145A46]">
              Featured Resources
            </h2>

            <p className="mt-3 text-gray-600">
              Discover resources generously shared by others.
            </p>
          </div>

          <Link
            to="/resources"
            className="font-semibold text-[#145A46] hover:underline"
          >
            View All Resources →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
            />
          ))}
        </div>

      </div>
    </section>
  )
}

export default FeaturedResources