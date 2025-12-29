import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "../components/AdminNav";
import GenerateDataClient from "./GenerateDataClient";
import { generateFakeUsers, generateFakeObservations, generateFakeProjects } from "./actions";

export const metadata = {
  title: 'Generate Test Data | Admin | Native Nature',
  description: 'Generate fake users, observations, and conservation projects for testing',
};

export default async function GenerateDataPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-light">
      <AdminNav />
      <div className="container-lg">
        <h1>Generate Test Data</h1>
        <p className="text-muted mb-6">
          Create fake users, observations, and conservation projects for testing purposes.
        </p>

        <GenerateDataClient
          generateFakeUsers={generateFakeUsers}
          generateFakeObservations={generateFakeObservations}
          generateFakeProjects={generateFakeProjects}
        />

        <div className="mt-8 section-card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold mb-2">⚠️ Important Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Fake users have emails ending in <code>@fakeuser.com</code></li>
            <li>Observations use Unsplash images and Mapbox reverse geocoding</li>
            <li>Projects use OpenAI to generate compelling titles and descriptions</li>
            <li>All generated photos start with <code>approved: null</code> (pending review)</li>
            <li>You can approve them in the Bulk Photo Management page</li>
            <li>Generate users first before creating observations or projects</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
