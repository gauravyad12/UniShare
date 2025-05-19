import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Set dynamic to force-dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const professorId = params.id;

    if (!professorId) {
      return NextResponse.json({
        error: 'Professor ID is required'
      }, { status: 400 });
    }

    // Get the user's university from the session, but don't fail if not found
    const supabase = createClient();
    let userUniversity = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Log that we're looking up the university, but don't include the user ID
        console.log("Looking up university for current user (professor details)");

        // First, let's get all user profiles to see what we have
        console.log('Fetching all user profiles to check structure (professor details)...');

        try {
          // Get a few rows to examine the structure
          const { data: allProfiles, error: allProfilesError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(5);

          if (allProfilesError) {
            console.error('Error getting user profiles (professor details):', allProfilesError);
          } else {
            // Don't log the sample profiles as they contain sensitive information

            if (allProfiles && allProfiles.length > 0) {
              // Log the column names from the first profile
              console.log('Available columns in user_profiles (professor details):', Object.keys(allProfiles[0]).join(', '));
            }
          }

          // Now try to find the user's profile
          const { data: userProfiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*');

          if (profilesError) {
            console.error('Error fetching user profiles (professor details):', profilesError);
          } else {
            console.log(`Found ${userProfiles.length} user profiles (professor details)`);

            // Try to find the user's profile by matching the ID to any field
            const userProfile = userProfiles.find(profile => {
              return Object.values(profile).some(value =>
                value === user.id ||
                (typeof value === 'string' && value.includes(user.id))
              );
            });

            if (!userProfile) {
              console.warn("Could not find user profile for current user (professor details)");
            } else {
              // Don't log the entire user profile - it contains sensitive information

              // Try different possible field names for university
              userUniversity = userProfile?.university_name ||
                               userProfile?.university ||
                               userProfile?.school_name ||
                               userProfile?.school;

              if (userUniversity) {
                console.log(`Found user university for professor details: ${userUniversity}`);
              } else {
                console.warn('User does not have a university set in any known field, will fetch professor without filtering');
                console.warn('Available fields in user_profiles (professor details):', Object.keys(userProfile || {}).join(', '));
              }
            }
          }
        } catch (profileError) {
          console.error('Error processing user profiles (professor details):', profileError);
        }
      } else {
        console.warn('User not authenticated when fetching professor details');
      }
    } catch (error) {
      console.error('Error fetching user profile for professor details:', error);
      // Continue without filtering by university
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

    // Variable to store the API response data
    let apiTeacher;

    try {
      console.log(`Fetching details for professor ID: ${professorId}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query TeacherRatingsPageQuery($id: ID!) {
              teacher(id: $id) {
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
                wouldTakeAgainPercent
                difficulty
                ratings {
                  edges {
                    node {
                      id
                      comment
                      class
                      grade
                      date
                      thumbsUpTotal
                      thumbsDownTotal
                      difficultyRating
                      qualityRating
                    }
                  }
                }
              }
            }
          `,
          variables: {
            id: professorId
          }
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error(`RateMyProfessor API responded with status: ${response.status}`);
        return NextResponse.json({
          error: `API responded with status: ${response.status}`
        }, { status: response.status });
      }

      const data = await response.json();

      // Check if the expected data structure exists
      if (!data.data?.teacher) {
        console.warn('Unexpected API response structure:', data);

        // Check if there's an error message in the response
        if (data.errors && data.errors.length > 0) {
          console.error('GraphQL errors:', data.errors);
          return NextResponse.json({
            error: data.errors[0].message || 'GraphQL error'
          }, { status: 400 });
        }

        return NextResponse.json({
          error: 'Professor not found or unexpected API response'
        }, { status: 404 });
      }

      // Store the teacher data for use outside the try block
      apiTeacher = data.data.teacher;
    } catch (error) {
      console.error(`Error fetching professor details: ${error}`);
      return NextResponse.json({
        error: 'Failed to fetch professor details',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Verify the professor belongs to the user's university, if university is set
    let universityId = null;

    if (userUniversity) {
      try {
        // First, get the school ID for the user's university
        const schoolSearchResponse = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: `
              query SchoolSearchQuery($query: SchoolSearchQuery!) {
                newSearch {
                  schools(query: $query) {
                    edges {
                      node {
                        id
                        name
                        city
                        state
                      }
                    }
                  }
                }
              }
            `,
            variables: {
              query: {
                text: userUniversity
              }
            }
          }),
          cache: 'no-store'
        });

        if (!schoolSearchResponse.ok) {
          console.warn(`RateMyProfessor school search API responded with status: ${schoolSearchResponse.status}`);
        } else {
          const schoolData = await schoolSearchResponse.json();

          // Find the best matching school
          if (schoolData.data?.newSearch?.schools?.edges?.length > 0) {
            // Use the first result as the best match
            universityId = schoolData.data.newSearch.schools.edges[0].node.id;
            console.log(`Found university ID for ${userUniversity}: ${universityId}`);

            // Check if the professor belongs to the user's university
            if (universityId && apiTeacher.school?.id !== universityId) {
              console.warn(`Professor ${apiTeacher.firstName} ${apiTeacher.lastName} does not belong to ${userUniversity}`);
              // We'll still return the professor, but log a warning
            }
          } else {
            console.warn(`No matching schools found for university: ${userUniversity}`);
          }
        }
      } catch (error) {
        console.error('Error verifying professor university:', error);
        // Continue without verification
      }
    }

    const professor = {
      id: apiTeacher.id,
      firstName: apiTeacher.firstName,
      lastName: apiTeacher.lastName,
      school: {
        id: apiTeacher.school?.id || '',
        name: apiTeacher.school?.name || ''
      },
      department: apiTeacher.department || '',
      rating: apiTeacher.avgRating || null,
      numRatings: apiTeacher.numRatings || 0,
      wouldTakeAgainPercent: apiTeacher.wouldTakeAgainPercent || null,
      difficulty: apiTeacher.difficulty || null,
      // Include a few recent ratings if available
      recentRatings: apiTeacher.ratings?.edges?.slice(0, 3).map((edge: any) => ({
        id: edge.node.id,
        comment: edge.node.comment,
        class: edge.node.class,
        grade: edge.node.grade,
        date: edge.node.date,
        qualityRating: edge.node.qualityRating,
        difficultyRating: edge.node.difficultyRating
      })) || []
    };

    return NextResponse.json({ professor });
  } catch (error) {
    console.error('Error fetching professor details:', error);
    return NextResponse.json({
      error: 'Failed to fetch professor details',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
