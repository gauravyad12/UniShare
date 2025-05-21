import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const supabase = await createClient();

    let universitiesQuery = supabase
      .from('universities')
      .select('id, name, domain, students, logo_url');

    // If there's a search query, filter the results
    if (query) {
      universitiesQuery = universitiesQuery.ilike('name', `%${query}%`);
    }

    // Order by name since students is a text field
    const { data: allUniversities, error } = await universitiesQuery
      .order('name');

    if (error) {
      console.error('Error fetching universities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch universities' },
        { status: 500 }
      );
    }

    // Filter out the "Standard User" university from the results
    const universities = allUniversities.filter(uni => uni.name !== "Standard User");

    return NextResponse.json({ universities });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
