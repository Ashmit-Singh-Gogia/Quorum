export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('assignments', {
        id: {
            type: 'uuid', primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        classroom_id: {
            type: 'uuid', notNull: true,
            references: '"classrooms"', onDelete: 'CASCADE',
        },
        course_id: {
            type: 'uuid', // nullable — classroom-wide assignments are possible
            references: '"courses"', onDelete: 'SET NULL',
        },
        title: { type: 'varchar(255)', notNull: true },
        description: { type: 'text' },
        deadline: { type: 'timestamptz', notNull: true },
        is_published: { type: 'boolean', notNull: true, default: false },
        created_by: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'RESTRICT',
        },
    });
};

export const down = (pgm) => {
    pgm.dropTable('assignments');
};