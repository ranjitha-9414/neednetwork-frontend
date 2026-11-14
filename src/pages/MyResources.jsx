
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

import {
  getMyResources,
  updateResource,
  deleteResource,
} from '../api/resourceApi'

function MyResources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Fetch logged-in user's resources
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await getMyResources()

      setResources(
        Array.isArray(response.data) ? response.data : []
      )
    } catch (err) {
      console.error('Error fetching resources:', err)

      setError(
        err.response?.data?.message ||
        'Unable to load your resources. Please login again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // Get resource images
  function getImages(resource) {
    if (resource.imageUrls?.length > 0) {
      return resource.imageUrls
    }

    if (resource.imageUrl) {
      return [resource.imageUrl]
    }

    return []
  }

  // Format creation date
  function formatDate(date) {
    if (!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable'
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Toggle resource availability
  async function toggleAvailability(resource) {
    if (updatingId !== null || deletingId !== null) return

    try {
      setUpdatingId(resource.id)

      const updatedResource = {
        ...resource,
        available: !resource.available,
      }

      await updateResource(resource.id, updatedResource)

      // Update resource list
      setResources((previous) =>
        previous.map((item) =>
          item.id === resource.id
            ? {
                ...item,
                available: !item.available,
              }
            : item
        )
      )

      window.dispatchEvent(new Event('resourcesChanged'))

    } catch (err) {
      console.error('Error updating availability:', err)

      alert(
        err.response?.data?.message ||
        'Unable to update availability. Please try again.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete resource
  async function removeResource(id) {
    if (deletingId !== null || updatingId !== null) return

    const confirmed = window.confirm(
      'Are you sure you want to remove this resource? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      setDeletingId(id)

      await deleteResource(id)

      const updatedResources = resources.filter(
        (resource) => resource.id !== id
      )

      setResources(updatedResources)

      // Notify Navbar to check whether resources still exist
      window.dispatchEvent(new Event('resourcesChanged'))

    } catch (err) {
      console.error('Error deleting resource:', err)

      alert(
        err.response?.data?.message ||
        'Unable to remove resource. Please try again.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-700">
              Resource Management
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              My Resources
            </h1>

            <p className="mt-2 text-gray-600">
              Manage the resources you have shared with the community.
            </p>
          </div>

          <Link
            to="/offer-resource"
            className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            + Offer a Resource
          </Link>

        </div>

        {/* Resource Statistics */}
        {!loading && !error && resources.length > 0 && (

          <div className="mb-8 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Resources
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {resources.length}
              </h2>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Available Resources
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-700">
                {resources.filter((item) => item.available).length}
              </h2>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Unavailable Resources
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-700">
                {resources.filter((item) => !item.available).length}
              </h2>
            </div>

          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />

            <p className="text-gray-600">
              Loading your resources...
            </p>

          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">

            <p className="mb-4 text-red-600">
              {error}
            </p>

            <button
              onClick={fetchResources}
              className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
            >
              Try Again
            </button>

          </div>
        )}

        {/* Empty State */}
        {!loading && !error && resources.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">

            <div className="mb-4 text-5xl">
              📦
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-900">
              No resources listed yet
            </h2>

            <p className="mb-6 text-gray-600">
              Start helping your community by sharing your first resource.
            </p>

            <Link
              to="/offer-resource"
              className="inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              Offer Your First Resource
            </Link>

          </div>
        )}

        {/* Resource Cards */}
        {!loading && !error && resources.length > 0 && (

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {resources.map((resource) => {

              const images = getImages(resource)

              return (

                <article
                  key={resource.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* Resource Image */}
                  <div className="relative h-52 bg-gray-100">

                    {images.length > 0 ? (

                      <img
                        src={images[0]}
                        alt={resource.title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center">
                        <span className="text-5xl">📦</span>
                      </div>

                    )}

                    {/* Availability Badge */}
                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                        resource.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {resource.available ? 'Available' : 'Unavailable'}
                    </span>

                    {/* Photo Count */}
                    {images.length > 0 && (
                      <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1 text-xs font-medium text-white">
                        📷 {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
                      </span>
                    )}

                  </div>

                  {/* Resource Information */}
                  <div className="p-5">

                    <p className="mb-2 text-sm font-semibold text-green-700">
                      {resource.category}
                    </p>

                    <h2 className="mb-3 text-xl font-bold text-gray-900">
                      {resource.title}
                    </h2>

                    <div className="space-y-2 text-sm text-gray-600">

                      <p>
                        📍 {resource.location}
                      </p>

                      <p>
                        🏷️ Condition: {resource.condition || 'Not specified'}
                      </p>

                      <p>
                        📅 Listed: {formatDate(resource.createdAt)}
                      </p>

                    </div>

                    {/* View Details */}
                    <Link
                      to={`/resources/${resource.id}`}
                      className="mt-4 block text-center font-semibold text-green-700 hover:underline"
                    >
                      View Resource Details →
                    </Link>

                    <div className="my-4 border-t border-gray-100" />

                    {/* Availability */}
                    <button
                      onClick={() => toggleAvailability(resource)}
                      disabled={
                        updatingId !== null ||
                        deletingId !== null
                      }
                      className="mb-3 w-full rounded-lg border border-green-700 px-4 py-2.5 font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === resource.id
                        ? 'Updating...'
                        : `Mark as ${resource.available ? 'Unavailable' : 'Available'}`}
                    </button>

                    {/* Edit */}
                    <Link
                      to={`/edit-resource/${resource.id}`}
                      className="mb-3 block w-full rounded-lg bg-green-700 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-green-800"
                    >
                      Edit Resource
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => removeResource(resource.id)}
                      disabled={
                        deletingId !== null ||
                        updatingId !== null
                      }
                      className="w-full rounded-lg border border-red-300 px-4 py-2.5 font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === resource.id
                        ? 'Removing...'
                        : 'Remove Resource'}
                    </button>

                  </div>

                </article>

              )
            })}

          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-10">

          <Link
            to="/dashboard"
            className="font-semibold text-green-700 hover:underline"
          >
            ← Back to Dashboard
          </Link>

        </div>

      </div>

    </section>
  )
}

export default MyResources
