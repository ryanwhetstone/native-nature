"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EditLocationMap from "./EditLocationMap";
import { useToast } from "@/app/components/Toast";

interface Picture {
  id: number;
  imageUrl: string;
  caption: string | null;
}

interface EditObservationFormProps {
  observation: {
    id: number;
    latitude: string;
    longitude: string;
    observedAt: Date;
    species: {
      id: number;
      taxonId: number;
      name: string;
      preferredCommonName: string | null;
    };
    pictures: Picture[];
  };
}

export default function EditObservationForm({ observation }: EditObservationFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: parseFloat(observation.latitude),
    lng: parseFloat(observation.longitude),
  });
  const [observedAt, setObservedAt] = useState(
    new Date(observation.observedAt).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<Picture[]>(observation.pictures);
  const [newImages, setNewImages] = useState<Array<{ url: string; file: File }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImages((prev) => [...prev, { url: reader.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      showToast("Please select a location on the map", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images first
      let uploadedImageUrls: string[] = [];
      if (newImages.length > 0) {
        setUploadingImages(true);
        const uploadPromises = newImages.map(async ({ file }) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to upload image");
          }

          const data = await response.json();
          return data.imageUrl;
        });

        uploadedImageUrls = await Promise.all(uploadPromises);
        setUploadingImages(false);
      }

      // Update observation
      const response = await fetch(`/api/observations/${observation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: selectedLocation.lat.toString(),
          longitude: selectedLocation.lng.toString(),
          observedAt: observedAt + 'T12:00:00.000Z',
          newImageUrls: uploadedImageUrls,
          deletedImageIds: deletedImageIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update observation");
      }

      showToast("Observation updated successfully!");
      router.push(`/observation/${observation.id}`);
    } catch (error) {
      showToast("Failed to update observation. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium mb-2">Species</label>
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="font-semibold">
            {observation.species.preferredCommonName || observation.species.name}
          </p>
          {observation.species.preferredCommonName && (
            <p className="text-sm text-gray-500 italic">{observation.species.name}</p>
          )}
        </div>
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
        <label className="block text-sm font-medium mb-2">Location on Map *</label>
        <EditLocationMap
          longitude={selectedLocation.lng}
          latitude={selectedLocation.lat}
          onLocationChange={setSelectedLocation}
        />
        {selectedLocation && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Photos</label>
        
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current photos:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {existingImages.map((image) => (
                <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={image.imageUrl}
                    alt="Observation photo"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(image.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        {newImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">New photos to add:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {newImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image src={image.url} alt="Preview" fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Images */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || uploadingImages}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {uploadingImages
            ? "Uploading images..."
            : isSubmitting
            ? "Saving..."
            : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/observation/${observation.id}`)}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
