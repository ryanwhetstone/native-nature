import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Native Nature",
  description: "The page you're looking for could not be found.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        <div className="text-8xl mb-6">🌿</div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          We couldn&apos;t find the page you&apos;re looking for.
        </p>

        {/* Reasons section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Why might this happen?
          </h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>The URL may have been typed incorrectly</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>The page may have been moved or deleted</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>The link you followed may be outdated</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>
                Place names with special characters (like Île-de-France) may have 
                different URL formats - try navigating from the map or search instead
              </span>
            </li>
          </ul>
        </div>

        {/* Navigation options */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Go to Home
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
          
          <div className="pt-4">
            <p className="text-sm text-gray-500 mb-2">
              Or explore by category:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                🌍 Browse by Map
              </Link>
              <Link
                href="/recent-observations"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                📸 Recent Observations
              </Link>
            </div>
          </div>
        </div>

        {/* Contact suggestion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you believe this page should exist, please let us know.
          </p>
        </div>
      </div>
    </main>
  );
}
