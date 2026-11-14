
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function ResourceCard({ resource }) {

  const isAvailable = resource.available;

  // Support both new multiple images and old single-image resources
  const images =
    resource.imageUrls?.length > 0
      ? resource.imageUrls
      : resource.imageUrl
        ? [resource.imageUrl]
        : resource.image
          ? [resource.image]
          : [];

  const [currentImage, setCurrentImage] = useState(0);

  // Reset image when the resource changes
  useEffect(() => {
    setCurrentImage(0);
  }, [resource.id]);

  function showNextImage(event) {
    event.preventDefault();
    event.stopPropagation();

    setCurrentImage((previous) =>
      (previous + 1) % images.length
    );
  }

  function showPreviousImage(event) {
    event.preventDefault();
    event.stopPropagation();

    setCurrentImage((previous) =>
      (previous - 1 + images.length) % images.length
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition duration-300">

      {/* Resource Image Gallery */}
      <div className="h-52 bg-gray-100 relative flex items-center justify-center overflow-hidden">

        {images.length > 0 ? (
          <>
            <img
              key={images[currentImage]}
              src={images[currentImage]}
              alt={`${resource.title} - Image ${currentImage + 1}`}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            {/* Previous Button */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full"
                >
                  &#10094;
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={showNextImage}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full"
                >
                  &#10095;
                </button>

                {/* Image Counter */}
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                  {currentImage + 1} / {images.length}
                </span>

                {/* Image Indicators */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setCurrentImage(index);
                      }}
                      aria-label={`Show image ${index + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        currentImage === index
                          ? "w-5 bg-white"
                          : "w-2 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400">
            <span className="text-4xl">📦</span>
            <p className="text-sm mt-2">Photo not provided</p>
          </div>
        )}

      </div>

      {/* Resource Details */}
      <div className="p-5">

        {/* Category and Availability */}
        <div className="flex items-center justify-between gap-2 mb-3">

          <span className="text-sm text-blue-600 font-medium">
            {resource.category}
          </span>

          {isAvailable ? (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              Available
            </span>
          ) : (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
              Unavailable
            </span>
          )}

        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {resource.description || "No description available."}
        </p>

        {/* Location */}
        <p className="text-sm text-gray-500 mb-2">
          📍 {resource.location || "Location not specified"}
        </p>

        {/* Condition */}
        <p className="text-sm text-gray-500 mb-4">
          Condition: {resource.condition || "Not specified"}
        </p>

        {/* Image Count */}
        {images.length > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            📷 {images.length} {images.length === 1 ? "photo" : "photos"}
          </p>
        )}

        {/* View Details Button */}
        <Link
          to={`/resources/${resource.id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200"
        >
          View Details
        </Link>

      </div>

    </div>
  );
}

export default ResourceCard;
