/* eslint-disable camelcase */

exports.shorthands = {};
const extensionSchema = 'polyglot_metrics';

exports.up = (pgm) => {
    pgm.createSchema(extensionSchema, { ifNotExists: true });
    pgm.sql('SET search_path TO ' + extensionSchema);

    pgm.createTable(
        { schema: extensionSchema, name: 'translation_values_auto_translate' },

        {
            id: {
                type: 'integer',
                sequenceGenerated: {
                    precedence: 'BY DEFAULT',
                },
                primaryKey: true,
            },
            translation_key_id: {
                type: 'integer',
                notNull: true,
                references: 'translation_keys',
                referencesConstraintName: 'FK_translation_auto_t_value',
                //onDelete: 'cascade',
                deferrable: true,
                deferred: true,
            },
            language_id: {
                type: 'integer',
                notNull: true,
                references: 'languages',
                referencesConstraintName: 'FK_translation_language',
                deferrable: true,
                deferred: true,
            },
            value: {
                type: 'character varying(2000)',
                notNull: true,
            },
            reference_value: {
                type: 'character varying(2000)',
                notNull: true,
            },
        }
    );
    pgm.addConstraint(
        { schema: extensionSchema, name: 'translation_values_auto_translate' },
        'un_translation_values_auto_trans',
        'UNIQUE (translation_key_id,language_id)'
    );

    pgm.createTable(
        { schema: extensionSchema, name: 'translation_values_environments' },

        {
            id: {
                type: 'integer',
                sequenceGenerated: {
                    precedence: 'BY DEFAULT',
                },
                primaryKey: true,
            },
            translation_key_id: {
                type: 'integer',
                notNull: true,
                references: 'translation_keys',
                referencesConstraintName: 'FK_translation_key_env_value',
                //onDelete: 'cascade',
                //deferrable: true,
                //deferred: true
            },
            language_id: {
                type: 'integer',
                notNull: true,
                references: 'languages',
                referencesConstraintName: 'FK_translation_language',
                //deferrable: true,
                //deferred: true
            },
            value: {
                type: 'character varying(2000)',
                notNull: true,
            },
            environment: {
                type: 'character varying(30)',
                notNull: true,
            },
        }
    );
};

exports.down = (pgm) => {
    pgm.dropSchema(extensionSchema, { cascade: true });
};
