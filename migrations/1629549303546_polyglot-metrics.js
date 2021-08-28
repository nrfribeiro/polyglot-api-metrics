/* eslint-disable camelcase */

exports.shorthands = {};
const extensionSchema = 'polyglot_metrics';

exports.up = (pgm) => {
    pgm.createSchema(extensionSchema, { ifNotExists: true });
    pgm.sql('SET search_path TO ' + extensionSchema);

    pgm.createView(
        { schema: extensionSchema, name: 'project_pending_envs' },
        { replace: true },
        `SELECT a.id AS project_id,
        a.slug,
        b.id AS language_id,
        b.language_tag,
        envs.env,
        count(*) AS missing_keys
       FROM projects a,
        languages b,
        namespaces c,
        translation_keys d,
        translation_values e,
        ( SELECT 'preview'::text AS env
            UNION ALL
             SELECT 'live'::text AS env) envs
      WHERE a.id = c.project_id AND c.id = d.namespace_id AND d.id = e.translation_key_id AND NOT ((d.id, btrim(e.value::text), e.language_id, envs.env) IN ( SELECT f.translation_key_id,
                btrim(f.value::text) AS btrim,
                f.language_id,
                f.environment
               FROM translation_values_environments f)) AND e.language_id = b.id AND a.deleted <> true
      GROUP BY a.id, b.id, envs.env`
    );

    pgm.createView(
        { schema: extensionSchema, name: 'project_pending_words' },
        { replace: true },
        `SELECT proj.id AS project_id,
        proj.slug,
        c.id AS language_id,
        c.language_tag,
        sum(array_length(regexp_split_to_array(btrim(a.reference_value::text), '\W+'::text), 1)) AS pending_words
       FROM projects proj,
        namespaces nam,
        translation_keys a,
        translation_values b,
        languages c
      WHERE proj.id = nam.project_id AND nam.id = a.namespace_id AND a.id = b.translation_key_id AND b.language_id = c.id AND (b.value::text = ''::text OR b.value IS NULL)
      GROUP BY proj.id, proj.slug, c.id, c.language_tag`
    );
    pgm.createView(
        { schema: extensionSchema, name: 'projects_pending_translations' },
        { replace: true },
        `SELECT a.id AS project_id,
            a.slug,
            b.id AS language_id,
            b.language_tag,
            count(*) AS count
           FROM projects a,
            languages b,
            namespaces c,
            translation_keys d,
            translation_values e
          WHERE a.id = c.project_id AND b.id = e.language_id AND c.id = d.namespace_id AND d.id = e.translation_key_id AND (e.value::text = ''::text OR e.value IS NULL) AND a.deleted <> true
          GROUP BY a.id, b.id
          ORDER BY a.id, b.id`
    );
    pgm.createView(
        { schema: extensionSchema, name: 'projects_summary' },
        { replace: true },
        `WITH pending_translations AS (
                    SELECT b1.project_id,
                       b3.language_id,
                       count(*) AS pending
                      FROM namespaces b1,
                       translation_keys b2,
                       translation_values b3
                     WHERE b1.id = b2.namespace_id AND b2.id = b3.translation_key_id AND (b3.value::text = ''::text OR b3.value IS NULL)
                     GROUP BY b1.project_id, b3.language_id
                   ), missing_keys_env AS (
                    SELECT a_1.project_id,
                       c_1.language_id,
                       envs.env,
                       count(*) AS missing_keys
                      FROM namespaces a_1,
                       translation_keys b_1,
                       translation_values c_1,
                       ( SELECT 'preview'::text AS env
                           UNION ALL
                            SELECT 'live'::text AS env) envs
                     WHERE a_1.id = b_1.namespace_id AND b_1.id = c_1.translation_key_id AND NOT ((b_1.id, btrim(c_1.value::text), c_1.language_id, envs.env) IN ( SELECT d_1.translation_key_id,
                               btrim(d_1.value::text) AS btrim,
                               d_1.language_id,
                               d_1.environment
                              FROM translation_values_environments d_1))
                     GROUP BY a_1.project_id, c_1.language_id, envs.*, envs.env
                   ), project_summary_base AS (
                    SELECT a.id,
                       a.slug,
                       ( SELECT count(*) AS count
                              FROM namespaces a1,
                               translation_keys a2
                             WHERE a1.project_id = a.id AND a1.id = a2.namespace_id) AS total_keys,
                       COALESCE(( SELECT pending_translations.pending
                              FROM pending_translations
                             WHERE pending_translations.project_id = a.id AND pending_translations.language_id = b.id), 0::bigint) AS en_us_pending_translation,
                       COALESCE(( SELECT pending_translations.pending
                              FROM pending_translations
                             WHERE pending_translations.project_id = a.id AND pending_translations.language_id = c.id), 0::bigint) AS pt_pt_pending_translation,
                       COALESCE(( SELECT pending_translations.pending
                              FROM pending_translations
                             WHERE pending_translations.project_id = a.id AND pending_translations.language_id = d.id), 0::bigint) AS fr_fr_pending_translation,
                       COALESCE(( SELECT pending_translations.pending
                              FROM pending_translations
                             WHERE pending_translations.project_id = a.id AND pending_translations.language_id = e.id), 0::bigint) AS fr_ca_pending_translation,
                       COALESCE(( SELECT pending_translations.pending
                              FROM pending_translations
                             WHERE pending_translations.project_id = a.id AND pending_translations.language_id = f.id), 0::bigint) AS es_es_pending_translation,
                       COALESCE(( SELECT pending_translations.pending
                              FROM pending_translations
                             WHERE pending_translations.project_id = a.id AND pending_translations.language_id = g.id), 0::bigint) AS it_it_pending_translation,
                       COALESCE(( SELECT pending_translations.pending
                              FROM pending_translations
                             WHERE pending_translations.project_id = a.id AND pending_translations.language_id = h.id), 0::bigint) AS de_de_pending_translation,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = b.id AND missing_keys_env.env = 'preview'::text), 0::bigint) AS qa_en_us_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = b.id AND missing_keys_env.env = 'live'::text), 0::bigint) AS prd_en_us_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = c.id AND missing_keys_env.env = 'preview'::text), 0::bigint) AS qa_pt_pt_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = c.id AND missing_keys_env.env = 'live'::text), 0::bigint) AS prd_pt_pt_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = d.id AND missing_keys_env.env = 'preview'::text), 0::bigint) AS qa_fr_fr_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = d.id AND missing_keys_env.env = 'live'::text), 0::bigint) AS prd_fr_fr_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = e.id AND missing_keys_env.env = 'preview'::text), 0::bigint) AS qa_fr_ca_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = e.id AND missing_keys_env.env = 'live'::text), 0::bigint) AS prd_fr_ca_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = f.id AND missing_keys_env.env = 'preview'::text), 0::bigint) AS qa_es_es_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = f.id AND missing_keys_env.env = 'live'::text), 0::bigint) AS prd_es_es_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = g.id AND missing_keys_env.env = 'preview'::text), 0::bigint) AS qa_it_it_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = g.id AND missing_keys_env.env = 'live'::text), 0::bigint) AS prd_it_it_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = h.id AND missing_keys_env.env = 'preview'::text), 0::bigint) AS qa_de_de_missing,
                       COALESCE(( SELECT missing_keys_env.missing_keys
                              FROM missing_keys_env
                             WHERE missing_keys_env.project_id = a.id AND missing_keys_env.language_id = h.id AND missing_keys_env.env = 'live'::text), 0::bigint) AS prd_de_de_missing
                      FROM projects a,
                       ( SELECT en.id,
                               en.language_tag
                              FROM languages en
                             WHERE en.language_tag::text = 'en-US'::text) b,
                       ( SELECT en.id,
                               en.language_tag
                              FROM languages en
                             WHERE en.language_tag::text = 'pt-PT'::text) c,
                       ( SELECT en.id,
                               en.language_tag
                              FROM languages en
                             WHERE en.language_tag::text = 'fr-FR'::text) d,
                       ( SELECT en.id,
                               en.language_tag
                              FROM languages en
                             WHERE en.language_tag::text = 'fr-CA'::text) e,
                       ( SELECT en.id,
                               en.language_tag
                              FROM languages en
                             WHERE en.language_tag::text = 'es-ES'::text) f,
                       ( SELECT en.id,
                               en.language_tag
                              FROM languages en
                             WHERE en.language_tag::text = 'it-IT'::text) g,
                       ( SELECT en.id,
                               en.language_tag
                              FROM languages en
                             WHERE en.language_tag::text = 'de-DE'::text) h
                     WHERE a.deleted <> true
                   ), project_summary_final AS (
                    SELECT project_summary_base.id,
                       project_summary_base.slug,
                       project_summary_base.total_keys,
                       project_summary_base.en_us_pending_translation,
                       project_summary_base.pt_pt_pending_translation,
                       project_summary_base.fr_fr_pending_translation,
                       project_summary_base.fr_ca_pending_translation,
                       project_summary_base.es_es_pending_translation,
                       project_summary_base.it_it_pending_translation,
                       project_summary_base.de_de_pending_translation,
                       project_summary_base.qa_en_us_missing,
                       project_summary_base.prd_en_us_missing,
                       project_summary_base.qa_pt_pt_missing,
                       project_summary_base.prd_pt_pt_missing,
                       project_summary_base.qa_fr_fr_missing,
                       project_summary_base.prd_fr_fr_missing,
                       project_summary_base.qa_fr_ca_missing,
                       project_summary_base.prd_fr_ca_missing,
                       project_summary_base.qa_es_es_missing,
                       project_summary_base.prd_es_es_missing,
                       project_summary_base.qa_it_it_missing,
                       project_summary_base.prd_it_it_missing,
                       project_summary_base.qa_de_de_missing,
                       project_summary_base.prd_de_de_missing,
                           CASE
                               WHEN project_summary_base.prd_de_de_missing = 0 AND project_summary_base.prd_en_us_missing = 0 AND project_summary_base.prd_es_es_missing = 0 AND project_summary_base.prd_fr_ca_missing = 0 AND project_summary_base.prd_fr_fr_missing = 0 AND project_summary_base.prd_it_it_missing = 0 AND project_summary_base.prd_pt_pt_missing = 0 THEN 'OK'::text
                               ELSE 'NOK'::text
                           END AS prd_status,
                           CASE
                               WHEN project_summary_base.qa_de_de_missing = 0 AND project_summary_base.qa_en_us_missing = 0 AND project_summary_base.qa_es_es_missing = 0 AND project_summary_base.qa_fr_ca_missing = 0 AND project_summary_base.qa_fr_fr_missing = 0 AND project_summary_base.qa_it_it_missing = 0 AND project_summary_base.qa_pt_pt_missing = 0 THEN 'OK'::text
                               ELSE 'NOK'::text
                           END AS qa_status,
                           CASE
                               WHEN project_summary_base.de_de_pending_translation = 0 AND project_summary_base.en_us_pending_translation = 0 AND project_summary_base.es_es_pending_translation = 0 AND project_summary_base.fr_ca_pending_translation = 0 AND project_summary_base.fr_fr_pending_translation = 0 AND project_summary_base.it_it_pending_translation = 0 AND project_summary_base.pt_pt_pending_translation = 0 THEN 'OK'::text
                               ELSE 'NOK'::text
                           END AS polyglot_status
                      FROM project_summary_base
                   )
            SELECT project_summary_final.id AS project_id,
               project_summary_final.slug,
               project_summary_final.total_keys,
                   CASE
                       WHEN project_summary_final.prd_status = 'OK'::text AND project_summary_final.qa_status = 'OK'::text AND project_summary_final.polyglot_status = 'OK'::text THEN 'OK'::text
                       ELSE 'NOK'::text
                   END AS overall_status,
               project_summary_final.prd_status,
               project_summary_final.qa_status,
               project_summary_final.polyglot_status,
               project_summary_final.en_us_pending_translation,
               project_summary_final.pt_pt_pending_translation,
               project_summary_final.fr_fr_pending_translation,
               project_summary_final.fr_ca_pending_translation,
               project_summary_final.es_es_pending_translation,
               project_summary_final.it_it_pending_translation,
               project_summary_final.de_de_pending_translation,
               project_summary_final.qa_en_us_missing,
               project_summary_final.prd_en_us_missing,
               project_summary_final.qa_pt_pt_missing,
               project_summary_final.prd_pt_pt_missing,
               project_summary_final.qa_fr_fr_missing,
               project_summary_final.prd_fr_fr_missing,
               project_summary_final.qa_fr_ca_missing,
               project_summary_final.prd_fr_ca_missing,
               project_summary_final.qa_es_es_missing,
               project_summary_final.prd_es_es_missing,
               project_summary_final.qa_it_it_missing,
               project_summary_final.prd_it_it_missing,
               project_summary_final.qa_de_de_missing,
               project_summary_final.prd_de_de_missing
              FROM project_summary_final`
    );
    pgm.createView(
        { schema: extensionSchema, name: 'translations_summary' },
        { replace: true },
        `SELECT a.id AS project_id,
                    a.slug,
                    h.id AS language_id,
                    h.language_tag,
                    b.name AS namespace,
                    c.key,
                    btrim(c.reference_value::text) AS reference_value,
                    btrim(d.value::text) AS poliglot_value,
                    btrim(e.value::text) AS qa_value,
                    btrim(f.value::text) AS prd_value,
                    btrim(g.value::text) AS auto_translate,
                        CASE
                            WHEN btrim(d.value::text) = btrim(e.value::text) THEN false
                            ELSE true
                        END AS qa_pending,
                        CASE
                            WHEN btrim(d.value::text) = btrim(f.value::text) THEN false
                            ELSE true
                        END AS prd_pending
                   FROM projects a
                     JOIN namespaces b ON a.id = b.project_id
                     JOIN translation_keys c ON b.id = c.namespace_id
                     JOIN translation_values d ON c.id = d.translation_key_id
                     LEFT JOIN translation_values_environments e ON d.translation_key_id = e.translation_key_id AND d.language_id = e.language_id AND e.environment::text = 'preview'::text
                     LEFT JOIN translation_values_environments f ON d.translation_key_id = f.translation_key_id AND d.language_id = f.language_id AND f.environment::text = 'live'::text
                     LEFT JOIN translation_values_auto_translate g ON d.translation_key_id = g.translation_key_id AND d.language_id = g.language_id
                     JOIN languages h ON d.language_id = h.id`
    );
};

exports.down = (pgm) => {
    pgm.dropSchema(extensionSchema, { cascade: true });
};
