// RateMyProfessor API utility

export interface Professor {
  id: string;
  firstName: string;
  lastName: string;
  school: {
    id: string;
    name: string;
  };
  department: string;
  rating?: number | null;
  numRatings?: number;
  wouldTakeAgainPercent?: number | null;
  difficulty?: number | null;
  recentRatings?: ProfessorRating[];
}

export interface ProfessorRating {
  id: string;
  comment: string;
  class?: string;
  grade?: string;
  date: string;
  qualityRating: number;
  difficultyRating: number;
}

/**
 * Search for professors by name at a specific school
 * @param query The search query (professor name)
 * @param schoolId Optional school ID to filter results
 * @returns Array of matching professors
 */
export interface ProfessorSearchResult {
  professors: Professor[];
  userUniversity: string | null;
}

export async function searchProfessors(
  query: string,
  schoolId?: string
): Promise<ProfessorSearchResult> {
  if (!query || query.trim().length < 2) {
    return { professors: [], userUniversity: null };
  }

  try {
    // Call our API endpoint that will proxy to RateMyProfessor
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `/api/professors/search?query=${encodeURIComponent(query)}${schoolId ? `&schoolId=${schoolId}` : ''}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error searching professors: ${response.statusText}`);
    }

    const data = await response.json();

    // If we got an error message but no professors, log it
    if (data.error) {
      console.warn('API returned an error:', data.error, data.message);
    }

    // Return both the professors and the user's university
    return {
      professors: data.professors || [],
      userUniversity: data.userUniversity || null
    };
  } catch (error) {
    // If it's an abort error, provide a more user-friendly message
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Professor search request timed out');
    } else {
      console.error('Error searching professors:', error);
    }
    return { professors: [], userUniversity: null };
  }
}

/**
 * Get professor details by ID
 * @param professorId The professor's ID
 * @returns Professor details or null if not found
 */
export async function getProfessorDetails(professorId: string): Promise<Professor | null> {
  if (!professorId) {
    return null;
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`/api/professors/${professorId}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error fetching professor details: ${response.statusText}`);
    }

    const data = await response.json();

    // If we got an error message but no professor data, log it
    if (data.error) {
      console.warn('API returned an error:', data.error, data.message);
    }

    return data.professor || null;
  } catch (error) {
    // If it's an abort error, provide a more user-friendly message
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Professor details request timed out');
    } else {
      console.error('Error fetching professor details:', error);
    }
    return null;
  }
}

/**
 * Format professor name
 * @param professor The professor object
 * @returns Formatted name string
 */
export function formatProfessorName(professor: Professor | null): string {
  if (!professor) return '';
  return `${professor.firstName} ${professor.lastName}`;
}

/**
 * Format professor with department
 * @param professor The professor object
 * @returns Formatted string with name and department
 */
export function formatProfessorWithDepartment(professor: Professor | null): string {
  if (!professor) return '';
  return `${professor.firstName} ${professor.lastName}${professor.department ? ` (${professor.department})` : ''}`;
}
