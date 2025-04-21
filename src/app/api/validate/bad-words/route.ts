import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, fieldName } = body;

    if (!text) {
      return NextResponse.json({ valid: true });
    }

    // Import the bad words utility dynamically to use the async version
    const { getFirstBadWord } = await import('@/utils/badWords');

    // Check for bad words
    const badWord = await getFirstBadWord(text);

    if (badWord) {
      return NextResponse.json({
        valid: false,
        error: `${fieldName || 'Text'} contains inappropriate language. Please revise.`,
        badWord
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error validating text for bad words:", error);
    return NextResponse.json(
      { error: "Failed to validate text" },
      { status: 500 }
    );
  }
}
