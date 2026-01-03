import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { species } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getSpeciesUrl } from "@/lib/species-url";
import Image from "next/image";
import { AdminNav } from "../../components/AdminNav";

export const metadata = {
  title: 'Edit Species | Admin | Native Nature',
  description: 'Edit species details',
};

async function updateSpecies(formData: FormData) {
  'use server';

  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const id = Number(formData.get('id'));
  const preferredCommonName = formData.get('preferredCommonName') as string;
  const conservationStatus = formData.get('conservationStatus') as string;
  const wikipediaSummary = formData.get('wikipediaSummary') as string;

  await db
    .update(species)
    .set({
      preferredCommonName: preferredCommonName || null,
      conservationStatus: conservationStatus || null,
      wikipediaSummary: wikipediaSummary || null,
      updatedAt: new Date(),
    })
    .where(eq(species.id, id));

  revalidatePath('/admin/species');
  revalidatePath(`/species/${id}`);
  redirect('/admin/species');
}

export default async function EditSpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;

  const speciesData = await db.query.species.findFirst({
    where: eq(species.id, Number(id)),
  });

  if (!speciesData) {
    redirect('/admin/species');
  }

  return (
    <>
      <AdminNav />
      <div className="section">
        <div className="container-lg">
          <div className="flex items-center justify-between mb-6">
            <h1>Edit Species</h1>
            <div className="flex gap-2">
              <Link
                href={getSpeciesUrl(speciesData.slug || speciesData.id, speciesData.name, speciesData.preferredCommonName)}
                className="btn-secondary"
              >
                View Species →
              </Link>
              <Link href="/admin/species" className="btn-secondary">
                ← Back to Species
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="section-card">
                <form action={updateSpecies}>
                  <input type="hidden" name="id" value={speciesData.id} />

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Scientific Name
                      </label>
                      <input
                        type="text"
                        value={speciesData.name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 italic"
                      />
                    </div>

                    <div>
                      <label htmlFor="preferredCommonName" className="block text-sm font-medium text-gray-700 mb-2">
                        Common Name
                      </label>
                      <input
                        type="text"
                        id="preferredCommonName"
                        name="preferredCommonName"
                        defaultValue={speciesData.preferredCommonName || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="conservationStatus" className="block text-sm font-medium text-gray-700 mb-2">
                        Conservation Status
                      </label>
                      <select
                        id="conservationStatus"
                        name="conservationStatus"
                        defaultValue={speciesData.conservationStatus || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Not Assessed</option>
                        <option value="LC">Least Concern (LC)</option>
                        <option value="NT">Near Threatened (NT)</option>
                        <option value="VU">Vulnerable (VU)</option>
                        <option value="EN">Endangered (EN)</option>
                        <option value="CR">Critically Endangered (CR)</option>
                        <option value="EW">Extinct in Wild (EW)</option>
                        <option value="EX">Extinct (EX)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="wikipediaSummary" className="block text-sm font-medium text-gray-700 mb-2">
                        Wikipedia Summary
                      </label>
                      <textarea
                        id="wikipediaSummary"
                        name="wikipediaSummary"
                        rows={6}
                        defaultValue={speciesData.wikipediaSummary || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <button type="submit" className="btn-primary">
                        Save Changes
                      </button>
                      <Link href="/admin/species" className="btn-secondary">
                        Cancel
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              {speciesData.defaultPhotoUrl && (
                <div className="section-card">
                  <h2 className="text-lg font-semibold mb-3">Photo</h2>
                  <div className="relative aspect-square w-full">
                    <Image
                      src={speciesData.defaultPhotoUrl}
                      alt={speciesData.preferredCommonName || speciesData.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  {speciesData.defaultPhotoAttribution && (
                    <p className="mt-2 text-xs text-gray-600">{speciesData.defaultPhotoAttribution}</p>
                  )}
                </div>
              )}

              <div className="section-card bg-gray-50">
                <h2 className="text-lg font-semibold mb-3">Classification</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Rank:</dt>
                    <dd className="font-medium text-gray-900">{speciesData.rank}</dd>
                  </div>
                  {speciesData.kingdom && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Kingdom:</dt>
                      <dd className="text-gray-900">{speciesData.kingdom}</dd>
                    </div>
                  )}
                  {speciesData.phylum && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Phylum:</dt>
                      <dd className="text-gray-900">{speciesData.phylum}</dd>
                    </div>
                  )}
                  {speciesData.class && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Class:</dt>
                      <dd className="text-gray-900">{speciesData.class}</dd>
                    </div>
                  )}
                  {speciesData.order && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Order:</dt>
                      <dd className="text-gray-900">{speciesData.order}</dd>
                    </div>
                  )}
                  {speciesData.family && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Family:</dt>
                      <dd className="text-gray-900">{speciesData.family}</dd>
                    </div>
                  )}
                  {speciesData.genus && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Genus:</dt>
                      <dd className="text-gray-900 italic">{speciesData.genus}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="section-card bg-gray-50">
                <h2 className="text-lg font-semibold mb-3">Statistics</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Observations:</dt>
                    <dd className="font-medium text-gray-900">{speciesData.observationsCount || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">iNaturalist ID:</dt>
                    <dd className="font-mono text-gray-900">{speciesData.taxonId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Created:</dt>
                    <dd className="text-gray-900">{new Date(speciesData.createdAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Updated:</dt>
                    <dd className="text-gray-900">{new Date(speciesData.updatedAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
                {speciesData.wikipediaUrl && (
                  <div className="mt-4">
                    <a
                      href={speciesData.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View on Wikipedia →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
      </>
  );
}
