import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!session || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const calendarIdsParam = searchParams.get("calendarIds");
  const calendarIds = calendarIdsParam ? calendarIdsParam.split(",") : ["primary"];

  if (!start || !end) {
    return NextResponse.json({ error: "Start and end dates required" }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const eventsPromises = calendarIds.map(async (id) => {
      try {
        const response = await calendar.events.list({
          calendarId: id,
          timeMin: start,
          timeMax: end,
          singleEvents: true,
          orderBy: "startTime",
        });
        return response.data.items || [];
      } catch (err) {
        console.error(`Failed to fetch events for calendar ${id}`, err);
        return [];
      }
    });

    const results = await Promise.all(eventsPromises);
    const allEvents = results.flat();

    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("Calendar API Error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!session || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, start, end, description } = body;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: start, // ISO String
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Or user's timezone
      },
      end: {
        dateTime: end, // ISO String
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Calendar Create Error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!session || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, start, end, description, allDay } = body;

    if (!id) {
        return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Handle all-day events vs timed events
    const event: any = {
      summary: title,
      description: description,
    };

    if (allDay) {
      // For all-day events, use date format (YYYY-MM-DD)
      event.start = { date: start };
      event.end = { date: end };
    } else {
      // For timed events, use dateTime with timezone
      event.start = {
        dateTime: start, // ISO String
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
      };
      event.end = {
        dateTime: end, // ISO String
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId: id,
      requestBody: event,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Calendar Update Error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const accessToken = session?.accessToken;

  if (!session || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
