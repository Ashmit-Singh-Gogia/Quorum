import cfg from '../config/env.js'
import pg from 'pg'

const { Pool } = pg
const connectionString = cfg.DATABASE_URL

export default new Pool({
    connectionString,
})