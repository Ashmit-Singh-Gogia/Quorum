export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('courses', {
        id: {
            type: 'uuid', primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        classroom_id: {
            type: 'uuid', notNull: true,
            references: '"classrooms"', onDelete: 'CASCADE',
        },
        name: { type: 'varchar(100)', notNull: true },
        teacher_id: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'RESTRICT',
        },
    });
};

export const down = (pgm) => {
    pgm.dropTable('courses');
};