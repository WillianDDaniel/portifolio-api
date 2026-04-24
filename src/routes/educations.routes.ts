import { Hono } from 'hono';
import {
  getEducations,
  getEducationById,
  createEducation,
  updateEducation,
  deleteEducation
} from '../controllers/educations.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const educations = new Hono();

educations.get('/', getEducations);
educations.get('/:id', getEducationById);

educations.post('/', authMiddleware, createEducation);
educations.put('/:id', authMiddleware, updateEducation);
educations.delete('/:id', authMiddleware, deleteEducation);

export default educations;