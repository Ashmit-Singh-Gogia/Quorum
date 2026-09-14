import type { UUID } from 'node:crypto';
import pool from '../db/index.js';
import pino from 'pino';
const logger = pino();


// classrooom membership and roles will be check using middleware
export async function createPostService(author_id: UUID, classroom_id: UUID, course_id: UUID | null, type: string, title: string, body: string) {

    const createPostQuery = {
        text: 'Insert Into posts(author_id, classroom_id, course_id, type, title, body) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
        values: [author_id, classroom_id, course_id, type, title, body],
    }
    try {
        const res = await pool.query(createPostQuery)
        return res.rows[0].id
    } catch (err) {
        logger.error({ "error": err, "query": createPostQuery }, "Error while creating post")
        throw err
    }
}


export async function getPostsService(classroom_id: UUID, course_id: UUID | null) {
    let queryText = 'SELECT * FROM posts WHERE classroom_id = $1 ';
    const queryValues: UUID[] = [classroom_id];
    if (course_id) {
        queryText += 'AND course_id = $2 ';
        queryValues.push(course_id);
    }
    queryText += 'ORDER BY created_at DESC';
    const getPostsQuery = {
        text: queryText,
        values: queryValues,
    }
    try {
        const res = await pool.query(getPostsQuery)
        return res.rows
    } catch (err) {
        logger.error({ "error": err, "query": getPostsQuery }, "Error while fetching posts")
        throw err
    }
}



export async function togglePinnedPostService(post_id: UUID, classroom_id: UUID) {
    const togglePinnedPostQuery = {
        name: 'toggle-pinned-post',
        text: 'UPDATE posts SET is_pinned = NOT is_pinned WHERE id = $1 AND classroom_id = $2 RETURNING is_pinned',
        values: [post_id, classroom_id],
    }
    try {
        const res = await pool.query(togglePinnedPostQuery)
        return res.rows[0]
    } catch (err) {
        logger.error({ "error": err, "query": togglePinnedPostQuery }, "Error while pinning post")
        throw err
    }
}
