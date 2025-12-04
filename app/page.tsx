'use client';

import Link from "next/link";
import { WorldMap } from "./WorldMap";
import { getAllCountries } from "@/lib/countries";

export default function Home() {
  const countries = getAllCountries().slice(0, 15); // Show first 15 countries
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-600 to-green-700 text-white py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Native Nature</h1>
          <p className="text-xl text-green-100">
            Discover and explore native species from around the world
          </p>
        </div>
      </div>

      {/* World Map Section */}
      <div className="py-16 px-8">
        <WorldMap />
      </div>

      {/* Countries Section */}
      <div className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Available Countries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country) => (
            <Link
              key={country.slug}
              href={`/country/${country.slug}`}
              className="group block p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-lg transition-all"
            >
              <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-green-600 mb-2">
                {country.name}
              </h3>
              <p className="text-gray-600">Explore native species in {country.name}</p>
              <div className="mt-4 text-green-600 group-hover:text-green-700 font-medium">
                Explore →
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 p-8 bg-gray-100 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">More Countries Coming Soon</h3>
          <p className="text-gray-600">
            We're working on adding more countries and regions. Check back soon!
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Maps</h3>
              <p className="text-gray-600">
                Explore species by clicking on countries and regions on interactive maps
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Favorites</h3>
              <p className="text-gray-600">
                Create your personal collection of favorite species
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Detailed Information</h3>
              <p className="text-gray-600">
                Learn about each species with photos, descriptions, and conservation status
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
