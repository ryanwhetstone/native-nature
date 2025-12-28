import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, observations, observationPictures, conservationProjects, projectPictures, species } from "@/db/schema";
import { AdminNav } from "../components/AdminNav";
import { sql } from "drizzle-orm";

export const metadata = {
  title: 'Generate Test Data | Admin | Native Nature',
  description: 'Generate fake users, observations, and conservation projects for testing',
};

async function generateFakeUsers(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const count = Number(formData.get('count')) || 5;
  
  const firstNames = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn', 'Reese', 'Sage'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const bios = [
    'Wildlife photographer and nature enthusiast',
    'Conservation advocate and birdwatcher',
    'Marine biologist and ocean lover',
    'Backyard naturalist and citizen scientist',
    'Environmental educator and outdoor adventurer',
  ];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${i}@fakeuser.com`;
    
    await db.insert(users).values({
      email,
      name: `${firstName} ${lastName}`,
      publicName: `${firstName} ${lastName}`,
      bio: bios[Math.floor(Math.random() * bios.length)],
      role: 'user',
    });
  }

  revalidatePath('/admin/generate-data');
  revalidatePath('/admin/users');
  return { success: true, message: `Generated ${count} fake users` };
}

async function generateFakeObservations(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const count = Number(formData.get('count')) || 5;
  
  // Get random fake users
  const fakeUsers = await db.select().from(users).where(sql`${users.email} LIKE '%@fakeuser.com'`).limit(20);
  
  if (fakeUsers.length === 0) {
    throw new Error('No fake users found. Generate fake users first.');
  }

  // Get random species
  const allSpecies = await db.select().from(species).limit(100);
  
  if (allSpecies.length === 0) {
    throw new Error('No species found in database.');
  }

  const cities = ['Seattle', 'Portland', 'San Francisco', 'Los Angeles', 'Denver', 'Austin', 'Chicago', 'Boston', 'New York', 'Miami'];
  const states = ['Washington', 'Oregon', 'California', 'California', 'Colorado', 'Texas', 'Illinois', 'Massachusetts', 'New York', 'Florida'];
  const countries = ['United States', 'United States', 'United States', 'Canada', 'Mexico'];

  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashAccessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY environment variable is not set');
  }

  for (let i = 0; i < count; i++) {
    const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    const selectedSpecies = allSpecies[Math.floor(Math.random() * allSpecies.length)];
    const cityIndex = Math.floor(Math.random() * cities.length);
    
    const latitude = (Math.random() * 60 + 20).toFixed(6); // 20-80 degrees
    const longitude = (Math.random() * -120 - 60).toFixed(6); // -60 to -180 degrees
    
    const [observation] = await db.insert(observations).values({
      userId: user.id,
      speciesId: selectedSpecies.id,
      latitude,
      longitude,
      city: cities[cityIndex],
      region: states[cityIndex],
      country: countries[Math.floor(Math.random() * countries.length)],
      description: `Observed this ${selectedSpecies.preferredCommonName || selectedSpecies.name} during a nature walk. Great sighting!`,
      observedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
    }).returning();

    // Fetch images from Unsplash based on species name
    const searchQuery = (selectedSpecies.preferredCommonName || selectedSpecies.name).toLowerCase();
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=10&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const numImages = Math.min(Math.floor(Math.random() * 3) + 1, data.results.length);
        
        for (let j = 0; j < numImages; j++) {
          const photo = data.results[j];
          await db.insert(observationPictures).values({
            observationId: observation.id,
            speciesId: selectedSpecies.id,
            imageUrl: photo.urls.regular,
            caption: `${selectedSpecies.preferredCommonName || selectedSpecies.name} - Photo by ${photo.user.name} on Unsplash`,
            approved: null, // Start as pending
          });
        }
      } else {
        // Fallback to placeholder if Unsplash fails
        const imageId = Math.floor(Math.random() * 1000);
        await db.insert(observationPictures).values({
          observationId: observation.id,
          speciesId: selectedSpecies.id,
          imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
          caption: `Photo of ${selectedSpecies.preferredCommonName || selectedSpecies.name}`,
          approved: null,
        });
      }
    } catch (error) {
      console.error('Unsplash API error:', error);
      // Fallback to placeholder
      const imageId = Math.floor(Math.random() * 1000);
      await db.insert(observationPictures).values({
        observationId: observation.id,
        speciesId: selectedSpecies.id,
        imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
        caption: `Photo of ${selectedSpecies.preferredCommonName || selectedSpecies.name}`,
        approved: null,
      });
    }
  }

  revalidatePath('/admin/generate-data');
  revalidatePath('/admin/observations');
  revalidatePath('/recent-observations');
  return { success: true, message: `Generated ${count} fake observations` };
}

async function generateFakeProjects(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const count = Number(formData.get('count')) || 3;
  
  // Get random fake users
  const fakeUsers = await db.select().from(users).where(sql`${users.email} LIKE '%@fakeuser.com'`).limit(20);
  
  if (fakeUsers.length === 0) {
    throw new Error('No fake users found. Generate fake users first.');
  }

  const projectTypes = [
    { title: 'Restore Wetland Habitat', keywords: 'wetland marsh restoration' },
    { title: 'Protect Endangered Bird Species', keywords: 'bird wildlife sanctuary' },
    { title: 'Coastal Marine Sanctuary', keywords: 'ocean coral reef marine' },
    { title: 'Urban Pollinator Garden', keywords: 'butterfly bee pollinator garden' },
    { title: 'Forest Restoration Initiative', keywords: 'forest trees reforestation' },
    { title: 'River Cleanup and Conservation', keywords: 'river stream water conservation' },
    { title: 'Wildlife Corridor Development', keywords: 'wildlife habitat corridor' },
    { title: 'Native Plant Nursery', keywords: 'native plants nursery restoration' },
  ];

  const cities = ['Seattle', 'Portland', 'San Francisco', 'Los Angeles', 'Denver', 'Austin', 'Chicago', 'Boston'];
  const states = ['Washington', 'Oregon', 'California', 'California', 'Colorado', 'Texas', 'Illinois', 'Massachusetts'];

  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashAccessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY environment variable is not set');
  }

  for (let i = 0; i < count; i++) {
    const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
    const cityIndex = Math.floor(Math.random() * cities.length);
    
    const latitude = (Math.random() * 60 + 20).toFixed(6);
    const longitude = (Math.random() * -120 - 60).toFixed(6);
    
    const fundingGoal = Math.floor(Math.random() * 100000) + 10000; // $100 to $1000
    const currentFunding = Math.floor(Math.random() * fundingGoal * 0.7); // 0-70% funded
    
    const [project] = await db.insert(conservationProjects).values({
      userId: user.id,
      title: `${projectType.title} - ${cities[cityIndex]}`,
      description: `This project aims to protect and restore critical habitat for native wildlife in the ${cities[cityIndex]} area. Through community engagement and scientific restoration practices, we will create a sustainable ecosystem that benefits both wildlife and local communities.`,
      latitude,
      longitude,
      city: cities[cityIndex],
      region: states[cityIndex],
      country: 'United States',
      fundingGoal,
      currentFunding,
      status: currentFunding >= fundingGoal ? 'completed' : 'active',
    }).returning();

    // Fetch images from Unsplash based on project keywords
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(projectType.keywords)}&per_page=10&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const numImages = Math.min(Math.floor(Math.random() * 2) + 1, data.results.length);
        
        for (let j = 0; j < numImages; j++) {
          const photo = data.results[j];
          await db.insert(projectPictures).values({
            projectId: project.id,
            imageUrl: photo.urls.regular,
            caption: `${projectType.title} - Photo by ${photo.user.name} on Unsplash`,
            approved: null, // Start as pending
          });
        }
      } else {
        // Fallback to placeholder if Unsplash fails
        const imageId = Math.floor(Math.random() * 1000) + 1000;
        await db.insert(projectPictures).values({
          projectId: project.id,
          imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
          caption: `${projectType.title} project site`,
          approved: null,
        });
      }
    } catch (error) {
      console.error('Unsplash API error:', error);
      // Fallback to placeholder
      const imageId = Math.floor(Math.random() * 1000) + 1000;
      await db.insert(projectPictures).values({
        projectId: project.id,
        imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
        caption: `${projectType.title} project site`,
        approved: null,
      });
    }
  }

  revalidatePath('/admin/generate-data');
  revalidatePath('/admin/projects');
  revalidatePath('/conservation-projects');
  return { success: true, message: `Generated ${count} fake conservation projects` };
}

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

        <div className="grid gap-6 md:grid-cols-3">
          {/* Generate Fake Users */}
          <div className="section-card">
            <h2 className="text-xl font-semibold mb-2">Fake Users</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate fake user accounts with random names and bios.
            </p>
            <form action={generateFakeUsers}>
              <div className="mb-4">
                <label htmlFor="user-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Users
                </label>
                <input
                  type="number"
                  id="user-count"
                  name="count"
                  min="1"
                  max="50"
                  defaultValue="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Generate Users
              </button>
            </form>
          </div>

          {/* Generate Fake Observations */}
          <div className="section-card">
            <h2 className="text-xl font-semibold mb-2">Fake Observations</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate fake observations with images from Lorem Picsum. Requires fake users.
            </p>
            <form action={generateFakeObservations}>
              <div className="mb-4">
                <label htmlFor="observation-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Observations
                </label>
                <input
                  type="number"
                  id="observation-count"
                  name="count"
                  min="1"
                  max="50"
                  defaultValue="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Generate Observations
              </button>
            </form>
          </div>

          {/* Generate Fake Projects */}
          <div className="section-card">
            <h2 className="text-xl font-semibold mb-2">Fake Conservation Projects</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate fake conservation projects with images. Requires fake users.
            </p>
            <form action={generateFakeProjects}>
              <div className="mb-4">
                <label htmlFor="project-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Projects
                </label>
                <input
                  type="number"
                  id="project-count"
                  name="count"
                  min="1"
                  max="20"
                  defaultValue="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Generate Projects
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 section-card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold mb-2">⚠️ Important Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Fake users have emails ending in <code>@fakeuser.com</code></li>
            <li>All generated images are from Lorem Picsum (placeholder images)</li>
            <li>All generated photos start with <code>approved: null</code> (pending review)</li>
            <li>You can approve them in the Bulk Photo Management page</li>
            <li>Generate users first before creating observations or projects</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
