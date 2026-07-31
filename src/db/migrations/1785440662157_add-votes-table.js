export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('votes', {
        id: {
            type: 'uuid', primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        user_id: {
            type: 'uuid', notNull: true,
            references: '"users"', onDelete: 'CASCADE',
        },
        target_id: { type: 'uuid', notNull: true }, // no FK — polymorphic, same as comments
        target_type: {
            type: 'text', notNull: true,
            check: "target_type IN ('post', 'comment')",
        },
        value: {
            type: 'int', notNull: true,
            check: 'value IN (1, -1)', // upvote / downvote
        },
    });

    pgm.addConstraint('votes', 'one_vote_per_user_per_target', {
        unique: ['user_id', 'target_id', 'target_type'],
    });
};

export const down = (pgm) => {
    pgm.dropTable('votes');
};