import { authenticate, checkClassMembership } from "../auth/auth.middleware.js";
import { authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
import { createCourse, getCourses } from "./courses.controller.js";

const router = Router();

router.post('/', authenticate, authorize('teacher', 'site_admin'), createCourse);
router.get('/:id', authenticate, checkClassMembership, getCourses);

export default router;