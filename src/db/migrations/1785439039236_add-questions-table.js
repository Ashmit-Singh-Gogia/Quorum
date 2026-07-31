export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('questions', {
        id: {
            type: 'uuid', primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        assignment_id: {
            type: 'uuid', notNull: true,
            references: '"assignments"', onDelete: 'CASCADE',
        },
        type: {
            type: 'text', notNull: true,
            check: "type IN ('mcq', 'text', 'github_link')",
        },
        prompt: { type: 'text', notNull: true },
        options: { type: 'jsonb' }, // only meaningful for mcq — null otherwise
        correct_answer: { type: 'text' },
        marks: { type: 'int', notNull: true },
        is_required: { type: 'boolean', notNull: true, default: true },
    });
};

export const down = (pgm) => {
    pgm.dropTable('questions');
};