import { addCoTeacher, createClassRoom, regenerateJoinCode, getClassrooms, addStudent, getMembers } from "./classrooms.controller.js";
import { authenticate, checkOwnerShip } from "../auth/auth.middleware.js";
import { authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
const router = Router();

router.post('/', authenticate, authorize('teacher', 'site_admin'), createClassRoom);
router.post('/:id/teachers', authenticate, authorize('teacher', 'site_admin'), checkOwnerShip, addCoTeacher)
router.patch('/:id/join-code', authenticate, authorize('teacher', 'site_admin'), checkOwnerShip, regenerateJoinCode)
router.post('/join', authenticate, authorize('student'), addStudent)
router.get('/:id/members', authenticate, authorize('teacher', 'site_admin'), checkOwnerShip, getMembers)
router.get('/mine', authenticate, getClassrooms)

export default router;