import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Set dynamic to force-dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const schoolId = searchParams.get('schoolId');

    // Get the user's university from the session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('User not authenticated when searching professors');
      // Continue without filtering by university
    }

    // Try to get the user's university, but don't fail if not found
    let userUniversity = null;

    if (user) {
      try {
        // Log that we're looking up the university, but don't include the user ID
        console.log("Looking up university for current user");

        // First, let's get all user profiles to see what we have
        console.log('Fetching all user profiles to check structure...');

        // Get a few rows to examine the structure
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(5);

        if (allProfilesError) {
          console.error('Error getting user profiles:', allProfilesError);
        } else {
          // Don't log the sample profiles as they contain sensitive information

          if (allProfiles && allProfiles.length > 0) {
            // Log only the column names, not the data
            console.log('Available columns in user_profiles:', Object.keys(allProfiles[0]).join(', '));
          }
        }

        // Now try to find the user's profile
        // First, let's try a direct query without specifying a user ID column
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*');

        if (profilesError) {
          console.error('Error fetching user profiles:', profilesError);
          return;
        } else {
          console.log(`Found ${userProfiles.length} user profiles`);

          // Try to find the user's profile by matching the ID to any field
          const userProfile = userProfiles.find(profile => {
            return Object.values(profile).some(value =>
              value === user.id ||
              (typeof value === 'string' && value.includes(user.id))
            );
          });

          if (!userProfile) {
            console.warn("Could not find user profile for current user");
            return;
          }

          // Don't log the entire user profile - it contains sensitive information

          // Try different possible field names for university
          userUniversity = userProfile?.university_name ||
                           userProfile?.university ||
                           userProfile?.school_name ||
                           userProfile?.school;

          if (userUniversity) {
            console.log(`Found user university: ${userUniversity}`);
          } else {
            console.warn('User does not have a university set in any known field, will search all professors');
            console.warn('Available fields in user_profiles:', Object.keys(userProfile || {}).join(', '));
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Continue without filtering by university
      }
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        professors: [],
        message: 'Query must be at least 2 characters'
      }, { status: 400 });
    }

    // Make a request to the RateMyProfessor GraphQL API
    const apiUrl = `https://www.ratemyprofessors.com/graphql`;

    // Add appropriate headers to mimic a browser request
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Origin': 'https://www.ratemyprofessors.com',
      'Referer': 'https://www.ratemyprofessors.com/',
    };

    // We're no longer filtering by university on the server side
    // Instead, we'll return all professors and let the client filter them
    // This is because there might be multiple instances of the same university
    // with different IDs in the RateMyProfessor database

    // Log the user's university for reference
    if (userUniversity) {
      console.log(`User's university is ${userUniversity}, but not filtering results server-side`);
    } else {
      console.log('No university found for user, returning all professors');
    }

    try {
      // Now search for professors across all universities
      console.log(`Searching for professors with query: "${query}" across all universities`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query TeacherSearchResultsPageQuery($query: TeacherSearchQuery!) {
              newSearch {
                teachers(query: $query) {
                  edges {
                    node {
                      id
                      firstName
                      lastName
                      school {
                        id
                        name
                      }
                      department
                      avgRating
                      numRatings
                    }
                  }
                }
              }
            }
          `,
          variables: {
            query: {
              text: query,
              // No longer filtering by school ID
              schoolID: schoolId || undefined, // Only use schoolId if explicitly provided
            }
          }
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error(`RateMyProfessor API responded with status: ${response.status}`);
        // Return empty results instead of throwing
        return NextResponse.json({
          professors: [],
          query,
          error: `API responded with status: ${response.status}`
        });
      }

      const data = await response.json();

      // Check if the expected data structure exists
      if (!data.data?.newSearch?.teachers?.edges) {
        console.warn('Unexpected API response structure:', data);

        // Check if there's an error message in the response
        if (data.errors && data.errors.length > 0) {
          console.error('GraphQL errors:', data.errors);
          return NextResponse.json({
            professors: [],
            query,
            error: data.errors[0].message || 'GraphQL error'
          });
        }

        return NextResponse.json({
          professors: [],
          query,
          error: 'Unexpected API response structure'
        });
      }

      // Transform the response to match our Professor interface
      const professors = data.data.newSearch.teachers.edges.map((edge: any) => ({
        id: edge.node.id,
        firstName: edge.node.firstName,
        lastName: edge.node.lastName,
        school: {
          id: edge.node.school?.id || '',
          name: edge.node.school?.name || ''
        },
        department: edge.node.department || '',
        rating: edge.node.avgRating || null,
        numRatings: edge.node.numRatings || 0
      }));

      console.log(`Found ${professors.length} professors matching "${query}"`);

      return NextResponse.json({
        professors,
        query,
        userUniversity: userUniversity || null,
        schoolId: schoolId || null
      });
    } catch (error) {
      console.error('Error searching professors:', error);

      // Return a fallback response with empty results
      return NextResponse.json({
        professors: [],
        query,
        error: error instanceof Error ? error.message : 'Unknown error searching professors'
      });
    }
  } catch (error) {
    console.error('Error in professor search route:', error);

    // Return a fallback response with empty results
    return NextResponse.json({
      professors: [],
      error: 'Failed to search professors',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
