"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NewObservationMap from "./NewObservationMap";

interface NewObservationFormProps {
  speciesId: number;
  speciesName?: string;
  speciesSlug?: string;
}

export default function NewObservationForm({
  speciesId,
  speciesName,
  speciesSlug,
}: NewObservationFormProps) {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [observedAt, setObservedAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<Array<{ url: string; file: File }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    // Set default observed date to today
    const today = new Date().toISOString().split("T")[0];
    setObservedAt(today);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      alert("Please select a location on the map");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, upload images to S3
      const uploadedImageUrls: string[] = [];
      
      if (images.length > 0) {
        setUploadingImages(true);
        
        for (const image of images) {
          const formData = new FormData();
          formData.append('file', image.file);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }
          
          const { imageUrl } = await uploadResponse.json();
          uploadedImageUrls.push(imageUrl);
        }
        
        setUploadingImages(false);
      }

      // Then create the observation with image URLs
      const response = await fetch("/api/observations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          speciesId,
          latitude: selectedLocation.lat.toString(),
          longitude: selectedLocation.lng.toString(),
          observedAt: observedAt + 'T12:00:00.000Z',
          imageUrls: uploadedImageUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create observation");
      }

      // Show success message
      alert("Observation saved successfully!");
      
      router.push(`/species/${speciesSlug || speciesId}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating observation:", error);
      alert("Failed to create observation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {speciesName || `Species #${speciesId}`}
        </h2>
      </div>

      <div>
        <label htmlFor="observedAt" className="block text-sm font-medium mb-2">
          Date Observed *
        </label>
        <input
          type="date"
          id="observedAt"
          value={observedAt}
          onChange={(e) => setObservedAt(e.target.value)}
          required
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Photos (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Location on Map *
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Click on the map to select where you observed this species
        </p>
        <NewObservationMap
          onLocationSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
        />
        {selectedLocation && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedLocation.lat.toFixed(6)},{" "}
            {selectedLocation.lng.toFixed(6)}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !selectedLocation}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploadingImages ? "Uploading images..." : isSubmitting ? "Saving..." : "Save Observation"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
