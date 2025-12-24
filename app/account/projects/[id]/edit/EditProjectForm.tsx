"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ProjectMap from "@/app/account/projects/ProjectMap";
import { useToast } from "@/app/components/Toast";
import { getProjectUrl } from "@/lib/project-url";
import Image from "next/image";

interface ProjectPicture {
  id: number;
  imageUrl: string;
  caption: string | null;
}

interface Project {
  id: number;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  fundingGoal: number;
  status: string;
  pictures: ProjectPicture[];
}

export default function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: parseFloat(project.latitude),
    lng: parseFloat(project.longitude),
  });
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [fundingGoal, setFundingGoal] = useState((project.fundingGoal / 100).toString());
  const [status, setStatus] = useState(project.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<ProjectPicture[]>(project.pictures);
  const [newImages, setNewImages] = useState<Array<{ url: string; file: File }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const images = files.map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setNewImages(prev => [...prev, ...images]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => {
      const images = [...prev];
      URL.revokeObjectURL(images[index].url);
      images.splice(index, 1);
      return images;
    });
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setDeletedImageIds(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fundingGoalNumber = parseFloat(fundingGoal);
    if (isNaN(fundingGoalNumber) || fundingGoalNumber <= 0) {
      alert("Please enter a valid funding goal");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, upload new images to S3
      const uploadedImageUrls: string[] = [];
      
      if (newImages.length > 0) {
        setUploadingImages(true);
        
        for (const image of newImages) {
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

      // Then update the project
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          latitude: selectedLocation.lat.toString(),
          longitude: selectedLocation.lng.toString(),
          fundingGoal: fundingGoalNumber,
          status,
          newImageUrls: uploadedImageUrls,
          deletedImageIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      // Show success toast
      showToast("Project updated successfully!");
      
      router.push(getProjectUrl(project.id, title));
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      showToast("Failed to update project. Please try again.", "error");
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
        <label htmlFor="status" className="block text-sm font-medium mb-2">
          Project Status *
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="active">Active</option>
          <option value="funded">Funded</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Project Photos
        </label>
        
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Photos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {existingImages.map((image) => (
                <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={image.imageUrl}
                    alt={image.caption || "Project photo"}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(image.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleNewImageSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {newImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">New Photos to Add</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {newImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={image.url}
                    alt={`New preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Project Location *
        </label>
        {!webglError && (
          <p className="text-sm text-gray-600 mb-3">
            Search for a location using the search box on the map, click on the map, or drag the marker to update the location
          </p>
        )}
        <ProjectMap
          onLocationSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
          initialLocation={selectedLocation}
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
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploadingImages ? "Uploading images..." : isSubmitting ? "Saving..." : "Save Changes"}
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
