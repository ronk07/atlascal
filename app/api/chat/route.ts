import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user session and timezone
    const session = await getServerSession(authOptions);
    let userTimezone = "America/New_York"; // Default timezone
    
    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.email },
        });
        if (user?.timezone) {
          userTimezone = user.timezone;
        }
      } catch (error) {
        console.error("Failed to fetch user timezone:", error);
        // Continue with default timezone
      }
    }

    const now = new Date();
    // Format current time in user's timezone for context
    const nowInTimezone = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(now);

    const prompt = `
      Current date and time (in user's timezone ${userTimezone}): ${nowInTimezone}
      Current date and time (UTC): ${now.toISOString()}
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
      
      IMPORTANT TIMEZONE RULES:
      - The user's timezone is: ${userTimezone}
      - When the user specifies times (like "11am", "8am", "5pm"), interpret them in the user's timezone (${userTimezone})
      - Convert the times to ISO 8601 format (UTC) for the start and end fields
      - For example, if user says "11am" in ${userTimezone}, convert that to the correct UTC time
      - If no date is mentioned for an event, assume today in the user's timezone (${nowInTimezone.split(",")[0]})
      - If no duration is mentioned, assume 1 hour.
      - If the message is not about creating events, try to infer tasks or events anyway, or return an error field.
      - Ensure all dates are in ISO 8601 format (UTC).
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


