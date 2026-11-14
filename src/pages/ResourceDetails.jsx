
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getResourceById } from '../api/resourceApi'

function ResourceDetails() {
  const { id } = useParams()

  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImage, setCurrentImage] = useState(0)
  const [failedImages, setFailedImages] = useState(new Set())

  // Fetch selected resource
  useEffect(() => {
    let cancelled = false

    async function fetchResource() {
      setResource(null)
      setError('')
      setCurrentImage(0)
      setFailedImages(new Set())
      setLoading(true)

      if (!id || !/^\d+$/.test(id)) {
        setError('Invalid resource ID.')
        setLoading(false)
        return
      }

      try {
        const response = await getResourceById(id)
        const fetchedResource = response.data

        // Verify requested resource ID
        if (
          !fetchedResource ||
          Number(fetchedResource.id) !== Number(id)
        ) {
          throw new Error('Resource ID mismatch.')
        }

        if (!cancelled) {
          setResource(fetchedResource)
        }
      } catch (err) {
        console.error('Error fetching resource:', err)

        if (!cancelled) {
          setError('Resource not found or could not be loaded.')
          setResource(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchResource()

    return () => {
      cancelled = true
    }
  }, [id])

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FBF9]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-100 border-t-[#145A46]" />

          <p className="mt-4 font-semibold text-[#145A46]">
            Loading resource details...
          </p>
        </div>
      </div>
    )
  }

  // Error screen
  if (error || !resource) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FBF9] px-6 py-20 text-center">

        <div className="text-5xl">📦</div>

        <h1 className="mt-5 text-3xl font-bold text-[#145A46]">
          Resource not found
        </h1>

        <p className="mt-4 text-gray-600">
          {error || 'The selected resource could not be loaded.'}
        </p>

        <Link
          to="/resources"
          className="mt-6 rounded-lg bg-[#145A46] px-6 py-3 font-semibold text-white hover:bg-[#104735]"
        >
          Browse Resources
        </Link>

      </div>
    )
  }

  // Support multiple images and older single-image resources
  const images =
    resource.imageUrls?.length > 0
      ? resource.imageUrls
      : resource.imageUrl
        ? [resource.imageUrl]
        : resource.image
          ? [resource.image]
          : []

  // Image error handling
  function handleImageError(index) {
    setFailedImages(previous => {
      const updated = new Set(previous)
      updated.add(index)
      return updated
    })
  }

  // Image navigation
  function showNextImage() {
    setCurrentImage(previous =>
      (previous + 1) % images.length
    )
  }

  function showPreviousImage() {
    setCurrentImage(previous =>
      (previous - 1 + images.length) % images.length
    )
  }

  // Format date safely
  const formattedDate = resource.createdAt &&
    !Number.isNaN(new Date(resource.createdAt).getTime())
      ? new Date(resource.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null

  return (
    <div className="min-h-screen bg-[#F8FBF9] px-4 py-8 sm:px-6 sm:py-12">

      <div className="mx-auto max-w-6xl">

        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500">

          <Link to="/" className="hover:text-green-800">
            Home
          </Link>

          <span>/</span>

          <Link to="/resources" className="hover:text-green-800">
            Resources
          </Link>

          <span>/</span>

          <span className="font-medium text-[#145A46]">
            {resource.title}
          </span>

        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">

          {/* Image Gallery */}
          <div>

            <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-100 shadow-sm sm:h-96">

              {images.length > 0 && !failedImages.has(currentImage) ? (
                <img
                  key={`${id}-${images[currentImage]}`}
                  src={images[currentImage]}
                  alt={`${resource.title} - Image ${currentImage + 1}`}
                  className="h-full w-full object-contain"
                  onError={() => handleImageError(currentImage)}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-5xl">📷</div>

                  <p className="mt-3">
                    {images.length > 0
                      ? 'Unable to load this image'
                      : 'Resource photo not provided'}
                  </p>
                </div>
              )}

              {/* Previous and Next */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    &#10094;
                  </button>

                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    &#10095;
                  </button>

                  <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                    {currentImage + 1} / {images.length}
                  </span>
                </>
              )}

            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">

                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setCurrentImage(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={currentImage === index}
                    className={`relative overflow-hidden rounded-xl border-2 ${
                      currentImage === index
                        ? 'border-[#145A46]'
                        : 'border-transparent'
                    }`}
                  >

                    {failedImages.has(index) ? (
                      <div className="flex h-16 items-center justify-center bg-gray-100 text-xs text-gray-500 sm:h-20">
                        No image
                      </div>
                    ) : (
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        onError={() => handleImageError(index)}
                        className="h-16 w-full bg-gray-100 object-cover sm:h-20"
                      />
                    )}

                  </button>
                ))}

              </div>
            )}

            <p className="mt-3 text-sm text-gray-500">
              📷 {images.length} {images.length === 1 ? 'photo' : 'photos'} available
            </p>

          </div>

          {/* Resource Information */}
          <div>

            {/* Category */}
            <span className="inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
              {resource.category || 'Other'}
            </span>

            {/* Title */}
            <h1 className="mt-5 break-words text-3xl font-bold text-[#145A46] sm:text-4xl">
              {resource.title}
            </h1>

            {/* Description */}
            <p className="mt-4 whitespace-pre-line leading-7 text-gray-600">
              {resource.description || 'No description provided.'}
            </p>

            {/* Resource Details Card */}
            <div className="mt-8 space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">

              <h2 className="border-b border-gray-100 pb-4 text-lg font-bold text-[#145A46]">
                Resource Information
              </h2>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Resource ID</span>

                <span className="font-semibold text-gray-800">
                  #{resource.id}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Location</span>

                <span className="text-right font-medium text-gray-800">
                  {resource.location || 'Not specified'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Condition</span>

                <span className="text-right font-medium text-gray-800">
                  {resource.condition || 'Not specified'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Shared by</span>

                <span className="text-right font-medium text-[#145A46]">
                  {resource.ownerName || 'Owner information unavailable'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Availability</span>

                <span
                  className={`font-semibold ${
                    resource.available
                      ? 'text-green-700'
                      : 'text-red-600'
                  }`}
                >
                  {resource.available ? '✓ Available' : '✕ Unavailable'}
                </span>
              </div>

              {formattedDate && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Date shared</span>

                  <span className="text-right font-medium text-gray-800">
                    {formattedDate}
                  </span>
                </div>
              )}

            </div>

            {/* Request Button */}
            {resource.available ? (
              <Link
                to={`/request-assistance?resourceId=${encodeURIComponent(resource.id)}`}
                className="mt-8 block rounded-xl bg-[#145A46] px-6 py-4 text-center font-semibold text-white transition hover:bg-[#104735]"
              >
                Request to Borrow →
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-8 w-full cursor-not-allowed rounded-xl bg-gray-300 px-6 py-4 font-semibold text-gray-600"
              >
                Currently Unavailable
              </button>
            )}

            <p className="mt-4 text-center text-sm text-gray-500">
              Connect with the resource owner to coordinate sharing.
            </p>

          </div>

        </div>

        {/* Back Button */}
        <Link
          to="/resources"
          className="mt-12 inline-block font-semibold text-[#145A46] hover:underline"
        >
          ← Back to Resources
        </Link>

      </div>
    </div>
  )
}

export default ResourceDetails
