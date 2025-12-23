"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ProjectMap from "@/app/account/projects/ProjectMap";
import { useToast } from "@/app/components/Toast";
import { getProjectUrl } from "@/lib/project-url";

export default function NewProjectForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<Array<{ url: string; file: File }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [webglError, setWebglError] = useState(false);

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

    const fundingGoalNumber = parseFloat(fundingGoal);
    if (isNaN(fundingGoalNumber) || fundingGoalNumber <= 0) {
      alert("Please enter a valid funding goal");
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
          
          const uploadResponse = await fetch('/api/upload?folder=projects', {
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

      // Then create the project with image URLs
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          latitude: selectedLocation.lat.toString(),
          longitude: selectedLocation.lng.toString(),
          fundingGoal: fundingGoalNumber,
          imageUrls: uploadedImageUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();

      // Show success toast
      showToast("Project created successfully!");
      
      router.push(getProjectUrl(project.id, title));
      router.refresh();
    } catch (error) {
      console.error("Error creating project:", error);
      showToast("Failed to create project. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Project Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Coral Reef Restoration in the Caribbean"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Project Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          placeholder="Describe your conservation project, its goals, and expected impact..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label htmlFor="fundingGoal" className="block text-sm font-medium mb-2">
          Funding Goal (USD) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            id="fundingGoal"
            value={fundingGoal}
            onChange={(e) => setFundingGoal(e.target.value)}
            required
            min="1"
            step="0.01"
            placeholder="10000"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Enter the total amount of funding needed for this project
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Project Photos (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
          Project Location *
        </label>
        {!webglError && (
          <p className="text-sm text-gray-600 mb-3">
            Search for a location using the search box on the map, or click directly on the map to select the location of your conservation project
          </p>
        )}
        <ProjectMap
          onLocationSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
          onWebGLError={setWebglError}
        />
        {selectedLocation && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedLocation.lat.toFixed(6)},{" "}
            {selectedLocation.lng.toFixed(6)}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !selectedLocation}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploadingImages ? "Uploading images..." : isSubmitting ? "Creating..." : "Create Project"}
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
