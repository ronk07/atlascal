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
      
      Extract event details from the user's message. The message may contain ONE or MULTIPLE events.
      Return ONLY a JSON object with the following structure:
      {
        "events": [
          {
            "title": "Event title",
            "start": "ISO8601 start time",
            "end": "ISO8601 end time",
            "description": "Event description (optional)"
          }
        ]
      }
      
      If there is only ONE event, return an array with one object. If there are MULTIPLE events (e.g., "remind me to X at 5pm and Y at 6pm and Z at 9pm"), extract ALL of them into the events array.
      
      Rules:
      - If no date is mentioned for an event, assume today (${now.toDateString()}).
      - If no duration is mentioned, assume 1 hour.
      - If the message is not about creating events, try to infer tasks or events anyway, or return an error field.
      - Ensure all dates are in ISO 8601 format.
      - Do not include markdown formatting (like \`\`\`json).
      - Look for keywords like "and", "also", commas, or multiple time references to detect multiple events.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up the response if it contains markdown
    const jsonString = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    try {
      const eventData = JSON.parse(jsonString);
      // Ensure we always return an array of events
      if (eventData.events && Array.isArray(eventData.events)) {
        return NextResponse.json(eventData);
      } else if (eventData.title && eventData.start && eventData.end) {
        // Backward compatibility: if single event format, wrap it in events array
        return NextResponse.json({ events: [eventData] });
      } else {
        return NextResponse.json({ error: "No valid events found" }, { status: 400 });
      }
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", text);
      return NextResponse.json({ error: "Failed to parse event details" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


