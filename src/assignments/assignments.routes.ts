import { authenticate, checkClassMembership } from "../auth/auth.middleware.js";
import { authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
import { createAssignmentController, getAssignments } from "./assignments.controller.js";
const router = Router();


router.post('/', authenticate, authorize('teacher', 'site_admin'), createAssignmentController)
router.get('/:id', authenticate, checkClassMembership, getAssignments)

export default router;