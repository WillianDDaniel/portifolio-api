import { Hono } from 'hono';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject 
} from '../controllers/projects.controller.js'
import { authMiddleware } from '../middlewares/auth.js';

const projects = new Hono();

projects.get('/', getProjects);
projects.get('/:id', getProjectById);

projects.post('/', authMiddleware, createProject);
projects.put('/:id', authMiddleware, updateProject);
projects.delete('/:id', authMiddleware, deleteProject);

export default projects;