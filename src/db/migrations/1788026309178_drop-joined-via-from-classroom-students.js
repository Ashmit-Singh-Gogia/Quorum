export const shorthands = undefined;

export const up = (pgm) => {
    pgm.dropColumn('classroom_students', 'joined_via');
};

export const down = (pgm) => {
    pgm.addColumns('classroom_students', {
        joined_via: {
            type: 'text', notNull: true,
            default: 'join_code',
            check: "joined_via IN ('bulk_import', 'join_code')",
        },
    });
};
