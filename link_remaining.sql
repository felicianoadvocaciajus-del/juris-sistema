-- Link remaining documents using unaccent for accent-insensitive matching
WITH doc_folders AS (
  SELECT
    d.id as doc_id,
    split_part(split_part(replace(d."storagePath", chr(92), '/'), '/Documents/', 2), '/', 1) as folder_name
  FROM "Document" d
  WHERE d."personId" IS NULL AND d."storagePath" LIKE '%Documents%'
),
matches AS (
  SELECT DISTINCT ON (df.doc_id) df.doc_id, p.id as person_id
  FROM doc_folders df
  JOIN "Person" p ON (
    lower(unaccent(trim(p.name))) = lower(unaccent(trim(df.folder_name)))
    OR lower(unaccent(trim(p.name))) = lower(unaccent(trim(split_part(df.folder_name, ' - ', 1))))
    OR lower(unaccent(df.folder_name)) LIKE lower(unaccent(trim(p.name))) || ' -%'
    OR lower(unaccent(df.folder_name)) LIKE lower(unaccent(trim(p.name))) || ' %'
    OR (length(trim(p.name)) > 3 AND lower(unaccent(df.folder_name)) LIKE lower(unaccent(trim(p.name))) || '%')
  )
  ORDER BY df.doc_id, length(p.name) DESC
)
UPDATE "Document" d SET "personId" = m.person_id
FROM matches m WHERE d.id = m.doc_id;
