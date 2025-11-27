import { NextResponse } from 'next/server';
import { saveSpeciesFromAPI } from '@/db/queries';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taxon, placeId, isNative } = body;

    if (!taxon || !taxon.id) {
      return NextResponse.json(
        { error: 'Taxon data is required' },
        { status: 400 }
      );
    }

    const speciesId = await saveSpeciesFromAPI(taxon, placeId, isNative);

    return NextResponse.json({ 
      success: true, 
      speciesId 
    });
  } catch (error) {
    console.error('Error saving species:', error);
    return NextResponse.json(
      { error: 'Failed to save species' },
      { status: 500 }
    );
  }
}
