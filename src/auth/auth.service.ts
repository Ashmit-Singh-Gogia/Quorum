import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import cfg from '../config/env.js'
import pool from '../db/index.js'
import type { User } from '../common/types.js';
import { validateEmail, validateGlobalRole, validateName, validatePassword } from './auth.validation.js';
import type { UUID } from 'node:crypto';
import pino from "pino";
const logger = pino();

async function hashPassword(password: string): Promise<string> {
    const saltRounds = cfg.SALT;
    const salt = saltRounds
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
}

function generateToken(userId: string, role: string): string {
    let token: string = jwt.sign(
        { "userId": userId, "role": role },
        cfg.JWT_SECRET,
        { expiresIn: '1h' }
    )
    return token
}
export function verifyToken(token: string): { userId: string, role: string } | null {
    try {
        var decoded = jwt.verify(token, cfg.JWT_SECRET) as { userId: string, role: string };
        return { userId: decoded.userId, role: decoded.role };
    }
    catch (err) {
        return null;
    }
};


async function findUserByEmail(email: string): Promise<User | null> {

    const validationEmail: { error: Error | null; value: string } = validateEmail(email)
    if (validationEmail.error) {
        logger.error({ "email": email }, "Email is not valid")
        throw new Error("Email is not valid");
    }
    email = validationEmail.value

    logger.info({ email: email }, `finding email ${email}`);
    const query = {
        name: 'fetch-user',
        text: `SELECT * FROM users WHERE email = $1`,
        values: [email],
    }

    try {
        const res = await pool.query<User>(query)
        if (res.rowCount == 0) {
            logger.info({ "email": email }, `${email} not found`);
            return null;
        } else {
            logger.info({ "email": email }, `${email} found`);
            return res.rows[0] ?? null
        }
    } catch (err) {
        logger.error({ "email": email }, `Error while fetching email ${email}`);
        throw new Error(`Error fetching email ${email}`);
    }
}

export async function findUserById(userId: UUID): Promise<User | null> {
    const query = {
        name: 'fetch-user',
        text: 'SELECT * FROM users WHERE id = $1',
        values: [userId],
    }

    try {
        const res = await pool.query<User>(query)
        if (res.rowCount == 0) {
            logger.info({ "userId": userId }, `${userId} user not found`);
            return null;
        } else {
            logger.info({ "userId": userId }, `${userId} user found`);
            return res.rows[0] ?? null
        }
    } catch (err) {
        logger.error({ "user": userId }, `Error while fetching user with id ${userId}`);
        throw new Error(`Error fetching user${userId}`);
    }
}


async function verifyCredentials(email: string, password: string): Promise<User> {

    const user = await findUserByEmail(email)
    if (!user) {
        logger.error("Invalid Credentials")
        throw new Error("Invalid Credentials");
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
        logger.error({ 'verify': "user" }, "Invalid Credentials")
        throw new Error("Invalid Credentials");
    }
    return user
}

export async function createUser(name: string, email: string, password: string, global_role: string): Promise<{ id: number; name: string; email: string; global_role: string }> {

    const validationName: { error: Error | null; value: string } = validateName(name)
    if (validationName.error) {
        logger.error({ "username": name }, "name must be between 2 and 100 characters")
        throw new Error("user name is not Valid");
    }
    name = validationName.value

    const validationPassword: { error: Error | null; value: string } = validatePassword(password)
    if (validationPassword.error) {
        logger.error("Password must be between 8 and 72 characters")
        throw new Error("Password must be between 8 and 72 characters");
    }
    password = validationPassword.value
    const password_hash: string = await hashPassword(password)

    const validationEmail: { error: Error | null; value: string } = validateEmail(email)
    if (validationEmail.error) {
        logger.error({ "email": email }, "Email is not valid")
        throw new Error("Email is not valid");
    }
    email = validationEmail.value

    // Check for global role can be either student or teacher
    const validationGlobalRole: { error: Error | null; value: string } = validateGlobalRole(global_role)
    if (validationGlobalRole.error) {
        logger.error({ "global_role": global_role }, "Global role must be either 'student' or 'teacher'")
        throw new Error("Global role must be either 'student' or 'teacher'");
    }


    let user: User | null = await findUserByEmail(email)
    if (user != null) {
        logger.error("User already exists")
        throw new Error("User already exists");
    }

    const text = 'INSERT INTO users(name, email , password_hash , global_role) VALUES($1, $2, $3, $4) RETURNING *'
    const values = [name, email, password_hash, global_role]

    const res = await pool.query(text, values)
    logger.info("User created ")
    return { 'id': res.rows[0].id, 'name': name, 'email': email, 'global_role': global_role }
}

export async function login(email: string, password: string): Promise<{ user: { id: number; name: string; email: string; global_role: string; }; token: string }> {
    const user = await verifyCredentials(email, password)
    if (!user) {
        logger.error({ 'login': "user" }, "Login Failed")
        throw new Error("Login Failed");
    }

    const token: string = generateToken(user.id, user.global_role)
    return { user: { id: Number(user.id), name: user.name, email: user.email, global_role: user.global_role }, token }
}