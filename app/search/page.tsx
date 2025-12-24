"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type TabType = "species" | "places" | "observations" | "projects";

interface Species {
  id: number | string;
  name: string;
  preferredCommonName: string | null;
  slug: string;
  defaultPhotoUrl: string | null;
  source?: string;
  taxonId?: number;
}

interface Place {
  id: string;
  name: string;
  country: string;
  type: string;
  url: string;
}

interface Observation {
  id: number;
  species: {
    name: string;
    preferredCommonName: string | null;
  };
  imageUrl: string | null;
  observedAt: string;
  location: string | null;
}

interface ConservationProject {
  id: number;
  title: string;
  description: string | null;
  status: string;
  goalAmount: number;
  currentAmount: number;
  country: string | null;
  createdAt: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const [activeTab, setActiveTab] = useState<TabType>("species");
  const [speciesResults, setSpeciesResults] = useState<Species[]>([]);
  const [placesResults, setPlacesResults] = useState<Place[]>([]);
  const [observationsResults, setObservationsResults] = useState<Observation[]>([]);
  const [projectsResults, setProjectsResults] = useState<ConservationProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchInput(query);
    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSpeciesResults(data.species || []);
        setPlacesResults(data.places || []);
        setObservationsResults(data.observations || []);
        setProjectsResults(data.projects || []);
        
        // Auto-select tab based on results
        if ((data.species || []).length === 0 && (data.places || []).length > 0) {
          setActiveTab("places");
        } else if ((data.species || []).length === 0 && (data.places || []).length === 0 && (data.observations || []).length > 0) {
          setActiveTab("observations");
        } else if ((data.species || []).length === 0 && (data.places || []).length === 0 && (data.observations || []).length === 0 && (data.projects || []).length > 0) {
          setActiveTab("projects");
        } else {
          setActiveTab("species");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "species" as TabType, label: "Species", count: speciesResults.length },
    { id: "places" as TabType, label: "Places", count: placesResults.length },
    { id: "observations" as TabType, label: "Observations", count: observationsResults.length },
    { id: "projects" as TabType, label: "Projects", count: projectsResults.length },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Search Results
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mb-4 w-full md:w-1/2">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for species, places, or observations..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </form>
          
          <p className="text-muted">
            Results for: <span className="font-medium text-gray-900">&quot;{query}&quot;</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-4 px-6 text-center font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? "border-b-2 border-green-600 text-green-600"
                        : "text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Results Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-muted">Searching...</p>
              </div>
            ) : (
              <>
                {/* Species Results */}
                {activeTab === "species" && (
                  <div>
                    {speciesResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {speciesResults.map((species) => (
                          <Link
                            key={species.id}
                            href={`/species/${species.slug}`}
                            className="group"
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                              {species.defaultPhotoUrl ? (
                                <Image
                                  src={species.defaultPhotoUrl}
                                  alt={species.preferredCommonName || species.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">
                                  🌿
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 group-hover:text-green-600 line-clamp-2">
                              {species.preferredCommonName || species.name}
                            </h3>
                            <p className="text-sm text-gray-500 italic line-clamp-1">
                              {species.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-lg font-medium">No species found</p>
                        <p className="mt-2">Try searching with different keywords</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Places Results */}
                {activeTab === "places" && (
                  <div>
                    {placesResults.length > 0 ? (
                      <div className="space-y-4">
                        {placesResults.map((place) => (
                          <Link
                            key={place.id}
                            href={place.url}
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="text-4xl">
                                {place.type === "Country" ? "🌍" : "📍"}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {place.name}
                                </h3>
                                <p className="text-small">
                                  {place.country} • {place.type}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-4">📍</div>
                        <p className="text-lg font-medium">No places found</p>
                        <p className="mt-2">Try searching with different keywords</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Observations Results */}
                {activeTab === "observations" && (
                  <div>
                    {observationsResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {observationsResults.map((observation) => (
                          <Link
                            key={observation.id}
                            href={`/observation/${observation.id}`}
                            className="group"
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                              {observation.imageUrl ? (
                                <Image
                                  src={observation.imageUrl}
                                  alt={observation.species.preferredCommonName || observation.species.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">
                                  📸
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 group-hover:text-green-600 line-clamp-2">
                              {observation.species.preferredCommonName || observation.species.name}
                            </h3>
                            <p className="text-small">
                              {new Date(observation.observedAt).toLocaleDateString()}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-4">📸</div>
                        <p className="text-lg font-medium">No observations found</p>
                        <p className="mt-2">Try searching with different keywords</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Conservation Projects Results */}
                {activeTab === "projects" && (
                  <div>
                    {projectsResults.length > 0 ? (
                      <div className="space-y-4">
                        {projectsResults.map((project) => {
                          const slug = `${project.id}-${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                          return (
                          <Link
                            key={project.id}
                            href={`/conservation-project/${slug}`}
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-medium text-gray-900 line-clamp-1">
                                    {project.title}
                                  </h3>
                                  <span className={`ml-2 px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                                    project.status === 'funded' ? 'bg-green-100 text-green-800' :
                                    project.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {project.status === 'funded' ? 'Funded' :
                                     project.status === 'completed' ? 'Completed' :
                                     'Active'}
                                  </span>
                                </div>
                                {project.description && (
                                  <p className="text-small line-clamp-2 mb-2">
                                    {project.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-small">
                                  {project.country && (
                                    <span>📍 {project.country}</span>
                                  )}
                                  {project.status === 'active' && (
                                    <span className="font-medium text-green-600">
                                      ${(project.currentAmount / 100).toLocaleString()} of ${(project.goalAmount / 100).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-4">🌱</div>
                        <p className="text-lg font-medium">No conservation projects found</p>
                        <p className="mt-2">Try searching with different keywords</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
