"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, GripVertical, Edit2, X, Calendar, Clock, Flag, Check } from "lucide-react";

interface Task {
  id: string;
  title: string;
  priority: string;
  date?: string;
  estimatedDuration?: number;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDate, setNewDate] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const clickStartTimes = useRef<Map<string, number>>(new Map());

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;
    setIsLoading(true);
    try {
      const taskData: any = {
        title: newTask,
        priority: newPriority,
      };
      
      if (newDate) {
        taskData.date = newDate;
      }
      
      if (newDuration) {
        taskData.estimatedDuration = parseInt(newDuration);
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      
      if (res.ok) {
        setNewTask("");
        setNewPriority("Medium");
        setNewDate("");
        setNewDuration("");
        setShowForm(false);
        fetchTasks();
      } else {
        const errorData = await res.json();
        console.error("Failed to add task:", errorData);
        alert(`Failed to add task: ${errorData.details || errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to add task", error);
      alert(`Failed to add task: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400";
      case "low":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const TaskEditForm = ({ task, onSave, onCancel }: { task: Task; onSave: (updates: Partial<Task>) => void; onCancel: () => void }) => {
    const [title, setTitle] = useState(task.title);
    const [priority, setPriority] = useState(task.priority || "Medium");
    const [date, setDate] = useState(task.date ? new Date(task.date).toISOString().split('T')[0] : "");
    const [duration, setDuration] = useState(task.estimatedDuration?.toString() || "");

    const handleSave = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const updates: Partial<Task> = { title, priority };
      if (date) updates.date = date;
      if (duration) updates.estimatedDuration = parseInt(duration);
      onSave(updates);
    };

    const handleCancel = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      onCancel();
    };

    return (
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded-md border border-[#D4D4D4] px-2 py-1.5 text-sm text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:focus:border-white"
          autoFocus
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-[#B3B3B3] mb-1 dark:text-[#A0A0A0]">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                e.stopPropagation();
                setPriority(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full rounded-md border border-[#D4D4D4] px-2 py-1.5 text-xs text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:focus:border-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#B3B3B3] mb-1 dark:text-[#A0A0A0]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                e.stopPropagation();
                setDate(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-md border border-[#D4D4D4] px-2 py-1.5 text-xs text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:focus:border-white"
            />
          </div>
          <div>
            <label className="block text-xs text-[#B3B3B3] mb-1 dark:text-[#A0A0A0]">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => {
                e.stopPropagation();
                setDuration(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="60"
              min="1"
              className="w-full rounded-md border border-[#D4D4D4] px-2 py-1.5 text-xs text-[#2B2B2B] placeholder:text-[#B3B3B3] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:placeholder:text-[#666666] dark:focus:border-white"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1 rounded-md bg-[#2B2B2B] px-3 py-1.5 text-xs font-medium text-white hover:bg-opacity-90 dark:bg-white dark:text-[#2B2B2B]"
          >
            <Check className="h-3 w-3" /> Save
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-1 rounded-md bg-[#D4D4D4] px-3 py-1.5 text-xs font-medium text-[#2B2B2B] hover:bg-[#C0C0C0] dark:bg-[#525252] dark:text-white dark:hover:bg-[#666666]"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-white p-4 dark:bg-[#2B2B2B]">
      {!showForm ? (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTask.trim()) {
                setShowForm(true);
              }
            }}
            placeholder="Add a task..."
            className="flex-1 rounded-md border border-[#D4D4D4] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B3B3B3] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:placeholder:text-[#666666] dark:focus:border-white"
          />
          <button
            onClick={() => {
              if (newTask.trim()) {
                setShowForm(true);
              }
            }}
            disabled={isLoading || !newTask.trim()}
            className="rounded-md bg-[#2B2B2B] p-2 text-white hover:bg-opacity-90 disabled:opacity-50 dark:bg-white dark:text-[#2B2B2B]"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="mb-4 space-y-2 rounded-md border border-[#D4D4D4] p-3 bg-[#F9F9F9] dark:bg-[#1a1a1a] dark:border-[#404040]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task title..."
              className="flex-1 rounded-md border border-[#D4D4D4] px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#B3B3B3] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:placeholder:text-[#666666] dark:focus:border-white"
            />
            <button
              onClick={() => {
                setShowForm(false);
                setNewTask("");
                setNewPriority("Medium");
                setNewDate("");
                setNewDuration("");
              }}
              className="rounded-md p-2 text-[#B3B3B3] hover:bg-[#D4D4D4] dark:text-[#A0A0A0] dark:hover:bg-[#404040]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-[#B3B3B3] mb-1 dark:text-[#A0A0A0]">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full rounded-md border border-[#D4D4D4] px-2 py-1.5 text-xs text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:focus:border-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#B3B3B3] mb-1 dark:text-[#A0A0A0]">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-md border border-[#D4D4D4] px-2 py-1.5 text-xs text-[#2B2B2B] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:focus:border-white"
              />
            </div>
            <div>
              <label className="block text-xs text-[#B3B3B3] mb-1 dark:text-[#A0A0A0]">Duration (min)</label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="60"
                min="1"
                className="w-full rounded-md border border-[#D4D4D4] px-2 py-1.5 text-xs text-[#2B2B2B] placeholder:text-[#B3B3B3] focus:border-[#2B2B2B] focus:outline-none dark:bg-[#1a1a1a] dark:border-[#404040] dark:text-white dark:placeholder:text-[#666666] dark:focus:border-white"
              />
            </div>
          </div>
          <button
            onClick={addTask}
            disabled={isLoading || !newTask.trim()}
            className="w-full rounded-md bg-[#2B2B2B] px-3 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50 dark:bg-white dark:text-[#2B2B2B]"
          >
            Add Task
          </button>
        </div>
      )}

      <div id="external-events" className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            onMouseDown={(e) => {
              // Only track clicks, not drags - FullCalendar handles dragging
              if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('input') && !(e.target as HTMLElement).closest('select')) {
                clickStartTimes.current.set(task.id, Date.now());
              }
            }}
            onClick={(e) => {
              // Only enter edit mode if it was a quick click (not a drag) and not clicking on buttons/inputs
              const startTime = clickStartTimes.current.get(task.id);
              const wasQuickClick = startTime && (Date.now() - startTime < 200);
              if (wasQuickClick && editingId !== task.id && !(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('input') && !(e.target as HTMLElement).closest('select')) {
                setEditingId(task.id);
              }
              clickStartTimes.current.delete(task.id);
            }}
            className={`${editingId !== task.id ? 'fc-event cursor-pointer' : 'cursor-default'} rounded-md border border-[#D4D4D4] bg-white p-3 shadow-sm hover:border-[#2B2B2B] dark:bg-[#1a1a1a] dark:border-[#404040] dark:hover:border-white`}
            data-title={task.title}
            data-id={task.id}
            data-duration={task.estimatedDuration ? `00:${task.estimatedDuration}` : "01:00"}
          >
            {editingId === task.id ? (
              <div onClick={(e) => e.stopPropagation()}>
                <TaskEditForm
                  task={task}
                  onSave={(updates) => updateTask(task.id, updates)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="h-4 w-4 text-[#B3B3B3] flex-shrink-0 dark:text-[#A0A0A0]" />
                    <span className="text-sm font-medium text-[#2B2B2B] flex-1 dark:text-white">{task.title}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(task.id);
                      }}
                      className="text-[#B3B3B3] hover:text-[#2B2B2B] dark:text-[#A0A0A0] dark:hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-[#B3B3B3] hover:text-red-500 dark:text-[#A0A0A0] dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {task.priority && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const priorities = ["Low", "Medium", "High"];
                        const currentIndex = priorities.indexOf(task.priority);
                        const nextIndex = (currentIndex + 1) % priorities.length;
                        updateTask(task.id, { priority: priorities[nextIndex] });
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getPriorityColor(task.priority)}`}
                    >
                      <Flag className="h-3 w-3" />
                      {task.priority}
                    </button>
                  )}
                  {task.date && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[#2B2B2B] bg-[#F0F0F0] dark:text-white dark:bg-[#404040]">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.date).toLocaleDateString()}
                    </span>
                  )}
                  {task.estimatedDuration && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[#2B2B2B] bg-[#F0F0F0] dark:text-white dark:bg-[#404040]">
                      <Clock className="h-3 w-3" />
                      {task.estimatedDuration} min
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

