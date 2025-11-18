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

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.calendarList.list({
      minAccessRole: "reader",
    });

    return NextResponse.json(response.data.items);
  } catch (error) {
    console.error("Calendar List API Error:", error);
    return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 });
  }
}

