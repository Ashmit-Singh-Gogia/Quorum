export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('submissions', {
        id: {
            type: 'uuid', primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        question_id: {
            type: 'uuid', notNull: true,
            references: '"questions"', onDelete: 'CASCADE',
        },
        student_id: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'RESTRICT',
        },
        answer: { type: 'text' },
        is_late: { type: 'boolean', notNull: true, default: false },
        grading_status: {
            type: 'text', notNull: true, default: 'pending',
            check: "grading_status IN ('pending', 'graded')",
        },
        score: { type: 'int' },
        feedback: { type: 'text' },
        graded_at: { type: 'timestamptz' },
        submitted_at: {
            type: 'timestamptz', notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};

export const down = (pgm) => {
    pgm.dropTable('submissions');
};