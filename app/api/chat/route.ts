import { model } from "@/lib/gemini";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user session and timezone
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const accessToken = session?.accessToken;
    
    if (!session || !accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Fetch existing events from calendar for matching
    let existingEvents: any[] = [];
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Get events for next 30 days

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: futureDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
      });

      existingEvents = (response.data.items || []).map((evt: any) => ({
        id: evt.id,
        title: evt.summary || "",
        start: evt.start?.dateTime || evt.start?.date || "",
        end: evt.end?.dateTime || evt.end?.date || "",
        description: evt.description || "",
      }));
    } catch (error) {
      console.error("Failed to fetch existing events:", error);
      // Continue without existing events
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

    // Build conversation context
    let conversationContext = "";
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      conversationContext = "\n\nPrevious conversation history:\n";
      conversationHistory.forEach((msg: any) => {
        if (msg.role === "user") {
          conversationContext += `User: ${msg.content}\n`;
        } else if (msg.role === "assistant") {
          conversationContext += `Assistant: ${msg.content}\n`;
        }
      });
    }

    // Format existing events for context
    let existingEventsContext = "";
    if (existingEvents.length > 0) {
      existingEventsContext = "\n\nExisting calendar events (for reference and matching):\n";
      existingEvents.forEach((evt) => {
        const startDate = evt.start ? new Date(evt.start) : null;
        const formattedStart = startDate ? new Intl.DateTimeFormat("en-US", {
          timeZone: userTimezone,
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(startDate) : "N/A";
        
        existingEventsContext += `- ID: ${evt.id}, Title: "${evt.title}", Start: ${formattedStart} (${userTimezone})\n`;
      });
    }

    const prompt = `
      Current date and time (in user's timezone ${userTimezone}): ${nowInTimezone}
      Current date and time (UTC): ${now.toISOString()}
      User message: "${message}"
      ${conversationContext}
      ${existingEventsContext}
      
      Analyze the user's message and determine if they want to:
      1. CREATE new event(s)
      2. UPDATE existing event(s) (e.g., "move coffee chat to 5pm", "change immunization event to today at 8pm", "reschedule X to Y")
      3. Both (create some, update others)
      
      IMPORTANT: When the user references an event from previous conversation or existing events (e.g., "move immunization event", "change coffee chat"), you MUST:
      - Match it to an existing event by title/keywords from the existing events list above
      - Use the event ID from the existing events list
      - Return an "update" action with the event ID
      
      Return ONLY a JSON object with the following structure:
      {
        "action": "create" | "update" | "both",
        "events": [
          {
            "title": "Event title",
            "start": "ISO8601 start time (UTC)",
            "end": "ISO8601 end time (UTC)",
            "description": "Event description (optional)"
          }
        ],
        "updates": [
          {
            "eventId": "existing-event-id-from-list-above",
            "title": "Updated title (if changed)",
            "start": "ISO8601 start time (UTC)",
            "end": "ISO8601 end time (UTC)",
            "description": "Updated description (optional)"
          }
        ]
      }
      
      RULES:
      - If action is "create", only include "events" array
      - If action is "update", only include "updates" array
      - If action is "both", include both arrays
      - For updates, you MUST provide the eventId from the existing events list
      - For updates, ALWAYS include the title from the existing event (even if not changed) - use the exact title from the existing events list
      - Match events by title keywords (e.g., "immunization" matches "Call Immunization Office", "coffee chat" matches events with "coffee" in the title)
      - The user's timezone is: ${userTimezone}
      - When the user specifies times (like "11am", "8am", "5pm"), interpret them in the user's timezone (${userTimezone})
      - Convert all times to ISO 8601 format (UTC) for the start and end fields
      - If no date is mentioned for an event, assume today in the user's timezone
      - If no duration is mentioned, assume 1 hour
      - Use conversation history to understand context (e.g., if user said "immunization event" in previous message, match it to the event created in that conversation)
      - When matching events from conversation history, look for events mentioned in previous messages (e.g., if user said "Call Immunization Office" in a previous message, and now says "move immunization event", match it)
      - If the message is not about creating/updating events, return an error field
      - Do not include markdown formatting (like \`\`\`json)
      - Look for keywords like "move", "change", "reschedule", "update", "shift" to detect update requests
      - Look for keywords like "and", "also", commas, or multiple time references to detect multiple events
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up the response if it contains markdown
    const jsonString = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    try {
      const eventData = JSON.parse(jsonString);
      
      // Handle the new response format
      if (eventData.action === "update" && eventData.updates && Array.isArray(eventData.updates)) {
        return NextResponse.json(eventData);
      } else if (eventData.action === "both" && (eventData.events || eventData.updates)) {
        return NextResponse.json(eventData);
      } else if (eventData.action === "create" && eventData.events && Array.isArray(eventData.events)) {
        return NextResponse.json(eventData);
      } else if (eventData.events && Array.isArray(eventData.events)) {
        // Backward compatibility: if no action specified but events exist, treat as create
        return NextResponse.json({ action: "create", events: eventData.events });
      } else if (eventData.title && eventData.start && eventData.end) {
        // Backward compatibility: single event in old format
        return NextResponse.json({ action: "create", events: [eventData] });
      } else {
        return NextResponse.json({ error: eventData.error || "No valid events found" }, { status: 400 });
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


