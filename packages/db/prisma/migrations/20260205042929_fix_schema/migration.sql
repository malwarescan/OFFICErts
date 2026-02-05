-- Add missing fields to User and Room models
ALTER TABLE "User" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Room" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
