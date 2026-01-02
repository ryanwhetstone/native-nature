import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { observations } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { getObservationUrl } from "@/lib/observation-url";
import { DeleteButton } from "../../components/DeleteButton";
import { AdminNav } from "../../components/AdminNav";

export const metadata = {
  title: 'Edit Observation | Admin | Native Nature',
  description: 'Edit observation details',
};

async function deleteObservation(formData: FormData) {
  'use server';

  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const id = Number(formData.get('id'));

  await db.delete(observations).where(eq(observations.id, id));

  revalidatePath('/admin/observations');
  redirect('/admin/observations');
}

export default async function EditObservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;

  const observation = await db.query.observations.findFirst({
    where: eq(observations.id, Number(id)),
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
          email: true,
        },
      },
      species: {
        columns: {
          name: true,
          preferredCommonName: true,
        },
      },
      pictures: true,
    },
  });

  if (!observation) {
    redirect('/admin/observations');
  }

  return (
    <main className="min-h-screen bg-light">
      <AdminNav />
      <div className="section">
        <div className="container-lg">
          <div className="flex items-center justify-between mb-6">
            <h1>Observation Details</h1>
            <div className="flex gap-2">
              <Link
                href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}
                className="btn-secondary"
              >
                View Observation →
              </Link>
              <Link href="/admin/observations" className="btn-secondary">
                ← Back to Observations
              </Link>
            </div>
          </div>

          <div className="section-card">
            <h2 className="text-xl font-semibold mb-4">Observation Information</h2>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Species</dt>
                <dd className="text-lg text-gray-900">
                  {observation.species.preferredCommonName || observation.species.name}
                  {observation.species.preferredCommonName && (
                    <span className="text-sm text-gray-500 italic ml-2">({observation.species.name})</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Observer</dt>
                <dd className="text-gray-900">
                  {observation.user.publicName || observation.user.name} ({observation.user.email})
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Location</dt>
                <dd className="text-gray-900">
                  {[observation.city, observation.region, observation.country].filter(Boolean).join(', ') || 'Not specified'}
                </dd>
              </div>

              {observation.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">Description</dt>
                  <dd className="text-gray-900">{observation.description}</dd>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">Latitude</dt>
                  <dd className="text-gray-900 font-mono">{observation.latitude}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">Longitude</dt>
                  <dd className="text-gray-900 font-mono">{observation.longitude}</dd>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">Observed At</dt>
                  <dd className="text-gray-900">{new Date(observation.observedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 mb-1">Submitted</dt>
                  <dd className="text-gray-900">{new Date(observation.createdAt).toLocaleString()}</dd>
                </div>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Photos</dt>
                <dd className="text-gray-900">{observation.pictures.length} photo(s)</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1">Observation ID</dt>
                <dd className="text-gray-900 font-mono">{observation.id}</dd>
              </div>
            </dl>
          </div>

          {observation.pictures.length > 0 && (
            <div className="mt-6 section-card">
              <h2 className="text-lg font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {observation.pictures.map((picture) => (
                  <div key={picture.id} className="relative aspect-square">
                    <Image
                      src={picture.imageUrl}
                      alt={picture.caption || 'Observation photo'}
                      fill
                      className="object-cover rounded-lg"
                    />
                    {picture.caption && (
                      <p className="mt-1 text-sm text-gray-600">{picture.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 section-card bg-red-50 border-red-200">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
            <p className="text-sm text-red-700 mb-4">
              Deleting this observation is permanent and cannot be undone. All associated photos will also be deleted.
            </p>
            <DeleteButton
              formAction={deleteObservation}
              confirmMessage="Are you sure you want to delete this observation? This action cannot be undone."
              buttonText="Delete Observation"
            >
              <input type="hidden" name="id" value={observation.id} />
            </DeleteButton>
          </div>
        </div>
      </div>
    </main>
  );
}
