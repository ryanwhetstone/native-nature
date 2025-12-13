import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Native Nature",
  description: "Learn about Native Nature, a platform for exploring and documenting wildlife and flora around the world through citizen science and nature observation.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section - Dark Background */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-semibold text-white mb-6">
            Discover the Wonder of Nature
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Native Nature is your gateway to exploring and documenting the incredible biodiversity 
            that surrounds us. Join a community passionate about wildlife observation, species 
            discovery, and conservation efforts around the globe.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              We believe that understanding and appreciating nature is the first step toward 
              protecting it. Native Nature empowers individuals to document wildlife sightings, 
              learn about species, and contribute to conservation awareness through the simple 
              act of observation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover</h3>
              <p className="text-gray-600">
                Explore thousands of species from around the world with detailed information 
                and stunning photography.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Document</h3>
              <p className="text-gray-600">
                Record your wildlife observations with photos, locations, and dates to build 
                your personal nature journal.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Conserve</h3>
              <p className="text-gray-600">
                Raise awareness about biodiversity and inspire others to appreciate and protect 
                our natural world.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Dark Background */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-12">
            Powerful Features for Nature Enthusiasts
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🗺️</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Interactive Mapping
                  </h3>
                  <p className="text-gray-300">
                    Record precise locations of your wildlife observations with interactive maps 
                    powered by Mapbox. Visualize where you&apos;ve encountered different species and 
                    explore biodiversity by region.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">📷</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Beautiful Photo Galleries
                  </h3>
                  <p className="text-gray-300">
                    Upload and showcase your wildlife photography in stunning masonry galleries. 
                    View full-screen images with detailed information about each observation.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🌍</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Global Species Database
                  </h3>
                  <p className="text-gray-300">
                    Access comprehensive information on species from around the world, including 
                    taxonomy, conservation status, and observation counts powered by iNaturalist.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">⭐</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Personal Favorites
                  </h3>
                  <p className="text-gray-300">
                    Build your collection of favorite species and track your observations over time. 
                    Create a personalized record of your nature exploration journey.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">👥</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Community Profiles
                  </h3>
                  <p className="text-gray-300">
                    Share your observations with the community through public profiles. Discover 
                    what others are seeing and get inspired by fellow nature enthusiasts.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔎</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Smart Search & Discovery
                  </h3>
                  <p className="text-gray-300">
                    Explore species by country, region, or category. Browse recent observations 
                    from the community and discover biodiversity in your local area.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conservation Section */}
      <div className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Why Conservation Matters
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Every observation you record contributes to a greater understanding of our planet&apos;s 
              biodiversity. By documenting wildlife, you&apos;re participating in citizen science and 
              helping researchers track species populations, migration patterns, and habitat changes.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              The Power of Observation
            </h3>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌿</span>
                <p>
                  <strong>Biodiversity Awareness:</strong> Understanding what species exist in an area 
                  is the foundation for protecting them. Your observations create valuable records of 
                  species distribution.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <p>
                  <strong>Data Collection:</strong> Collective observations from communities around the 
                  world provide scientists with crucial data about population trends and ecosystem health.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💚</span>
                <p>
                  <strong>Connection to Nature:</strong> Regular observation fosters a deeper connection 
                  with the natural world, inspiring stewardship and conservation action.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌍</span>
                <p>
                  <strong>Global Impact:</strong> Small actions, like recording a bird sighting or 
                  photographing a wildflower, collectively create a powerful movement for environmental 
                  awareness and protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-semibold text-white mb-6">
            Start Your Journey Today
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join our community of nature enthusiasts and begin documenting the incredible 
            wildlife around you. Every observation matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/recent-observations"
              className="px-8 py-3 bg-slate-700 text-white text-lg font-semibold rounded-lg hover:bg-slate-600 transition-colors"
            >
              View Recent Observations
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-semibold text-green-600 mb-2">∞</div>
              <p className="text-gray-600">Species to Discover</p>
            </div>
            <div>
              <div className="text-4xl font-semibold text-green-600 mb-2">🌍</div>
              <p className="text-gray-600">Global Coverage</p>
            </div>
            <div>
              <div className="text-4xl font-semibold text-green-600 mb-2">📸</div>
              <p className="text-gray-600">Photo Galleries</p>
            </div>
            <div>
              <div className="text-4xl font-semibold text-green-600 mb-2">💚</div>
              <p className="text-gray-600">Conservation Focus</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
