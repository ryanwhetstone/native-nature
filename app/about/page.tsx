import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Native Nature | Features & Mission",
  description: "Learn about Native Nature's mission to document and protect biodiversity through wildlife observations and conservation projects.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-700 to-green-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mb-6 text-white">About Native Nature</h1>
          <p className="text-xl text-green-100 leading-relaxed">
            A global platform connecting nature enthusiasts and conservationists to document biodiversity 
            and support meaningful conservation efforts worldwide.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center text-gray-900 mb-8">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Native Nature is dedicated to preserving our planet&apos;s biodiversity by empowering individuals 
            to document wildlife observations and support conservation initiatives. We believe that by making 
            nature observation accessible and funding conservation projects transparent, we can create a global 
            community committed to protecting our natural world.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover</h3>
              <p className="text-muted">
                Explore species, locations, and biodiversity data from around the world.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Document</h3>
              <p className="text-muted">
                Record your wildlife observations with photos, locations, and dates.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Support</h3>
              <p className="text-muted">
                Fund conservation projects that protect habitats and native species.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-12">
            Platform Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Wildlife Observations */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">📍</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Wildlife Observations
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Create detailed records of wildlife sightings with:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Photo uploads for visual documentation</li>
                    <li>• GPS location tracking with interactive maps</li>
                    <li>• Date and time recording</li>
                    <li>• Species identification and linking</li>
                    <li>• Personal observation journals</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Species Database */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🦋</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Species Database
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Explore comprehensive species information including:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Scientific and common names</li>
                    <li>• Conservation status (IUCN classifications)</li>
                    <li>• Species photos and descriptions</li>
                    <li>• Geographic distribution</li>
                    <li>• Favorite species tracking</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Interactive Mapping */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🗺️</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Interactive Mapping
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Visualize biodiversity with powerful mapping tools:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Global species distribution maps</li>
                    <li>• Country and region exploration</li>
                    <li>• Personal observation heat maps</li>
                    <li>• Project location tracking</li>
                    <li>• Interactive pin-based navigation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Conservation Projects */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🌱</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Conservation Projects
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Create and support conservation initiatives with:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Project creation and management</li>
                    <li>• Funding goals and progress tracking</li>
                    <li>• Photo and update documentation</li>
                    <li>• Secure Stripe payment processing</li>
                    <li>• Community Q&A features</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">📷</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Photo Galleries
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Showcase and discover wildlife photography:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Masonry-style photo layouts</li>
                    <li>• Image approval system for quality control</li>
                    <li>• Multi-photo observation support</li>
                    <li>• Species and location metadata</li>
                    <li>• Community photo feeds</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Search & Discovery */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔎</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Smart Search & Discovery
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Find what you&apos;re looking for quickly:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Multi-category search (species, places, observations, projects)</li>
                    <li>• Country and region browsing</li>
                    <li>• Recent observations feed</li>
                    <li>• Species lists by location</li>
                    <li>• Advanced filtering options</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* User Profiles */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">👤</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    User Profiles & Dashboard
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Manage your nature documentation:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Personal dashboard with statistics</li>
                    <li>• Observation management and editing</li>
                    <li>• Project tracking and updates</li>
                    <li>• Favorites collections</li>
                    <li>• Donation history</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Community Features */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🤝</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Community Features
                  </h3>
                  <p className="text-gray-300 mb-3">
                    Connect with fellow nature enthusiasts:
                  </p>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Project Q&A and responses</li>
                    <li>• Public user profiles</li>
                    <li>• Shared observation galleries</li>
                    <li>• Conservation project updates</li>
                    <li>• Supporter recognition</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How Conservation Projects Work */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-center">
            Conservation Projects
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center">
            Native Nature empowers individuals and organizations to create and fund conservation 
            projects that make a real difference. From habitat restoration to wildlife protection, 
            our platform connects passionate conservationists with donors who want to support 
            meaningful environmental initiatives.
          </p>

          <div className="bg-green-50 rounded-lg shadow-lg p-8 mt-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              How Projects Work
            </h3>
            <div className="space-y-6 text-gray-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Create a Project</h4>
                  <p>
                    Set up your conservation project with a clear title, description, funding goal, 
                    and location. Add photos to show what you&apos;re working to protect.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Share Your Story</h4>
                  <p>
                    Post regular updates about your progress, answer questions from the community, 
                    and build trust with potential donors through transparency.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Receive Funding</h4>
                  <p>
                    Accept secure donations through Stripe. Track your funding progress in real-time 
                    and thank your supporters as your project grows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Make an Impact</h4>
                  <p>
                    Execute your conservation plan and share the results with your community. 
                    Completed projects inspire others and demonstrate the power of collective action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Join the Native Nature Community</h2>
          <p className="text-xl text-green-100 mb-8">
            Start documenting wildlife, exploring biodiversity, and supporting conservation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-3 bg-white text-green-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Get Started
            </Link>
            <Link
              href="/conservation-projects"
              className="inline-block px-8 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-semibold border-2 border-white"
            >
              View Projects
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
