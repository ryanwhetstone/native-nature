"use client";

import Link from "next/link";
import { useState } from "react";
import { UserMenu } from "./UserMenu";
import { useRouter } from "next/navigation";

export function Header({ session }: { session: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container-md">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-semibold text-green-600">🌿</span>
            <span className="heading-4">Native Nature</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 relative">
            {/* Search Overlay */}
            {isSearchOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-50 animate-fadeIn">
                <form onSubmit={handleSearch} className="flex items-stretch w-full max-w-lg">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for species or places..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-gray-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors"
                    aria-label="Search"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="ml-2 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Close search"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </form>
              </div>
            )}
            
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Regular Nav Links */}
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              About
            </Link>
            
            {session?.user && (
              <Link
                href="/account/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}
            
            {/* Admin Link - only show for admin users */}
            {session?.user?.role === 'admin' && (
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Admin
              </Link>
            )}
            
            {/* Auth Section */}
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMenuOpen(false)}
              className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
            >
              About
            </Link>
            {session?.user && (
              <Link
                href="/account/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
              >
                Dashboard
              </Link>
            )}
            
            {/* Admin Link - Mobile */}
            {session?.user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
              >
                Admin
              </Link>
            )}
            
            {session?.user ? (
              <>
                <Link
                  href={`/user/${session.user.id}/profile`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                >
                  Profile
                </Link>
                <Link
                  href="/account/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                >
                  Settings
                </Link>
                <Link
                  href="/api/auth/signout"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-red-600 hover:text-red-700 font-medium transition-colors py-2"
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
