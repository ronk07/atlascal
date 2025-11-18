"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Clock, AlignLeft } from "lucide-react";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: { id: string; title: string; start: string; end: string; description: string }) => Promise<void>;
  event: any;
}

export function EditEventModal({
  isOpen,
  onClose,
  onSave,
  event,
}: EditEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title || "");
      setDescription(event.extendedProps?.description || "");
      
      const start = event.start;
      const end = event.end;
      
      if (start) {
        setStartDate(start.toISOString().split("T")[0]);
        setStartTime(start.toTimeString().slice(0, 5));
      }
      
      if (end) {
        setEndDate(end.toISOString().split("T")[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      }
    }
  }, [isOpen, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      await onSave({
        id: event.id,
        title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        description,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update event", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-[#2B2B2B] dark:border dark:border-[#404040]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 dark:border-[#404040]">
          <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-white">
            Edit Event
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#B3B3B3] hover:bg-[#F3F4F6] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:bg-[#404040] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#D4D4D4] bg-white px-3 py-2 text-sm text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-white dark:focus:border-white"
              placeholder="Event title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-1">
                Start
              </label>
              <div className="space-y-2">
                <div className="relative">
                    <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-md border border-[#D4D4D4] bg-white px-3 py-2 pl-9 text-sm text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-white dark:focus:border-white"
                    />
                    <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-[#B3B3B3]" />
                </div>
                <div className="relative">
                    <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-md border border-[#D4D4D4] bg-white px-3 py-2 pl-9 text-sm text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-white dark:focus:border-white"
                    />
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-[#B3B3B3]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-1">
                End
              </label>
              <div className="space-y-2">
                <div className="relative">
                    <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-md border border-[#D4D4D4] bg-white px-3 py-2 pl-9 text-sm text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-white dark:focus:border-white"
                    />
                    <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-[#B3B3B3]" />
                </div>
                <div className="relative">
                    <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-md border border-[#D4D4D4] bg-white px-3 py-2 pl-9 text-sm text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-white dark:focus:border-white"
                    />
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-[#B3B3B3]" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-1">
              Description
            </label>
            <div className="relative">
                <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-[#D4D4D4] bg-white px-3 py-2 pl-9 text-sm text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:border-[#404040] dark:bg-[#1a1a1a] dark:text-white dark:focus:border-white"
                placeholder="Add description"
                />
                <AlignLeft className="absolute left-2.5 top-2.5 h-4 w-4 text-[#B3B3B3]" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F3F4F6] dark:text-[#A0A0A0] dark:hover:bg-[#404040]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#2B2B2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50 dark:bg-white dark:text-[#2B2B2B] dark:hover:bg-[#e5e5e5]"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

