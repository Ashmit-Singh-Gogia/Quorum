export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('resources', {
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
        teacher_id: {
            type: 'uuid', references: '"users"', onDelete: 'SET NULL',
        },
        title: { type: 'varchar(255)', notNull: true },
        description: { type: 'text' },
        resource_type: { type: 'text' },
        storage_key: { type: 'text', notNull: true }, // R2 object key
        file_size: { type: 'bigint' },
        mime_type: { type: 'varchar(100)' },
        created_at: {
            type: 'timestamptz', notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};

export const down = (pgm) => {
    pgm.dropTable('resources');
};


// R2 bucket delete issue check