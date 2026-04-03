'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, removeAuth } from '@/lib/api';
import { 
  LogOut, Plus, Search, CheckCircle2, Circle, 
  Trash2, Edit, AlertCircle, Calendar, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';

interface Task {
  id: string;
  taskId?: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function Dashboard() {
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const limit = 9;

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: ''
  });

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Cancel token ref for requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTasks = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });
      
      const { data } = await api.get(`/tasks?${params}`, {
        signal: abortControllerRef.current.signal
      });
      setTasks(data.tasks);
      setTotalPages(data.pagination.totalPages || 1);

      if (searchQuery && data.tasks.length === 0) {
        showToast('Task not found', 'error');
      }
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return; // Ignore canceled requests dynamically
      }
      if (error.response?.status !== 401) {
        showToast('Failed to load tasks', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || '');
    fetchTasks();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTasks]);

  const handleLogout = () => {
    removeAuth();
    localStorage.removeItem('userName');
    router.push('/login');
  };

  const openForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      };

      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, payload);
        showToast('Task updated successfully');
      } else {
        await api.post('/tasks', payload);
        showToast('Task created successfully');
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save task', 'error');
    }
  };

  const toggleTaskStatus = async (id: string) => {
    try {
      const { data } = await api.patch(`/tasks/${id}/toggle`);
      setTasks(tasks.map(t => t.id === id ? data.task : t));
      showToast('Task status updated');
    } catch (error) {
      showToast('Failed to change status', 'error');
    }
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const deleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/tasks/${taskToDelete}`);
      showToast('Task deleted successfully');
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      showToast('Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add specific fix for loader CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .animate-spin { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="container">
      <header className="dashboard-header">
        <div>
          <h1 className="title">Task Dashboard</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Manage your daily activities efficiently</p>
        </div>
        <div className="dashboard-user">
          {userName && (
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
              Hello, {userName}
            </span>
          )}
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="filters-group" style={{ flex: '0 0 auto' }}>
          <select 
            className="input-field" 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => openForm()}>
            <Plus size={18} /> New Task
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary-color)' }}>
            <AlertCircle size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{searchQuery || statusFilter ? 'Try adjusting your filters.' : 'Get started by creating your first task.'}</p>
          {!(searchQuery || statusFilter) && (
            <button className="btn btn-primary" onClick={() => openForm()}>
              <Plus size={18} /> Create First Task
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="task-grid">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`task-card glass-panel priority-${task.priority} status-${task.status}`}
              >
                <div className="task-header">
                  <button 
                    className="btn-icon btn-ghost" 
                    onClick={() => toggleTaskStatus(task.id)}
                    style={{ padding: 0 }}
                  >
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle2 size={22} style={{ color: 'var(--success-color)' }} />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openForm(task)}>
                    <h3 className="task-title">
                      {task.taskId ? <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem', fontSize: '0.875rem' }}>#{task.taskId}</span> : null}
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="task-meta">
                  <span className={`badge badge-status-${task.status}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.dueDate && (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Calendar size={12} />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="task-actions">
                  <button className="btn-icon btn-ghost" onClick={(e) => { e.stopPropagation(); openForm(task); }}>
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon btn-ghost" onClick={(e) => confirmDelete(task.id, e)} style={{ color: 'var(--danger-color)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-secondary" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button 
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={submitTask}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input
                  required
                  type="text"
                  className="input-field"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Priority</label>
                  <select 
                    className="input-field"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Status</label>
                  <select 
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="input-group">
                <label className="input-label">Due Date (Optional)</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--danger-color)' }}>
              <Trash2 size={32} />
            </div>
            <h2 className="modal-title" style={{ marginBottom: '0.5rem', display: 'block' }}>Delete Task?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This action cannot be undone. Are you sure you want to delete this task?</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                style={{ background: 'var(--danger-color)', color: 'white' }} 
                onClick={deleteTask}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
