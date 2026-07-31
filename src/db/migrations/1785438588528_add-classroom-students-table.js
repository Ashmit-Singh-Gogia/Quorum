export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('classroom_students', {
        classroom_id: {
            type: 'uuid', notNull: true,
            references: '"classrooms"', onDelete: 'CASCADE',
        },
        student_id: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'CASCADE',
        },
        joined_via: {
            type: 'text', notNull: true,
            check: "joined_via IN ('bulk_import', 'join_code')",
        },
        joined_at: {
            type: 'timestamptz', notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.addConstraint('classroom_students', 'classroom_students_pk', {
        primaryKey: ['classroom_id', 'student_id'],
    });
};

export const down = (pgm) => {
    pgm.dropTable('classroom_students');
};