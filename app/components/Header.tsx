"use client";

import Link from "next/link";
import { useState } from "react";
import { UserMenu } from "./UserMenu";

export function Header({ session }: { session: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-semibold text-green-600">🌿</span>
            <span className="text-xl font-semibold text-gray-900">Native Nature</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
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
