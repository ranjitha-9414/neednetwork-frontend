
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  getResourceById,
  updateResource,
  uploadImage,
} from '../api/resourceApi'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGES = 5

const initialForm = {
  title: '',
  category: '',
  description: '',
  condition: '',
  location: '',
}

function EditResource() {
  const { id } = useParams()
  const navigate = useNavigate()

  const fileInputRef = useRef(null)
  const previewUrlsRef = useRef([])

  const [form, setForm] = useState(initialForm)
  const [originalResource, setOriginalResource] = useState(null)

  const [existingImages, setExistingImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Clean up temporary image preview URLs
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [])

  // Load existing resource details
  useEffect(() => {
    let cancelled = false

    async function fetchResource() {
      try {
        setLoading(true)
        setError('')

        const response = await getResourceById(id)

        if (cancelled) return

        const resource = response.data

        setOriginalResource(resource)

        setForm({
          title: resource.title || '',
          category: resource.category || '',
          description: resource.description || '',
          condition: resource.condition || '',
          location: resource.location || '',
        })

        const images =
          resource.imageUrls?.length > 0
            ? resource.imageUrls
            : resource.imageUrl
              ? [resource.imageUrl]
              : []

        setExistingImages(images)

      } catch (err) {
        if (cancelled) return

        console.error('Error loading resource:', err)

        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Unable to load resource details.'
        )

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

  // Handle form changes
  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Select new images
  function handleImageChange(event) {
    const files = Array.from(event.target.files || [])

    setError('')

    if (!files.length) return

    if (
      existingImages.length +
      selectedImages.length +
      files.length > MAX_IMAGES
    ) {
      setError(`You can keep a maximum of ${MAX_IMAGES} images.`)
      event.target.value = ''
      return
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG and WEBP images are allowed.')
        event.target.value = ''
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('Each image must be 5 MB or smaller.')
        event.target.value = ''
        return
      }
    }

    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setSelectedImages((previous) => [
      ...previous,
      ...files,
    ])

    setImagePreviews((previous) => {
      const updated = [...previous, ...newPreviews]

      previewUrlsRef.current = updated.map(
        (item) => item.preview
      )

      return updated
    })

    // Allow selecting the same file again
    event.target.value = ''
  }

  // Remove an existing image
  function removeExistingImage(index) {
    setExistingImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    )
  }

  // Remove a newly selected image
  function removeNewImage(index) {
    const removed = imagePreviews[index]

    if (removed) {
      URL.revokeObjectURL(removed.preview)
    }

    setSelectedImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    )

    setImagePreviews((previous) => {
      const updated = previous.filter(
        (_, imageIndex) => imageIndex !== index
      )

      previewUrlsRef.current = updated.map(
        (item) => item.preview
      )

      return updated
    })
  }

  // Save resource changes
  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    setError('')

    if (!form.title.trim()) {
      setError('Please enter a resource name.')
      return
    }

    if (form.description.trim().length < 10) {
      setError('Description must contain at least 10 characters.')
      return
    }

    if (existingImages.length + selectedImages.length === 0) {
      setError('Please keep at least one resource photograph.')
      return
    }

    if (existingImages.length + selectedImages.length > MAX_IMAGES) {
      setError(`You can keep a maximum of ${MAX_IMAGES} images.`)
      return
    }

    setSaving(true)

    try {
      // Step 1: Upload newly selected images
      const uploadResponses = await Promise.all(
        selectedImages.map((file) => uploadImage(file))
      )

      const newImageUrls = uploadResponses.map(
        (response) => response.data.imageUrl
      )

      // Step 2: Combine existing and new images
      const imageUrls = [
        ...existingImages,
        ...newImageUrls,
      ]

      // Step 3: Prepare updated resource data
      const resourceData = {
        ...originalResource,

        ...form,

        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),

        imageUrls,
        imageUrl: imageUrls[0],
      }

      // Step 4: Update resource in backend
      await updateResource(id, resourceData)

      // Step 5: Notify the application about the update
      window.dispatchEvent(new Event('resourcesChanged'))

      alert('Resource updated successfully!')

      navigate('/my-resources')

    } catch (err) {
      console.error('Resource update error:', err)

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to update resource. Please try again.'
      )

    } finally {
      setSaving(false)
    }
  }

  // Loading screen
  if (loading) {
    return (
      <section className="min-h-screen bg-green-50 px-4 py-16">
        <p className="text-center text-gray-600">
          Loading resource details...
        </p>
      </section>
    )
  }

  // Error screen
  if (!originalResource) {
    return (
      <section className="min-h-screen bg-green-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-8 text-center shadow">

          <p className="mb-5 text-red-600">
            {error || 'Resource not found.'}
          </p>

          <Link
            to="/my-resources"
            className="font-semibold text-green-700 hover:underline"
          >
            Back to My Resources
          </Link>

        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-green-50 px-4 py-12">

      <div className="mx-auto max-w-2xl">

        {/* Page Header */}
        <div className="mb-8 text-center">

          <p className="mb-2 font-semibold text-green-700">
            MANAGE YOUR LISTING
          </p>

          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Edit Resource
          </h1>

          <p className="text-gray-600">
            Update your resource details and photographs.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-md sm:p-8"
        >

          {/* Resource Name */}
          <div>
            <label
              className="mb-1 block font-medium"
              htmlFor="title"
            >
              Resource name
            </label>

            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="mb-1 block font-medium"
              htmlFor="category"
            >
              Category
            </label>

            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select a category</option>
              <option>Mobility Aids</option>
              <option>Education</option>
              <option>Furniture</option>
              <option>Household</option>
              <option>Medical Supplies</option>
              <option>Electronics</option>
              <option>Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              className="mb-1 block font-medium"
              htmlFor="description"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              minLength={10}
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* Condition */}
          <div>
            <label
              className="mb-1 block font-medium"
              htmlFor="condition"
            >
              Condition
            </label>

            <select
              id="condition"
              name="condition"
              value={form.condition}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select condition</option>
              <option>New</option>
              <option>Like new</option>
              <option>Good condition</option>
              <option>Used - acceptable</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label
              className="mb-1 block font-medium"
              htmlFor="location"
            >
              Location
            </label>

            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* Existing Images */}
          <div>

            <h2 className="mb-2 font-semibold text-gray-900">
              Existing photographs
            </h2>

            {existingImages.length === 0 ? (

              <p className="text-sm text-gray-500">
                No existing photographs.
              </p>

            ) : (

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

                {existingImages.map((image, index) => (

                  <div
                    key={`${image}-${index}`}
                    className="rounded-xl border border-green-200 bg-green-50 p-2"
                  >

                    <img
                      src={image}
                      alt={`Existing resource ${index + 1}`}
                      className="h-32 w-full rounded-lg bg-white object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="mt-2 w-full rounded-lg bg-red-50 px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* Add New Images */}
          <div>

            <label
              className="mb-2 block font-medium"
              htmlFor="images"
            >
              Add new photographs
            </label>

            <input
              ref={fileInputRef}
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            />

            <p className="mt-1 text-sm text-gray-500">
              JPG, PNG or WEBP. Maximum 5 MB per image.
            </p>

            <p className="mt-2 text-sm font-medium text-green-700">
              {existingImages.length + selectedImages.length} / {MAX_IMAGES} images
            </p>

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">

                {imagePreviews.map((item, index) => (

                  <div
                    key={`${item.file.name}-${index}`}
                    className="rounded-xl border border-green-200 bg-green-50 p-2"
                  >

                    <img
                      src={item.preview}
                      alt={`New resource ${index + 1}`}
                      className="h-32 w-full rounded-lg bg-white object-contain"
                    />

                    <p className="mt-2 truncate text-xs text-gray-600">
                      {item.file.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="mt-2 w-full rounded-lg bg-red-50 px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-red-700"
            >
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>

            <Link
              to="/my-resources"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

          </div>

        </form>

      </div>

    </section>
  )
}

export default EditResource
