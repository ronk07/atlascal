"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

interface Calendar {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
}

interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCalendarIds: string[];
  onSave: (ids: string[]) => void;
}

export function CalendarSettingsModal({
  isOpen,
  onClose,
  selectedCalendarIds,
  onSave,
}: CalendarSettingsModalProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCalendarIds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCalendars();
      setSelectedIds(selectedCalendarIds);
    }
  }, [isOpen, selectedCalendarIds]);

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/list");
      if (res.ok) {
        const data = await res.json();
        setCalendars(data);

        // Handle 'primary' alias mapping
        const primaryCal = data.find((c: Calendar) => c.primary);
        if (primaryCal) {
          setSelectedIds((prev) => {
            if (prev.includes("primary")) {
              const newIds = prev.filter((id) => id !== "primary");
              return newIds.includes(primaryCal.id) ? newIds : [...newIds, primaryCal.id];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch calendars", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((cId) => cId !== id)
        : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#2B2B2B]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 dark:border-[#404040]">
          <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-white">
            Calendar Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#B3B3B3] hover:bg-[#F3F4F6] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:bg-[#404040] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2B2B2B] border-t-transparent dark:border-white dark:border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="mb-4 text-sm text-[#6B7280] dark:text-[#A0A0A0]">
                Select calendars to display in your dashboard:
              </p>
              {calendars.map((calendar) => (
                <button
                  key={calendar.id}
                  onClick={() => toggleCalendar(calendar.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                    selectedIds.includes(calendar.id)
                      ? "border-[#2B2B2B] bg-[#F3F4F6] dark:border-white dark:bg-[#404040]"
                      : "border-[#E5E7EB] hover:bg-[#F9FAFB] dark:border-[#404040] dark:hover:bg-[#363636]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: calendar.backgroundColor || "#4285F4" }}
                    />
                    <span className="text-sm font-medium text-[#2B2B2B] dark:text-white">
                      {calendar.summary}
                    </span>
                    {calendar.primary && (
                      <span className="rounded bg-[#E5E7EB] px-1.5 py-0.5 text-xs font-medium text-[#6B7280] dark:bg-[#404040] dark:text-[#A0A0A0]">
                        Primary
                      </span>
                    )}
                  </div>
                  {selectedIds.includes(calendar.id) && (
                    <Check className="h-4 w-4 text-[#2B2B2B] dark:text-white" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#E5E7EB] px-6 py-4 dark:border-[#404040]">
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-[#2B2B2B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a1a1a] dark:bg-white dark:text-[#2B2B2B] dark:hover:bg-[#e5e5e5]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

