import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { observationPictures, projectPictures, projectUpdatePictures } from "@/db/schema";
import { count } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { getObservationUrl } from "@/lib/observation-url";
import { getProjectUrl } from "@/lib/project-url";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { AdminNav } from "../components/AdminNav";

export const metadata = {
  title: 'Manage Photos | Admin | Native Nature',
  description: 'Manage observation and project photos',
};

const ITEMS_PER_PAGE = 50;

export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchTerm = params.search?.toLowerCase() || '';
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const observationPhotos = await db.query.observationPictures.findMany({
    orderBy: (pictures, { desc }) => [desc(pictures.createdAt)],
    with: {
      observation: {
        with: {
          user: {
            columns: {
              publicName: true,
              name: true,
            },
          },
          species: {
            columns: {
              name: true,
              preferredCommonName: true,
            },
          },
        },
      },
      species: {
        columns: {
          name: true,
          preferredCommonName: true,
        },
      },
    },
  });

  const projectPhotos = await db.query.projectPictures.findMany({
    orderBy: (pictures, { desc }) => [desc(pictures.createdAt)],
    with: {
      project: {
        with: {
          user: {
            columns: {
              publicName: true,
              name: true,
            },
          },
        },
        columns: {
          id: true,
          title: true,
        },
      },
    },
  });

  const projectUpdatePhotos = await db.query.projectUpdatePictures.findMany({
    orderBy: (pictures, { desc }) => [desc(pictures.createdAt)],
    with: {
      update: {
        with: {
          project: {
            columns: {
              id: true,
              title: true,
            },
          },
          user: {
            columns: {
              publicName: true,
              name: true,
            },
          },
        },
        columns: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Combine all three types of photos into a unified list
  const allPhotos = [
    ...observationPhotos.map(photo => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      type: 'observation' as const,
      createdAt: photo.createdAt,
      uploader: photo.observation?.user.publicName || photo.observation?.user.name || 'N/A',
      title: photo.observation ? (photo.observation.species.preferredCommonName || photo.observation.species.name) : 'N/A',
      link: photo.observation ? getObservationUrl(photo.observation.id, photo.observation.species.name, photo.observation.species.preferredCommonName) : null,
      caption: photo.caption,
    })),
    ...projectPhotos.map(photo => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      type: 'project' as const,
      createdAt: photo.createdAt,
      uploader: photo.project?.user.publicName || photo.project?.user.name || 'N/A',
      title: photo.project?.title || 'N/A',
      link: photo.project ? getProjectUrl(photo.project.id, photo.project.title) : null,
      caption: photo.caption,
    })),
    ...projectUpdatePhotos.map(photo => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      type: 'project-update' as const,
      createdAt: photo.createdAt,
      uploader: photo.update?.user.publicName || photo.update?.user.name || 'N/A',
      title: photo.update?.project ? `${photo.update.project.title} - ${photo.update.title}` : photo.update?.title || 'N/A',
      link: photo.update?.project ? getProjectUrl(photo.update.project.id, photo.update.project.title) : null,
      caption: photo.caption,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter by search term if provided
  const filteredPhotos = searchTerm
    ? allPhotos.filter(photo =>
      photo.title.toLowerCase().includes(searchTerm) ||
      photo.uploader.toLowerCase().includes(searchTerm) ||
      photo.type.toLowerCase().includes(searchTerm)
    )
    : allPhotos;

  const totalCount = filteredPhotos.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedPhotos = filteredPhotos.slice(offset, offset + ITEMS_PER_PAGE);

  return (
    <>
      <AdminNav />
      <div className="section">
        <div className="container-lg">
          <div className="flex items-center justify-between">
            <div className="flex-gap-xs">
              <h1>Manage Photos</h1>
              <p className="text-muted">
                {totalCount} total photos
              </p>
            </div>
            <Link href="/admin/photos/bulk" className="btn-primary">
              Bulk Management
            </Link>
          </div>

          <div className="section-card">
            <div className="mb-4">
              <SearchBar placeholder="Search by species, project, or uploader..." />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploader</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caption</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPhotos.map((photo) => (
                    <tr key={`${photo.type}-${photo.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-16 w-16 flex-shrink-0">
                            <Image
                              src={photo.imageUrl}
                              alt="Photo thumbnail"
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${photo.type === 'observation' ? 'bg-blue-100 text-blue-800' :
                            photo.type === 'project' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                          }`}>
                          {photo.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {photo.link ? (
                          <Link href={photo.link} className="text-blue-600 hover:underline">
                            {photo.title}
                          </Link>
                        ) : (
                          <span>{photo.title}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {photo.uploader}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {photo.caption || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(photo.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/admin/photos/${photo.type}/${photo.id}`} className="text-blue-600 hover:text-blue-900">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/photos" />
          </div>
        </div>
      </div>
    
      </>
  );
}
