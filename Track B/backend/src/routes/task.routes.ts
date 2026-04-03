import { Router } from 'express';
import * as TaskController from '../controllers/task.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken); // Guard all task routes

router.get('/', TaskController.getTasks);
router.post('/', TaskController.createTask);
router.patch('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);
router.patch('/:id/toggle', TaskController.toggleTask);

export default router;
