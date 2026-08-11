import dotenv from 'dotenv'
dotenv.config();

function requiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required env variable : ${key}`)
    }
    return value;
}

export default {
    PORT: requiredEnv('PORT'),
    DATABASE_URL: requiredEnv('DATABASE_URL'),
    SALT: (Number)(requiredEnv('SALT')),
    JWT_SECRET: requiredEnv('JWT_SECRET')
}
