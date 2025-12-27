import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { observationPictures, projectPictures, projectUpdatePictures } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import { DeleteButton } from "../../../components/DeleteButton";

export const metadata = {
  title: 'Edit Photo | Admin | Native Nature',
  description: 'Edit photo details',
};

async function updatePhoto(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const id = Number(formData.get('id'));
  const type = formData.get('type') as string;
  const caption = formData.get('caption') as string;

  if (type === 'observation') {
    await db
      .update(observationPictures)
      .set({ caption: caption || null })
      .where(eq(observationPictures.id, id));
  } else if (type === 'project') {
    await db
      .update(projectPictures)
      .set({ caption: caption || null })
      .where(eq(projectPictures.id, id));
  } else if (type === 'project-update') {
    await db
      .update(projectUpdatePictures)
      .set({ caption: caption || null })
      .where(eq(projectUpdatePictures.id, id));
  }

  revalidatePath('/admin/photos');
  redirect('/admin/photos');
}

async function deletePhoto(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const id = Number(formData.get('id'));
  const type = formData.get('type') as string;

  if (type === 'observation') {
    await db.delete(observationPictures).where(eq(observationPictures.id, id));
  } else if (type === 'project') {
    await db.delete(projectPictures).where(eq(projectPictures.id, id));
  } else if (type === 'project-update') {
    await db.delete(projectUpdatePictures).where(eq(projectUpdatePictures.id, id));
  }

  revalidatePath('/admin/photos');
  redirect('/admin/photos');
}

export default async function EditPhotoPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const { type, id } = await params;
  let photo: any = null;
  let itemTitle = '';

  if (type === 'observation') {
    photo = await db.query.observationPictures.findFirst({
      where: eq(observationPictures.id, Number(id)),
      with: {
        observation: {
          with: {
            species: true,
            user: true,
          },
        },
      },
    });
    if (photo?.observation) {
      itemTitle = photo.observation.species.preferredCommonName || photo.observation.species.name;
    }
  } else if (type === 'project') {
    photo = await db.query.projectPictures.findFirst({
      where: eq(projectPictures.id, Number(id)),
      with: {
        project: {
          with: {
            user: true,
          },
        },
      },
    });
    if (photo?.project) {
      itemTitle = photo.project.title;
    }
  } else if (type === 'project-update') {
    photo = await db.query.projectUpdatePictures.findFirst({
      where: eq(projectUpdatePictures.id, Number(id)),
      with: {
        update: {
          with: {
            project: true,
            user: true,
          },
        },
      },
    });
    if (photo?.update) {
      itemTitle = `${photo.update.project.title} - ${photo.update.title}`;
    }
  }

  if (!photo) {
    redirect('/admin/photos');
  }

  return (
    <main className="min-h-screen bg-light">
      <div className="container-lg">
        <div className="flex items-center justify-between mb-6">
          <h1>Edit Photo</h1>
          <Link href="/admin/photos" className="btn-secondary">
            ← Back to Photos
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="section-card">
            <h2 className="text-lg font-semibold mb-4">Photo Preview</h2>
            <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={photo.imageUrl}
                alt={photo.caption || 'Photo'}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="section-card">
              <form action={updatePhoto}>
                <input type="hidden" name="id" value={photo.id} />
                <input type="hidden" name="type" value={type} />
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                      Caption
                    </label>
                    <textarea
                      id="caption"
                      name="caption"
                      rows={4}
                      defaultValue={photo.caption || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a caption for this photo..."
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                    <Link href="/admin/photos" className="btn-secondary">
                      Cancel
                    </Link>
                  </div>
                </div>
              </form>
            </div>

            <div className="section-card bg-gray-50">
              <h2 className="text-lg font-semibold mb-3">Photo Information</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Type:</dt>
                  <dd className="font-medium text-gray-900 capitalize">{type.replace('-', ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Item:</dt>
                  <dd className="text-gray-900">{itemTitle}</dd>
                </div>
                {type === 'observation' && photo.observation && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Observer:</dt>
                    <dd className="text-gray-900">
                      {photo.observation.user.publicName || photo.observation.user.name}
                    </dd>
                  </div>
                )}
                {type === 'project' && photo.project && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Creator:</dt>
                    <dd className="text-gray-900">
                      {photo.project.user.publicName || photo.project.user.name}
                    </dd>
                  </div>
                )}
                {type === 'project-update' && photo.update && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Creator:</dt>
                    <dd className="text-gray-900">
                      {photo.update.user.publicName || photo.update.user.name}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Photo ID:</dt>
                  <dd className="font-mono text-gray-900">{photo.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Uploaded:</dt>
                  <dd className="text-gray-900">{new Date(photo.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <div className="section-card bg-red-50 border-red-200">
              <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
              <p className="text-sm text-red-700 mb-4">
                Deleting this photo is permanent and cannot be undone.
              </p>
              <DeleteButton
                formAction={deletePhoto}
                confirmMessage="Are you sure you want to delete this photo? This action cannot be undone."
                buttonText="Delete Photo"
              >
                <input type="hidden" name="id" value={photo.id} />
                <input type="hidden" name="type" value={type} />
              </DeleteButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
