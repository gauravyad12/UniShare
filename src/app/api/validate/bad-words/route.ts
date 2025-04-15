import { NextRequest, NextResponse } from "next/server";
import { containsBadWords, getFirstBadWord } from "@/utils/badWords";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, fieldName } = body;

    if (!text) {
      return NextResponse.json({ valid: true });
    }

    const badWord = getFirstBadWord(text);
    
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
