/* eslint-disable camelcase */

exports.shorthands = {};
const extensionSchema = 'polyglot_metrics';

exports.up = (pgm) => {
    pgm.createSchema(extensionSchema, { ifNotExists: true });
    pgm.sql('SET search_path TO ' + extensionSchema);

    pgm.createTable(
        { schema: extensionSchema, name: 'languages' },

        {
            id: {
                type: 'integer',
                sequenceGenerated: {
                    precedence: 'BY DEFAULT',
                },
                primaryKey: true,
            },
            language_tag: {
                type: 'character varying(255)',
                notNull: true,
            },
        }
    );
    pgm.createTable(
        { schema: extensionSchema, name: 'projects' },

        {
            id: {
                type: 'integer',
                sequenceGenerated: {
                    precedence: 'BY DEFAULT',
                },
                primaryKey: true,
            },
            slug: {
                type: 'character varying(255)',
                notNull: true,
            },
            deleted: {
                type: 'boolean',
                notNull: true,
                default: false,
            },
        }
    );

    pgm.createTable(
        { schema: extensionSchema, name: 'namespaces' },

        {
            id: {
                type: 'integer',
                sequenceGenerated: {
                    precedence: 'BY DEFAULT',
                },
                primaryKey: true,
            },
            project_id: {
                type: 'integer',
                notNull: true,
                references: 'projects',
                referencesConstraintName: 'FK_project_namespace',
            },
            name: {
                type: 'character varying(255)',
                notNull: true,
            },
            reference_url: {
                type: 'character varying(255)',
                notNull: true,
            },
        }
    );
    pgm.createTable(
        { schema: extensionSchema, name: 'translation_keys' },

        {
            id: {
                type: 'integer',
                sequenceGenerated: {
                    precedence: 'BY DEFAULT',
                },
                primaryKey: true,
            },
            namespace_id: {
                type: 'integer',
                notNull: true,
                references: 'namespaces',
                referencesConstraintName: 'FK_namespace_translation_key',
            },
            key: {
                type: 'character varying(255)',
                notNull: true,
            },
            reference_value: {
                type: 'character varying(2000)',
                notNull: true,
            },
        }
    );

    pgm.createTable(
        { schema: extensionSchema, name: 'translation_values' },

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
                referencesConstraintName: 'FK_translation_key_value',
            },
            language_id: {
                type: 'integer',
                notNull: true,
                references: 'languages',
                referencesConstraintName: 'FK_translation_language',
            },
            value: {
                type: 'character varying(2000)',
                notNull: true,
            },
        }
    );
};

exports.down = (pgm) => {
    pgm.dropSchema(extensionSchema, { cascade: true });
};
