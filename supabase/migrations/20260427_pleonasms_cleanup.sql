-- Remove false pleonasm mistakes from exercise_results:
--   "столичная" or "московская" chosen for "столичная московская актриса"
--   "пернатые" or "птицы" chosen for "пернатые птицы"
-- Also adjusts correct/errors counts so totals stay consistent.

UPDATE exercise_results
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      details,
      '{mistakes}',
      COALESCE(
        (
          SELECT jsonb_agg(m)
          FROM jsonb_array_elements(details->'mistakes') AS m
          WHERE NOT (
            (m->>'display' = 'столичная московская актриса'
              AND m->>'chosen' IN ('столичная', 'московская'))
            OR
            (m->>'display' = 'пернатые птицы'
              AND m->>'chosen' IN ('пернатые', 'птицы'))
          )
        ),
        '[]'::jsonb
      )
    ),
    '{correct}',
    to_jsonb(
      COALESCE((details->>'correct')::int, 0) + (
        SELECT COUNT(*)::int
        FROM jsonb_array_elements(details->'mistakes') AS m
        WHERE (
          (m->>'display' = 'столичная московская актриса'
            AND m->>'chosen' IN ('столичная', 'московская'))
          OR
          (m->>'display' = 'пернатые птицы'
            AND m->>'chosen' IN ('пернатые', 'птицы'))
        )
      )
    )
  ),
  '{errors}',
  to_jsonb(
    GREATEST(0, COALESCE((details->>'errors')::int, 0) - (
      SELECT COUNT(*)::int
      FROM jsonb_array_elements(details->'mistakes') AS m
      WHERE (
        (m->>'display' = 'столичная московская актриса'
          AND m->>'chosen' IN ('столичная', 'московская'))
        OR
        (m->>'display' = 'пернатые птицы'
          AND m->>'chosen' IN ('пернатые', 'птицы'))
      )
    ))
  )
)
WHERE exercise_name = 'pleonasms'
  AND details->'mistakes' IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(details->'mistakes') AS m
    WHERE (
      (m->>'display' = 'столичная московская актриса'
        AND m->>'chosen' IN ('столичная', 'московская'))
      OR
      (m->>'display' = 'пернатые птицы'
        AND m->>'chosen' IN ('пернатые', 'птицы'))
    )
  );
