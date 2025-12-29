'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/app/components/Toast';

interface GenerateDataClientProps {
  generateFakeUsers: (formData: FormData) => Promise<void>;
  generateFakeObservations: (formData: FormData) => Promise<void>;
  generateFakeProjects: (formData: FormData) => Promise<void>;
}

export default function GenerateDataClient({
  generateFakeUsers,
  generateFakeObservations,
  generateFakeProjects,
}: GenerateDataClientProps) {
  const { showToast } = useToast();
  const [isPendingUsers, startTransitionUsers] = useTransition();
  const [isPendingObservations, startTransitionObservations] = useTransition();
  const [isPendingProjects, startTransitionProjects] = useTransition();

  const handleGenerateUsers = async (formData: FormData) => {
    startTransitionUsers(async () => {
      try {
        await generateFakeUsers(formData);
        showToast('Fake users generated successfully!');
      } catch (error) {
        console.error('Error generating users:', error);
        showToast('Failed to generate fake users', 'error');
      }
    });
  };

  const handleGenerateObservations = async (formData: FormData) => {
    startTransitionObservations(async () => {
      try {
        await generateFakeObservations(formData);
        showToast('Fake observations generated successfully!');
      } catch (error) {
        console.error('Error generating observations:', error);
        showToast('Failed to generate fake observations', 'error');
      }
    });
  };

  const handleGenerateProjects = async (formData: FormData) => {
    startTransitionProjects(async () => {
      try {
        await generateFakeProjects(formData);
        showToast('Fake projects generated successfully!');
      } catch (error) {
        console.error('Error generating projects:', error);
        showToast('Failed to generate fake projects', 'error');
      }
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Generate Fake Users */}
      <div className="section-card">
        <h2 className="text-xl font-semibold mb-2">Fake Users</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate fake user accounts with random names and bios.
        </p>
        <form action={handleGenerateUsers}>
          <div className="mb-4">
            <label htmlFor="user-count" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Users
            </label>
            <input
              type="number"
              id="user-count"
              name="count"
              min="1"
              max="50"
              defaultValue="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isPendingUsers}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isPendingUsers}
          >
            {isPendingUsers ? 'Generating...' : 'Generate Users'}
          </button>
        </form>
      </div>

      {/* Generate Fake Observations */}
      <div className="section-card">
        <h2 className="text-xl font-semibold mb-2">Fake Observations</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate fake observations with images from Unsplash. Requires fake users.
        </p>
        <form action={handleGenerateObservations}>
          <div className="mb-4">
            <label htmlFor="observation-count" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Observations
            </label>
            <input
              type="number"
              id="observation-count"
              name="count"
              min="1"
              max="50"
              defaultValue="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isPendingObservations}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isPendingObservations}
          >
            {isPendingObservations ? 'Generating...' : 'Generate Observations'}
          </button>
        </form>
      </div>

      {/* Generate Fake Projects */}
      <div className="section-card">
        <h2 className="text-xl font-semibold mb-2">Fake Conservation Projects</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generate fake conservation projects with OpenAI-generated content. Requires fake users.
        </p>
        <form action={handleGenerateProjects}>
          <div className="mb-4">
            <label htmlFor="project-count" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Projects
            </label>
            <input
              type="number"
              id="project-count"
              name="count"
              min="1"
              max="20"
              defaultValue="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isPendingProjects}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isPendingProjects}
          >
            {isPendingProjects ? 'Generating...' : 'Generate Projects'}
          </button>
        </form>
      </div>
    </div>
  );
}
