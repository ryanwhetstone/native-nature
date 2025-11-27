import { NextResponse } from 'next/server';
import { getSpeciesListWithCache } from '@/lib/speciesCache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = parseInt(searchParams.get('placeId') || '0');
    const taxonId = parseInt(searchParams.get('taxonId') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const filter = searchParams.get('filter') as 'native' | 'invasive' | undefined;

    if (!placeId || !taxonId) {
      return NextResponse.json(
        { error: 'placeId and taxonId are required' },
        { status: 400 }
      );
    }

    const filterType = filter === 'all' ? undefined : filter;
    const results = await getSpeciesListWithCache(placeId, taxonId, page, filterType);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching species list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch species list' },
      { status: 500 }
    );
  }
}
