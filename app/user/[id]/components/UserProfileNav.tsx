'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export function UserProfileNav({ 
    userId, 
    observationsCount = 0,
    photosCount = 0,
    projectsCount = 0,
    favoritesCount = 0
}: { 
    userId: string;
    observationsCount?: number;
    photosCount?: number;
    projectsCount?: number;
    favoritesCount?: number;
}) {
    const pathname = usePathname();

    const links = [
        { href: `/user/${userId}/profile`, label: 'Profile', count: null },
        { href: `/user/${userId}/observations`, label: 'Observations', count: observationsCount },
        { href: `/user/${userId}/photos`, label: 'Photos', count: photosCount },
        { href: `/user/${userId}/projects`, label: 'Projects', count: projectsCount },
        { href: `/user/${userId}/favorites`, label: 'Favorites', count: favoritesCount },
        { href: `/user/${userId}/map`, label: 'Map', count: null },
    ];

    return (
        <div className="flex gap-8 overflow-x-auto">
            {links.map((link) => {
                const isActive = pathname === link.href ||
                    (link.href.includes('/observations') && pathname?.includes('/list'));

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-1 py-1 px-2 border-b-2 transition-colors whitespace-nowrap ${isActive
                                ? 'border-white text-white font-semibold'
                                : 'border-transparent text-white hover:text-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <span>
                            {link.label}
                            {link.count !== null && link.count !== undefined && (
                                <span className="ml-1">({link.count})</span>
                            )}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
