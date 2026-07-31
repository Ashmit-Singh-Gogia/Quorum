/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('users', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()')
        },
        name: { type: 'varchar(50)', notNull: true },
        email: { type: 'varchar(255)', notNull: true },
        password_hash: { type: 'varchar(255)', notNull: true },
        global_role: {
            type: 'text',
            notNull: true,
            check: "global_role IN ('site_admin', 'teacher', 'student')"
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.createIndex('users', pgm.func('lower(email)'), {
        name: 'users_email_lower_idx',
        unique: true,
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('users');
};
