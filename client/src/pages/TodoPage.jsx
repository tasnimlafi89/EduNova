import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNotification } from '../components/ui/Notification';
import { api } from '../api';

const CATEGORIES = [
  { value: 'STUDY', label: 'Study', icon: 'school', color: 'text-primary bg-primary/10 border-primary/20' },
  { value: 'REVISION', label: 'Revision', icon: 'history_edu', color: 'text-secondary bg-secondary/10 border-secondary/20' },
  { value: 'GENERAL', label: 'General', icon: 'task_alt', color: 'text-tertiary bg-tertiary/10 border-tertiary/20' },
];

const getCategoryStyle = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[2];

export const TodoPage = () => {
  const queryClient = useQueryClient();
  const notify = useNotification();
  const { user } = useUser();
  const userId = user?.id || 'me';
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', userId],
    queryFn: () => api.getTasks(userId),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: ({ title, category }) => api.createTask(userId, title, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTitle('');
      notify.success('Task Created', 'New task added to your list!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, updates }) => api.updateTask(userId, taskId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (variables.updates.isCompleted) {
        notify.achievement('Task Complete!', 'Great job staying productive!');
      }
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) => api.deleteTask(userId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      notify.info('Task Deleted', 'Task has been removed.');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      createMutation.mutate({ title: newTitle.trim(), category: newCategory });
    }
  };

  const handleToggleComplete = (task) => {
    updateMutation.mutate({ taskId: task.id, updates: { isCompleted: !task.isCompleted } });
  };

  const handleSaveEdit = (taskId) => {
    if (editTitle.trim()) {
      updateMutation.mutate({ taskId, updates: { title: editTitle.trim() } });
    }
  };

  const tasks = data?.tasks || [];
  const filteredTasks = tasks.filter(t => {
    if (filter === 'ACTIVE') return !t.isCompleted;
    if (filter === 'COMPLETED') return t.isCompleted;
    return true;
  });

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const activeCount = tasks.filter(t => !t.isCompleted).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full animate-cosmic-fade">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">Task Manager</h1>
        <p className="text-on-surface-variant">Stay organized and track your study goals.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 stagger-children">
        <Card className="card-interactive text-center py-4">
          <div className="text-2xl font-black text-white font-headline">{tasks.length}</div>
          <div className="text-xs text-on-surface-variant font-medium">Total Tasks</div>
        </Card>
        <Card className="card-interactive text-center py-4">
          <div className="text-2xl font-black text-secondary font-headline">{activeCount}</div>
          <div className="text-xs text-on-surface-variant font-medium">Active</div>
        </Card>
        <Card className="card-interactive text-center py-4">
          <div className="text-2xl font-black text-primary font-headline">{completedCount}</div>
          <div className="text-xs text-on-surface-variant font-medium">Completed</div>
        </Card>
      </div>

      {/* Add Task Form */}
      <Card className="mb-6">
        <h3 className="font-headline text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">add_task</span>
          Add New Task
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-3">
            <Input 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="flex-1 py-3"
            />
            <Button type="submit" disabled={createMutation.isPending || !newTitle.trim()} className="btn-ripple px-6">
              Add
            </Button>
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setNewCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  newCategory === cat.value ? cat.color : 'text-on-surface-variant bg-surface-container border-outline-variant/10 hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 bg-surface-container rounded-xl p-1">
        {['ALL', 'ACTIVE', 'COMPLETED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === f ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 mb-3 block">checklist</span>
          <p className="text-on-surface-variant text-sm">
            {filter === 'COMPLETED' ? 'No completed tasks yet.' : filter === 'ACTIVE' ? 'All tasks are done! 🎉' : 'No tasks yet. Add one above!'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2 stagger-children">
          {filteredTasks.map((task) => {
            const catStyle = getCategoryStyle(task.category);
            const isEditing = editingId === task.id;
            
            return (
              <div 
                key={task.id}
                className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  task.isCompleted 
                    ? 'bg-surface-container-low/50 border-outline-variant/5 opacity-60' 
                    : 'bg-surface-container border-outline-variant/10 hover:border-primary/20 card-interactive'
                }`}
              >
                {/* Checkbox */}
                <button 
                  onClick={() => handleToggleComplete(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    task.isCompleted 
                      ? 'bg-secondary border-secondary' 
                      : 'border-outline-variant hover:border-secondary'
                  }`}
                >
                  {task.isCompleted && (
                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 bg-surface-container-highest rounded-lg px-3 py-1 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(task.id)}
                      />
                      <button onClick={() => handleSaveEdit(task.id)} className="text-secondary text-sm font-bold">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-on-surface-variant text-sm">Cancel</button>
                    </div>
                  ) : (
                    <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-on-surface-variant' : 'text-white'}`}>
                      {task.title}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.color}`}>
                      <span className="material-symbols-outlined text-[10px]">{catStyle.icon}</span>
                      {catStyle.label}
                    </span>
                    {task.createdAt && (
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!task.isCompleted && (
                    <button 
                      onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  )}
                  <button 
                    onClick={() => deleteMutation.mutate(task.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
