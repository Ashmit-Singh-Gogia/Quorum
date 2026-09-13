import { addCoTeacher, createClassRoom, regenerateJoinCode, getClassrooms, addStudent, getMembers } from "./classrooms.controller.js";
import { authenticate, checkClassMembership, checkOwnerShip } from "../auth/auth.middleware.js";
import { authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
const router = Router();

router.post('/', authenticate, authorize('teacher', 'site_admin'), createClassRoom);
// here id is classroom_id
router.post('/:id/teachers', authenticate, authorize('teacher', 'site_admin'), checkOwnerShip, addCoTeacher)
// here id is classroom_id
router.patch('/:id/join-code', authenticate, authorize('teacher', 'site_admin'), checkOwnerShip, regenerateJoinCode)
router.post('/join', authenticate, authorize('student'), addStudent)
// here id is classroom_id
router.get('/:id/members', authenticate, authorize('teacher', 'site_admin'), checkClassMembership, getMembers)
router.get('/mine', authenticate, getClassrooms)

export default router;