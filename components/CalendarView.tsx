"use client";

import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg } from "@fullcalendar/core";
import { EventDetailsModal } from "./EventDetailsModal";
import { CreateEventModal } from "./CreateEventModal";
import { EditEventModal } from "./EditEventModal";

interface CalendarViewProps {
  onEventDrop?: (info: any) => void;
  refreshTrigger?: number;
  selectedCalendarIds?: string[];
}

export default function CalendarView({ onEventDrop, refreshTrigger, selectedCalendarIds }: CalendarViewProps) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  const fetchEvents = async (start: Date, end: Date) => {
    if (selectedCalendarIds && selectedCalendarIds.length === 0) {
      setEvents([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
        calendarIds: selectedCalendarIds ? selectedCalendarIds.join(",") : "primary",
      });
      const res = await fetch(`/api/calendar/events?${params}`);
      if (res.ok) {
        const data = await res.json();
        // Map Google Calendar events to FullCalendar events
        const mappedEvents = data.map((evt: any) => ({
          id: evt.id,
          title: evt.summary,
          start: evt.start.dateTime || evt.start.date,
          end: evt.end.dateTime || evt.end.date,
          allDay: !evt.start.dateTime,
          backgroundColor: "#B3B3B3",
          borderColor: "#B3B3B3",
          textColor: "#2B2B2B",
          extendedProps: {
            description: evt.description
          }
        }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/calendar/events?id=${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSelectedEvent(null);
        // Refresh events
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          fetchEvents(api.view.activeStart, api.view.activeEnd);
        }
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Failed to delete event", error);
      alert("Failed to delete event");
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedRange({ start: selectInfo.start, end: selectInfo.end });
    setCreateModalOpen(true);
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
  };

  const handleCreateEvent = async (eventData: { title: string; start: string; end: string; description: string }) => {
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          fetchEvents(api.view.activeStart, api.view.activeEnd);
        }
      } else {
        alert("Failed to create event");
      }
    } catch (error) {
      console.error("Failed to create event", error);
      alert("Failed to create event");
    }
  };

  const handleUpdateEvent = async (eventData: { id: string; title: string; start: string; end: string; description: string }) => {
    try {
      const res = await fetch("/api/calendar/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        setSelectedEvent(null); // Close details modal (which also handles closing edit modal implicitly if structured that way, but we have separate modals)
        // Refresh events
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          fetchEvents(api.view.activeStart, api.view.activeEnd);
        }
      } else {
        alert("Failed to update event");
      }
    } catch (error) {
      console.error("Failed to update event", error);
      alert("Failed to update event");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedEvent && !editModalOpen && (e.key === "Delete" || e.key === "Backspace")) {
        handleDeleteEvent(selectedEvent.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent, editModalOpen]);

  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      fetchEvents(api.view.activeStart, api.view.activeEnd);
    }
  }, [refreshTrigger, selectedCalendarIds]);

  return (
    <div className="h-full w-full bg-white p-4 shadow-sm dark:bg-[#2B2B2B]">
        <style jsx global>{`
        .fc-theme-standard .fc-scrollgrid {
            border: none;
        }
        .fc .fc-toolbar-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-toolbar-title {
            color: #ffffff;
        }
        .fc .fc-button-primary {
            background-color: #2B2B2B;
            border-color: #2B2B2B;
            text-transform: capitalize;
        }
        :global(.dark) .fc .fc-button-primary {
            background-color: #404040;
            border-color: #404040;
            color: #ffffff;
            text-transform: capitalize;
        }
        .fc .fc-button-primary:hover {
            background-color: #404040;
            border-color: #404040;
        }
        :global(.dark) .fc .fc-button-primary:hover {
            background-color: #525252;
            border-color: #525252;
        }
        .fc .fc-col-header-cell {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-col-header-cell {
            color: #ededed;
        }
        .fc .fc-col-header-cell-cushion {
            color: #2B2B2B;
            font-weight: 600;
        }
        :global(.dark) .fc .fc-col-header-cell-cushion {
            color: #ededed;
        }
        .fc .fc-timegrid-slot-label {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-timegrid-slot-label {
            color: #ededed;
        }
        .fc .fc-timegrid-slot-label-cushion {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-timegrid-slot-label-cushion {
            color: #ededed;
        }
        .fc .fc-daygrid-day-number {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-daygrid-day-number {
            color: #ededed;
        }
        .fc .fc-daygrid-day-top {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-daygrid-day-top {
            color: #ededed;
        }
        .fc .fc-scrollgrid-sync-inner {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-scrollgrid-sync-inner {
            color: #ededed;
        }
        .fc .fc-timegrid-axis {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-timegrid-axis {
            color: #ededed;
        }
        .fc .fc-timegrid-axis-cushion {
            color: #2B2B2B;
        }
        :global(.dark) .fc .fc-timegrid-axis-cushion {
            color: #ededed;
        }
        .fc-direction-ltr .fc-timegrid-slot-label {
            color: #2B2B2B;
        }
        :global(.dark) .fc-direction-ltr .fc-timegrid-slot-label {
            color: #ededed;
        }
        /* Calendar Lines */
        .fc-theme-standard td, .fc-theme-standard th {
            border-color: #e5e7eb;
        }
        :global(.dark) .fc-theme-standard td, :global(.dark) .fc-theme-standard th {
            border-color: #404040;
        }
        `}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        height="100%"
        events={events}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        select={handleDateSelect}
        datesSet={(arg) => {
          fetchEvents(arg.start, arg.end);
        }}
        eventReceive={(info) => {
            // Handle external drop
            if (onEventDrop) {
                onEventDrop(info);
            }
        }}
        eventClick={(info) => {
          setSelectedEvent(info.event);
        }}
        eventDrop={async (info) => {
            // Handle internal move (update time)
            // TODO: Implement update API
            alert("Update event not implemented in MVP yet (Visual update only)");
        }}
      />
      {createModalOpen && (
        <CreateEventModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSave={handleCreateEvent}
          initialStart={selectedRange?.start}
          initialEnd={selectedRange?.end}
        />
      )}
      {editModalOpen && selectedEvent && (
        <EditEventModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={handleUpdateEvent}
            event={selectedEvent}
        />
      )}
      {selectedEvent && !editModalOpen && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDeleteEvent}
          onEdit={() => setEditModalOpen(true)}
        />
      )}
    </div>
  );
}

