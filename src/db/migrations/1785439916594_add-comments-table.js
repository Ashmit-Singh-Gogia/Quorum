export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('comments', {
        id: {
            type: 'uuid', primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        commentable_type: {
            type: 'text', notNull: true,
            check: "commentable_type IN ('post', 'assignment', 'resource')",
        },
        commentable_id: { type: 'uuid', notNull: true },
        parent_comment_id: {
            type: 'uuid',
            references: '"comments"', onDelete: 'SET NULL',
        },
        author_id: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'SET NULL',
        },
        body: { type: 'text', notNull: true },
        visibility: {
            type: 'text', notNull: true,
            check: "visibility IN ('public', 'private')",
        },
        created_at: {
            type: 'timestamptz', notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};

export const down = (pgm) => {
    pgm.dropTable('comments');
};