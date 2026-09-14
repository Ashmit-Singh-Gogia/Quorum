import { authenticate, checkClassMembership, authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
import { createPost, getPosts, togglePinnedPost } from "./posts.controller.js";
const router = Router();
// here id is classroom_id
router.post('/:id', authenticate, authorize('teacher', 'site_admin'), checkClassMembership, createPost);
// here id is classroom_id
router.get('/:id', authenticate, checkClassMembership, getPosts);
// here id is classroom_id
router.patch('/pin/:id', authenticate, authorize('teacher', 'site_admin'), checkClassMembership, togglePinnedPost);


export default router