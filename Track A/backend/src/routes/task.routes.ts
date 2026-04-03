import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  toggleTask,
} from '../controllers/task.controller';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// GET /tasks - List tasks with pagination, filtering, search
// POST /tasks - Create a task
router.route('/').get(getTasks).post(createTask);

// GET /tasks/:id - Get single task
// PATCH /tasks/:id - Update task
// DELETE /tasks/:id - Delete task
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);

// PATCH /tasks/:id/toggle - Toggle task completion status
router.patch('/:id/toggle', toggleTask);

export default router;
