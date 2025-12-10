// components/TaskModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, X, Save, Calendar, AlignLeft, Flag, CheckCircle } from 'lucide-react';
import { baseControlClasses, priorityStyles, DEFAULT_TASK } from '../assets/dummy';

const API_BASE = "https://taskflow-gc5e.onrender.com/api/tasks";


const TaskModal = ({ isOpen, onClose, taskToEdit, onSave, onLogout }) => {
  const [taskData, setTaskData] = useState(DEFAULT_TASK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen) return;
    if (taskToEdit) {
      const normalized = taskToEdit.completed === 'Yes' || taskToEdit.completed === true ? 'Yes' : 'No';
      setTaskData({
        ...DEFAULT_TASK,
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        priority: taskToEdit.priority || 'Low',
        dueDate: taskToEdit.dueDate?.split('T')[0] || '',
        completed: normalized,
        id: taskToEdit._id,
      });
    } else {
      setTaskData(DEFAULT_TASK);
    }
    setError(null);
  }, [isOpen, taskToEdit]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  }, []);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (taskData.dueDate < today) {
      setError('Due date cannot be in the past.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isEdit = Boolean(taskData.id);
      const url = isEdit ? `${API_BASE}/${taskData.id}/gp` : `${API_BASE}/gp`;
      const resp = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData),
      });
      if (!resp.ok) {
        if (resp.status === 401) return onLogout?.();
        const err = await resp.json();
        throw new Error(err.message || 'Failed to save task');
      }
      const saved = await resp.json();
      onSave?.(saved);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [taskData, today, getHeaders, onLogout, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-purple-100 rounded-xl max-w-md w-full shadow-lg p-6 relative animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {taskData.id ? <Save className="text-purple-500 w-5 h-5" /> : <PlusCircle className="text-purple-500 w-5 h-5" />}
            {taskData.id ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-gray-500 hover:text-purple-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <div className="flex items-center border border-purple-100 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all duration-200">
              <input
                type="text" name="title" required value={taskData.title} onChange={handleChange}
                className="w-full focus:outline-none text-sm" placeholder="Enter task title"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <AlignLeft className="w-4 h-4 text-purple-500" /> Description
            </label>
            <textarea name="description" rows="3" value={taskData.description} onChange={handleChange}
              className={baseControlClasses} placeholder="Add details about your task" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Flag className="w-4 h-4 text-purple-500" /> Priority
              </label>
              <select name="priority" value={taskData.priority} onChange={handleChange}
                className={`${baseControlClasses} ${priorityStyles[taskData.priority]}`}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-purple-500" /> Due Date
              </label>
              <input type="date" name="dueDate" required min={today} value={taskData.dueDate}
                onChange={handleChange} className={baseControlClasses} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-purple-500" /> Status
            </label>
            <div className="flex gap-4">
              {[{ val: 'Yes', label: 'Completed' }, { val: 'No', label: 'In Progress' }].map(({ val, label }) => (
                <label key={val} className="flex items-center">
                  <input type="radio" name="completed" value={val} checked={taskData.completed === val}
                    onChange={handleChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-md transition-all duration-200"
          >
            {loading ? 'Saving...' : (taskData.id ? <><Save className="w-4 h-4" /> Update Task</> : <><PlusCircle className="w-4 h-4" /> Create Task</>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
/*

import { useState, useEffect } from "react"
import axios from "axios"
import { format, isToday } from "date-fns"
import TaskModal from "./AddTask"
import { getPriorityColor, getPriorityBadgeColor, TI_CLASSES, MENU_OPTIONS } from "../assets/dummy"
import { CheckCircle2, MoreVertical, Clock, Calendar } from "lucide-react"

// FIXED API BASE URL
const API_BASE = "https://taskflow-gc5e.onrender.com/api/tasks"

const TaskItem = ({ task, onRefresh, onLogout, showCompleteCheckbox = true }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isCompleted, setIsCompleted] = useState(
    [true, 1, "yes"].includes(
      typeof task.completed === "string" ? task.completed.toLowerCase() : task.completed
    )
  )
  const [showEditModal, setShowEditModal] = useState(false)
  const [subtasks, setSubtasks] = useState(task.subtasks || [])

  useEffect(() => {
    setIsCompleted(
      [true, 1, "yes"].includes(
        typeof task.completed === "string" ? task.completed.toLowerCase() : task.completed
      )
    )
  }, [task.completed])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("No auth token found")
    return { Authorization: `Bearer ${token}` }
  }

  const borderColor = isCompleted
    ? "border-green-500"
    : getPriorityColor(task.priority).split(" ")[0]

  // -------------------------------
  // ✅ Toggle Complete FIXED
  // -------------------------------
  const handleComplete = async () => {
    const newStatus = isCompleted ? "No" : "Yes"

    try {
      await axios.put(
        `${API_BASE}/${task._id}`,
        { completed: newStatus },
        { headers: getAuthHeaders() }
      )

      setIsCompleted(!isCompleted)
      onRefresh?.()
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) onLogout?.()
    }
  }

  const handleAction = (action) => {
    setShowMenu(false)
    if (action === "edit") setShowEditModal(true)
    if (action === "delete") handleDelete()
  }

  // -------------------------------
  // ✅ Delete Task FIXED
  // -------------------------------
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${task._id}`, { headers: getAuthHeaders() })
      onRefresh?.()
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) onLogout?.()
    }
  }

  // -------------------------------
  // ✅ Save Edited Task FIXED
  // -------------------------------
  const handleSave = async (updatedTask) => {
    try {
      const payload = (({ title, description, priority, dueDate, completed }) => ({
        title,
        description,
        priority,
        dueDate,
        completed,
      }))(updatedTask)

      await axios.put(`${API_BASE}/${task._id}`, payload, { headers: getAuthHeaders() })
      setShowEditModal(false)
      onRefresh?.()
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) onLogout?.()
    }
  }

  const progress = subtasks.length
    ? (subtasks.filter((st) => st.completed).length / subtasks.length) * 100
    : 0

  return (
    <>
      <div className={`${TI_CLASSES.wrapper} ${borderColor}`}>
        <div className={TI_CLASSES.leftContainer}>
          {showCompleteCheckbox && (
            <button
              onClick={handleComplete}
              className={`${TI_CLASSES.completeBtn} ${
                isCompleted ? "text-green-500" : "text-gray-300"
              }`}
            >
              <CheckCircle2
                size={18}
                className={`${TI_CLASSES.checkboxIconBase} ${
                  isCompleted ? "fill-green-500" : ""
                }`}
              />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <h3
                className={`${TI_CLASSES.titleBase} ${
                  isCompleted ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {task.title}
              </h3>
              <span
                className={`${TI_CLASSES.priorityBadge} ${getPriorityBadgeColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>

            {task.description && <p className={TI_CLASSES.description}>{task.description}</p>}

            {subtasks.length > 0 && (
              <div className={TI_CLASSES.subtasksContainer}>
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>Subtasks Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>

                <div className={TI_CLASSES.progressBarBg}>
                  <div
                    className={TI_CLASSES.progressBarFg}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="space-y-1 sm:space-y-2 pt-1">
                  {subtasks.map((st, i) => (
                    <div key={i} className="flex items-center gap-2 group/subtask">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() =>
                          setSubtasks((prev) =>
                            prev.map((s, idx) =>
                              idx === i ? { ...s, completed: !s.completed } : s
                            )
                          )
                        }
                        className="w-4 h-4 text-purple-500 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <span
                        className={`text-sm truncate ${
                          st.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-600 group-hover/subtask:text-purple-700"
                        } transition-colors duration-200`}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={TI_CLASSES.rightContainer}>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={TI_CLASSES.menuButton}
            >
              <MoreVertical size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {showMenu && (
              <div className={TI_CLASSES.menuDropdown}>
                {MENU_OPTIONS.map((opt) => (
                  <button
                    key={opt.action}
                    onClick={() => handleAction(opt.action)}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors duration-200"
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div
              className={`${TI_CLASSES.dateRow} ${
                task.dueDate && isToday(new Date(task.dueDate))
                  ? "text-fuchsia-600"
                  : "text-gray-500"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {task.dueDate
                ? isToday(new Date(task.dueDate))
                  ? "Today"
                  : format(new Date(task.dueDate), "MMM dd")
                : "—"}
            </div>

            <div className={TI_CLASSES.createdRow}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {task.createdAt
                ? `Created ${format(new Date(task.createdAt), "MMM dd")}`
                : "No date"}
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        taskToEdit={task}
        onSave={handleSave}
      />
    </>
  )
}

export default TaskItem

*/