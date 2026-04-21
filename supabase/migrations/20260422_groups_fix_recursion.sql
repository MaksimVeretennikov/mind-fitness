-- Fix infinite recursion in RLS policies between groups and group_members.
--
-- Symptom: INSERT into groups (with PostgREST .select() returning the row)
-- returned HTTP 500 "infinite recursion detected in policy for relation".
--
-- Root cause: groups."Members can read their group" subqueried group_members,
-- and group_members."Owner reads members of own groups" subqueried groups.
-- Postgres could not build the plan because the subqueries cross-recursed.
--
-- Fix: drop the members→groups SELECT policy. It is redundant because the
-- "Anyone authenticated can read groups for join lookup" policy already
-- allows any authenticated user to SELECT groups (needed for join-by-code).
-- With that policy dropped, the owner-side policy on group_members does a
-- subquery into groups whose remaining SELECT policies have no cross
-- references, so no recursion.

DROP POLICY IF EXISTS "Members can read their group" ON groups;
