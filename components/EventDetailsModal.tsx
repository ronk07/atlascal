import { X, Trash2, Clock, Calendar, Edit2 } from "lucide-react";

interface EventDetailsModalProps {
  event: any;
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onEdit: (event: any) => void;
}

export function EventDetailsModal({ event, onClose, onDelete, onEdit }: EventDetailsModalProps) {
  if (!event) return null;

  const start = event.start;
  const end = event.end;
  const isAllDay = event.allDay;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-[#2B2B2B] dark:border dark:border-[#404040]">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-[#2B2B2B] dark:text-white">{event.title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#B3B3B3] hover:bg-[#F0F0F0] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:bg-[#404040] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-[#2B2B2B] dark:text-[#ededed]">
            <Calendar className="h-4 w-4 text-[#B3B3B3]" />
            <span>{start.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#2B2B2B] dark:text-[#ededed]">
            <Clock className="h-4 w-4 text-[#B3B3B3]" />
            <span>
              {isAllDay
                ? "All Day"
                : `${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
            </span>
          </div>
          {event.extendedProps?.description && (
            <div className="mt-4 rounded-md bg-[#F9F9F9] p-3 text-sm text-[#2B2B2B] dark:bg-[#1a1a1a] dark:text-[#A0A0A0]">
              {event.extendedProps.description}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(event)}
            className="flex items-center gap-2 rounded-md bg-[#F3F4F6] px-4 py-2 text-sm font-medium text-[#2B2B2B] hover:bg-[#E5E7EB] dark:bg-[#404040] dark:text-white dark:hover:bg-[#525252]"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="flex items-center gap-2 rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

