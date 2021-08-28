/* eslint-disable camelcase */

exports.shorthands = {};

const extensionSchema = 'polyglot_metrics';

exports.up = (pgm) => {
    pgm.createSchema(extensionSchema, { ifNotExists: true });
    pgm.sql('SET search_path TO ' + extensionSchema);
    pgm.sql('create extension IF NOT EXISTS  dblink');
};

exports.down = (pgm) => {};
