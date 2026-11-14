
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { addResource, uploadImage } from '../api/resourceApi'

const initialForm = {
  title: '',
  category: '',
  description: '',
  condition: '',
  location: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGES = 5

function OfferResource() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedResource, setSavedResource] = useState(null)

  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  const fileInputRef = useRef(null)
  const previewUrlsRef = useRef([])

  // Clean up image preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [])

  // Handle form input changes
  function handleChange(event) {
    const { name, value } = event.target

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  // Handle multiple image selection
  function handleImageChange(event) {
    const files = Array.from(event.target.files || [])

    setError('')

    if (files.length === 0) return

    if (selectedImages.length + files.length > MAX_IMAGES) {
      setError(`You can select a maximum of ${MAX_IMAGES} images.`)
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

    const updatedPreviews = [...imagePreviews, ...newPreviews]

    setSelectedImages((previous) => [
      ...previous,
      ...files,
    ])

    setImagePreviews(updatedPreviews)

    previewUrlsRef.current = updatedPreviews.map(
      (item) => item.preview
    )

    // Allow selecting the same file again later
    event.target.value = ''
  }

  // Remove selected image
  function removeImage(index) {
    const removedPreview = imagePreviews[index]

    if (removedPreview) {
      URL.revokeObjectURL(removedPreview.preview)
    }

    const updatedImages = selectedImages.filter(
      (_, imageIndex) => imageIndex !== index
    )

    const updatedPreviews = imagePreviews.filter(
      (_, imageIndex) => imageIndex !== index
    )

    setSelectedImages(updatedImages)
    setImagePreviews(updatedPreviews)

    previewUrlsRef.current = updatedPreviews.map(
      (item) => item.preview
    )
  }

  // Submit resource
  async function handleSubmit(event) {
    event.preventDefault()

    if (selectedImages.length === 0) {
      setError('Please upload at least one photograph of your resource.')
      return
    }

    if (!/^[0-9]{10}$/.test(form.ownerPhone.trim())) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Upload all selected images
      const uploadResponses = await Promise.all(
        selectedImages.map((file) => uploadImage(file))
      )

      const imageUrls = uploadResponses.map(
        (response) => response.data.imageUrl
      )

      // Step 2: Prepare resource data
      const resourceData = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        condition: form.condition,
        location: form.location.trim(),

        // Multiple images
        imageUrls,

        // First image for backward compatibility
        imageUrl: imageUrls[0],

        available: true,

        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim(),
        ownerPhone: form.ownerPhone.trim(),
      }

      // Step 3: Save resource in MySQL
      const response = await addResource(resourceData)

      setSavedResource(response.data)
      setSubmitted(true)

      // Step 4: Notify Navbar that the resource list has changed
      window.dispatchEvent(new Event('authChange'))

    } catch (err) {
      console.error('Resource submission error:', err)

      if (err.response) {
        setError(
          err.response.data?.error ||
          err.response.data?.message ||
          `Request failed with status ${err.response.status}.`
        )
      } else {
        setError(
          'Unable to connect to the server. Please check your backend.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset form to offer another resource
  function handleReset() {
    setForm(initialForm)
    setSubmitted(false)
    setSavedResource(null)
    setSelectedImages([])

    imagePreviews.forEach((item) => {
      URL.revokeObjectURL(item.preview)
    })

    setImagePreviews([])
    previewUrlsRef.current = []

    setError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Success screen
  if (submitted) {
    const savedImages =
      savedResource?.imageUrls?.length > 0
        ? savedResource.imageUrls
        : savedResource?.imageUrl
          ? [savedResource.imageUrl]
          : []

    return (
      <section className="min-h-[70vh] bg-green-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow">

          <div className="mb-4 text-5xl">🎉</div>

          <h1 className="mb-3 text-2xl font-bold text-green-800">
            Resource listing created!
          </h1>

          <p className="mb-6 text-gray-600">
            Thank you for helping your community!
            Your resource has been saved successfully.
          </p>

          {savedImages.length > 0 && (
            <div className="mb-5 grid grid-cols-2 gap-3">
              {savedImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${savedResource.title} - ${index + 1}`}
                  className="h-40 w-full rounded-xl bg-gray-50 object-contain"
                />
              ))}
            </div>
          )}

          <div className="mb-6 rounded-lg bg-green-50 p-4 text-left">

            <h2 className="mb-2 font-semibold text-gray-900">
              {savedResource?.title}
            </h2>

            <p className="text-sm text-gray-600">
              {savedResource?.category}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              {savedResource?.description}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              📍 {savedResource?.location}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              Shared by: {savedResource?.ownerName}
            </p>

            <p className="mt-2 text-sm font-semibold text-green-800">
              Resource ID: {savedResource?.id}
            </p>

            <p className="mt-2 text-sm text-green-700">
              Availability: Available
            </p>

            <p className="mt-2 text-sm text-green-700">
              Photos uploaded: {savedImages.length}
            </p>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">

            <button
              onClick={handleReset}
              className="rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
            >
              List another resource
            </button>

            <Link
              to="/owner-dashboard"
              className="rounded-lg border border-green-800 px-5 py-3 font-semibold text-green-800 hover:bg-green-50"
            >
              View Owner Dashboard
            </Link>

          </div>

          <div className="mt-4">
            <Link
              to="/resources"
              className="text-green-700 underline"
            >
              Browse resources
            </Link>
          </div>

        </div>
      </section>
    )
  }

  // Offer Resource form
  return (
    <section className="min-h-screen bg-green-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8 text-center">

          <p className="mb-2 font-semibold text-green-700">
            SHARE WHAT YOU CAN
          </p>

          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Offer a Resource
          </h1>

          <p className="text-gray-600">
            Your unused items could make a meaningful difference
            in someone's life.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-md sm:p-8"
        >

          {/* Resource name */}
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
              placeholder="Example: Manual wheelchair"
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
              placeholder="Describe the resource and how it can be used..."
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
              placeholder="Example: Mysuru, Karnataka"
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* Owner information */}
          <div className="border-t pt-5">

            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Owner Information
            </h2>

            <p className="mb-4 text-sm text-gray-500">
              Provide your details so the community can identify the resource owner.
            </p>

            <div className="space-y-4">

              <div>
                <label
                  className="mb-1 block font-medium"
                  htmlFor="ownerName"
                >
                  Your name
                </label>

                <input
                  id="ownerName"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3"
                />
              </div>

              <div>
                <label
                  className="mb-1 block font-medium"
                  htmlFor="ownerEmail"
                >
                  Email address
                </label>

                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  value={form.ownerEmail}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3"
                />
              </div>

              <div>
                <label
                  className="mb-1 block font-medium"
                  htmlFor="ownerPhone"
                >
                  Mobile number
                </label>

                <input
                  id="ownerPhone"
                  name="ownerPhone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.ownerPhone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3"
                />
              </div>

              <p className="text-xs text-gray-500">
                Your email and phone number should not be displayed publicly.
              </p>

            </div>
          </div>

          {/* Multiple image upload */}
          <div>

            <label
              className="mb-2 block font-medium"
              htmlFor="images"
            >
              Upload Resource Photographs
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
              Select up to 5 photographs. JPG, PNG or WEBP.
              Maximum 5 MB per image.
            </p>

            <p className="mt-2 text-sm font-medium text-green-700">
              {selectedImages.length} / {MAX_IMAGES} images selected
            </p>

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">

                {imagePreviews.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="relative rounded-xl border border-green-200 bg-green-50 p-2"
                  >

                    <img
                      src={item.preview}
                      alt={`Selected resource ${index + 1}`}
                      className="h-32 w-full rounded-lg bg-white object-contain"
                    />

                    <p className="mt-2 truncate text-xs text-gray-600">
                      {item.file.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="mt-2 w-full rounded-lg bg-red-50 px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* Error message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-red-700"
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Uploading and Saving...' : 'Submit Resource'}
          </button>

        </form>
      </div>
    </section>
  )
}

export default OfferResource
