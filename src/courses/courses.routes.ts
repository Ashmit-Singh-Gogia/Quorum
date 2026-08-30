import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
import { createCourse } from "./courses.controller.js";

const router = Router();

router.post('/', authenticate, authorize('teacher', 'site_admin'), createCourse);


export default router;