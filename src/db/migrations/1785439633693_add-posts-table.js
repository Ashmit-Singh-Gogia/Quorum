export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('posts', {
        id: {
            type: 'uuid', primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        classroom_id: {
            type: 'uuid', notNull: true,
            references: '"classrooms"', onDelete: 'CASCADE',
        },
        course_id: {
            type: 'uuid',
            references: '"courses"', onDelete: 'SET NULL',
        },
        author_id: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'SET NULL',
        },
        type: {
            type: 'text', notNull: true,
            check: "type IN ('notice', 'question', 'discussion')",
        },
        title: { type: 'varchar(255)', notNull: true },
        body: { type: 'text', notNull: true },
        is_pinned: { type: 'boolean', notNull: true, default: false },
        created_at: {
            type: 'timestamptz', notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};

export const down = (pgm) => {
    pgm.dropTable('posts');
};