"use client";

import { useEffect, useState } from "react";
import CalendarView from "./CalendarView";
import ChatInterface from "./ChatInterface";
import TaskList from "./TaskList";
import { ThemeToggle } from "./ThemeToggle";
import { Draggable } from "@fullcalendar/interaction";
import { LogOut, MessageSquare, ListTodo, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { CalendarSettingsModal } from "./CalendarSettingsModal";

export default function Dashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"chat" | "tasks">("chat");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  useEffect(() => {
    // Load preferences from database
    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          setSelectedCalendarIds(data.selectedCalendarIds || ["primary"]);
        } else {
          // Fallback to default if API fails
          setSelectedCalendarIds(["primary"]);
        }
      } catch (error) {
        console.error("Failed to load preferences", error);
        setSelectedCalendarIds(["primary"]);
      }
    };

    if (session?.user?.email) {
      loadPreferences();
    }
  }, [session]);

  useEffect(() => {
    const containerEl = document.getElementById("external-events");
    if (containerEl) {
      new Draggable(containerEl, {
        itemSelector: ".fc-event",
        eventData: function (eventEl) {
          return {
            title: eventEl.getAttribute("data-title"),
            duration: "01:00", // Default duration
          };
        },
      });
    }
  }, [activeTab]); // Re-init when tab changes (if DOM re-renders)

  const handleEventCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEventDrop = async (info: any) => {
    // Handle drop from task list
    // Create the event in Google Calendar
    const { date } = info;
    const title = info.draggedEl.getAttribute("data-title");
    const id = info.draggedEl.getAttribute("data-id");
    
    if (!title) return;

    // Default 1 hour duration
    const start = date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          start: start.toISOString(),
          end: end.toISOString(),
          description: "Dragged from Tasks",
        }),
      });

      if (res.ok) {
        if (id) {
            await fetch("/api/tasks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, scheduled: true }),
            });
        }
        // Refresh calendar
        setRefreshTrigger((prev) => prev + 1);
        info.draggedEl.parentNode?.removeChild(info.draggedEl);
      }
    } catch (error) {
        console.error("Failed to create event from drop", error);
        info.revert();
    }
  };

  const handleSaveCalendarSettings = async (ids: string[]) => {
    setSelectedCalendarIds(ids);
    // Save to database
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCalendarIds: ids }),
      });
    } catch (error) {
      console.error("Failed to save calendar preferences", error);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F0F0F0] dark:bg-[#1a1a1a]">
      <CalendarSettingsModal 
        isOpen={showCalendarSettings}
        onClose={() => setShowCalendarSettings(false)}
        selectedCalendarIds={selectedCalendarIds}
        onSave={handleSaveCalendarSettings}
      />
      {/* Left Panel: Calendar */}
      <div className="flex-1 flex flex-col border-r border-[#D4D4D4] dark:border-[#404040]">
        <header className="flex h-16 items-center justify-between bg-white px-6 border-b border-[#D4D4D4] dark:bg-[#2B2B2B] dark:border-[#404040]">
          <h1 className="text-xl font-bold text-[#2B2B2B] dark:text-white">Atlas</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => setShowCalendarSettings(true)}
              className="text-[#B3B3B3] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </button>
            <span className="text-sm text-[#B3B3B3] dark:text-[#A0A0A0]">{session?.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-[#B3B3B3] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden p-4">
          <CalendarView 
            onEventDrop={handleEventDrop} 
            refreshTrigger={refreshTrigger} 
            selectedCalendarIds={selectedCalendarIds}
          />
        </div>
      </div>

      {/* Right Panel: Chat + Tasks */}
      <div className="w-[400px] flex flex-col bg-white shadow-lg dark:bg-[#2B2B2B] border-l border-transparent dark:border-[#404040]">
        <div className="flex border-b border-[#D4D4D4] dark:border-[#404040]">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium ${
              activeTab === "chat"
                ? "border-b-2 border-[#2B2B2B] text-[#2B2B2B] dark:border-white dark:text-white"
                : "text-[#B3B3B3] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Chat
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium ${
              activeTab === "tasks"
                ? "border-b-2 border-[#2B2B2B] text-[#2B2B2B] dark:border-white dark:text-white"
                : "text-[#B3B3B3] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:text-white"
            }`}
          >
            <ListTodo className="h-4 w-4" /> Tasks
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-white dark:bg-[#2B2B2B]">
          {activeTab === "chat" ? (
            <ChatInterface onEventCreated={handleEventCreated} />
          ) : (
            <TaskList />
          )}
        </div>
      </div>
    </div>
  );
}

