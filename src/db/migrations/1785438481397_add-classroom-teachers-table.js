export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('classroom_teachers', {
        classroom_id: {
            type: 'uuid', notNull: true,
            references: '"classrooms"', onDelete: 'CASCADE',
        },
        teacher_id: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'CASCADE',
        },
        standing: {
            type: 'text', notNull: true,
            check: "standing IN ('owner', 'co_teacher')",
        },
    });

    pgm.addConstraint('classroom_teachers', 'classroom_teachers_pk', {
        primaryKey: ['classroom_id', 'teacher_id'],
    });

    // exactly one owner per classroom — the partial unique index
    pgm.createIndex('classroom_teachers', 'classroom_id', {
        name: 'one_owner_per_classroom',
        unique: true,
        where: "standing = 'owner'",
    });
};

export const down = (pgm) => {
    pgm.dropTable('classroom_teachers');
};