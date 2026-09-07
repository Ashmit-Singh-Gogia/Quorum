import { authenticate, checkClassMembership } from "../auth/auth.middleware.js";
import { authorize } from "../auth/auth.middleware.js";
import { Router } from "express";
import { createAssignmentController, getAssignments, createQuestion, getQuestions, submitQuestion, getAssignmentSubmissions, gradeSubmission, publishDraft } from "./assignments.controller.js";
const router = Router();


// this route is to create an assignment with isPublished as default , so we need a separate route to publish the draft
router.post('/', authenticate, authorize('teacher', 'site_admin'), createAssignmentController)

// this route is to create a question
router.post('/question', authenticate, authorize('teacher', 'site_admin'), createQuestion)

// this route is to submit a question by a student 
router.post('/submit', authenticate, authorize('student'), submitQuestion)

// here id is classroom id and this route gives all the assignments for a classroom
router.get('/:id', authenticate, checkClassMembership, getAssignments)

// here id is assignment id and this route gives all the questions for a assignment along with ans for teacher role
router.get('/:id/questions', authenticate, getQuestions)

// here id is assignment id and this route gives all the submissions for a assignment along with the grade for student role
router.get('/:id/submissions', authenticate, getAssignmentSubmissions)

// here id is assignment id and this route allows a teacher to grade a submission and give marks and feedback
router.post('/:id/grade', authenticate, authorize('teacher', 'site_admin'), gradeSubmission)

// this route is to publish a draft assignment.
router.patch('/:id/publish', authenticate, authorize('teacher', 'site_admin'), publishDraft)
export default router;