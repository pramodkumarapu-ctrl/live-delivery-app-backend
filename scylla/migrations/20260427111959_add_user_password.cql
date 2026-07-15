-- Migration: add_user_password
-- Write your CQL here
ALTER TABLE user ADD password text;