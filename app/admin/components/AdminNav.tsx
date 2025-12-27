'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Admin Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/projects', label: 'Projects' },
    { href: '/admin/observations', label: 'Observations' },
    { href: '/admin/species', label: 'Species' },
    { href: '/admin/photos', label: 'Photos' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container-lg py-2">
        <div className="flex space-x-8 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                isActive(link.href)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
