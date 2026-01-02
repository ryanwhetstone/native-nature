import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { observationPictures, projectPictures, projectUpdatePictures } from "@/db/schema";
import { count, isNull, eq, or } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Pagination } from "../../components/Pagination";
import { AdminNav } from "../../components/AdminNav";
import { BulkPhotoManager } from "./BulkPhotoManager";

export const metadata = {
  title: 'Bulk Photo Management | Admin | Native Nature',
  description: 'Review and approve photos in bulk',
};

const ITEMS_PER_PAGE = 50;

async function bulkUpdateApproval(photoIds: number[], type: 'observation' | 'project' | 'project-update', approved: boolean | null) {
  'use server';

  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (type === 'observation') {
    await db.update(observationPictures)
      .set({ approved })
      .where(eq(observationPictures.id, photoIds[0]));

    for (const id of photoIds.slice(1)) {
      await db.update(observationPictures)
        .set({ approved })
        .where(eq(observationPictures.id, id));
    }
  } else if (type === 'project') {
    await db.update(projectPictures)
      .set({ approved })
      .where(eq(projectPictures.id, photoIds[0]));

    for (const id of photoIds.slice(1)) {
      await db.update(projectPictures)
        .set({ approved })
        .where(eq(projectPictures.id, id));
    }
  } else if (type === 'project-update') {
    await db.update(projectUpdatePictures)
      .set({ approved })
      .where(eq(projectUpdatePictures.id, photoIds[0]));

    for (const id of photoIds.slice(1)) {
      await db.update(projectUpdatePictures)
        .set({ approved })
        .where(eq(projectUpdatePictures.id, id));
    }
  }

  revalidatePath('/admin/photos/bulk');
}

export default async function BulkPhotoManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const filter = params.filter || 'pending'; // pending, approved, disapproved
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Determine approval filter value
  const approvalFilter = filter === 'approved' ? true : filter === 'disapproved' ? false : null;

  // Fetch photos based on approval status
  const observationPhotos = await db.query.observationPictures.findMany({
    orderBy: (pictures, { desc }) => [desc(pictures.createdAt)],
    with: {
      observation: {
        with: {
          species: {
            columns: {
              name: true,
              preferredCommonName: true,
            },
          },
        },
      },
    },
  });

  const projectPhotos = await db.query.projectPictures.findMany({
    orderBy: (pictures, { desc }) => [desc(pictures.createdAt)],
    with: {
      project: {
        columns: {
          title: true,
        },
      },
    },
  });

  const projectUpdatePhotos = await db.query.projectUpdatePictures.findMany({
    orderBy: (pictures, { desc }) => [desc(pictures.createdAt)],
    with: {
      update: {
        columns: {
          title: true,
        },
      },
    },
  });

  // Combine all photos and filter by approval status
  const allPhotos = [
    ...observationPhotos.filter(p => p.approved === approvalFilter).map(photo => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      type: 'observation' as const,
      approved: photo.approved,
      title: photo.observation ? (photo.observation.species.preferredCommonName || photo.observation.species.name) : 'N/A',
    })),
    ...projectPhotos.filter(p => p.approved === approvalFilter).map(photo => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      type: 'project' as const,
      approved: photo.approved,
      title: photo.project?.title || 'N/A',
    })),
    ...projectUpdatePhotos.filter(p => p.approved === approvalFilter).map(photo => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      type: 'project-update' as const,
      approved: photo.approved,
      title: photo.update?.title || 'N/A',
    })),
  ];

  // Sort by most recent first
  allPhotos.sort((a, b) => b.id - a.id);

  const totalCount = allPhotos.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedPhotos = allPhotos.slice(offset, offset + ITEMS_PER_PAGE);

  return (
    <main className="min-h-screen bg-light">
      <AdminNav />
      <div className="section">
        <div className="container-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-gap-xs">
              <h1>Bulk Photo Management</h1>
              <p className="text-muted">
                {totalCount} {filter === 'approved' ? 'approved' : filter === 'disapproved' ? 'disapproved' : 'pending'} photos
              </p>
            </div>
            <Link href="/admin/photos" className="btn-secondary">
              Back to Photos
            </Link>
          </div>

          <div className="section-card mb-6">
            <div className="flex gap-3">
              <Link
                href="/admin/photos/bulk?filter=pending"
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'pending'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Pending Review
              </Link>
              <Link
                href="/admin/photos/bulk?filter=approved"
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Approved
              </Link>
              <Link
                href="/admin/photos/bulk?filter=disapproved"
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'disapproved'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Disapproved
              </Link>
            </div>
          </div>

          <BulkPhotoManager
            photos={paginatedPhotos}
            bulkUpdateApproval={bulkUpdateApproval}
          />

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={`/admin/photos/bulk?filter=${filter}`}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
