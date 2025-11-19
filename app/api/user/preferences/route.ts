import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/user/preferences
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.email },
    });

    if (!user) {
      // Return defaults if user doesn't exist yet
      return NextResponse.json({
        selectedCalendarIds: ["primary"],
        theme: "system",
      });
    }

    return NextResponse.json({
      selectedCalendarIds: user.selectedCalendarIds
        ? JSON.parse(user.selectedCalendarIds)
        : ["primary"],
      theme: user.theme || "system",
    });
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch user preferences",
        details: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error"
      },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { selectedCalendarIds, theme } = body;

    const updateData: any = {};
    if (selectedCalendarIds !== undefined) {
      updateData.selectedCalendarIds = JSON.stringify(selectedCalendarIds);
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }

    // Upsert user preferences
    const user = await prisma.user.upsert({
      where: { id: session.user.email },
      update: updateData,
      create: {
        id: session.user.email,
        selectedCalendarIds: selectedCalendarIds
          ? JSON.stringify(selectedCalendarIds)
          : JSON.stringify(["primary"]),
        theme: theme || "system",
      },
    });

    return NextResponse.json({
      selectedCalendarIds: user.selectedCalendarIds
        ? JSON.parse(user.selectedCalendarIds)
        : ["primary"],
      theme: user.theme || "system",
    });
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { 
        error: "Failed to update user preferences",
        details: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error"
      },
      { status: 500 }
    );
  }
}

