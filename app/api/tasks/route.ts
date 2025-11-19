import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/tasks
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.email,
        // Return all tasks - frontend can filter if needed
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, priority, estimatedDuration, date } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.email,
        title,
        priority: priority || "Medium",
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        date: date ? new Date(date) : null,
        scheduled: false,
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error for debugging
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return NextResponse.json({ 
      error: "Failed to create task",
      details: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error"
    }, { status: 500 });
  }
}

// PUT /api/tasks
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, date, estimatedDuration, ...updates } = body;
        
        if (!id) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        // Convert date string to Date object if provided
        const updateData: any = { ...updates };
        if (date !== undefined) {
            updateData.date = date ? new Date(date) : null;
        }
        if (estimatedDuration !== undefined) {
            updateData.estimatedDuration = estimatedDuration ? parseInt(estimatedDuration) : null;
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
        });
        
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

