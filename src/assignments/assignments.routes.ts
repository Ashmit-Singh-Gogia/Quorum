import { authenticate, checkClassMembership } from "../auth/auth.middleware.js";
import { authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
import { createAssignmentController, getAssignments, createQuestion, getQuestions, submitQuestion } from "./assignments.controller.js";
const router = Router();


router.post('/', authenticate, authorize('teacher', 'site_admin'), createAssignmentController)
router.post('/question', authenticate, authorize('teacher', 'site_admin'), createQuestion)
router.post('/submit', authenticate, authorize('student'), submitQuestion)
router.get('/:id', authenticate, checkClassMembership, getAssignments)
router.get('/:id/questions', authenticate, getQuestions)

export default router;