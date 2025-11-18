import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const now = new Date();
    const prompt = `
      Current date and time: ${now.toISOString()}
      User message: "${message}"
      
      Extract event details from the user's message.
      Return ONLY a JSON object with the following structure:
      {
        "title": "Event title",
        "start": "ISO8601 start time",
        "end": "ISO8601 end time",
        "description": "Event description (optional)"
      }
      
      Rules:
      - If no date is mentioned, assume today (${now.toDateString()}).
      - If no duration is mentioned, assume 1 hour.
      - If the message is not about creating an event, try to infer a task or event anyway, or return an error field.
      - Ensure the dates are in ISO 8601 format.
      - Do not include markdown formatting (like \`\`\`json).
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up the response if it contains markdown
    const jsonString = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    try {
      const eventData = JSON.parse(jsonString);
      return NextResponse.json(eventData);
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", text);
      return NextResponse.json({ error: "Failed to parse event details" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

