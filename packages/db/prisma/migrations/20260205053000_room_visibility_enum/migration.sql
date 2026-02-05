-- Create RoomVisibility enum and update Room.visibility
CREATE TYPE "RoomVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- Drop the default first
ALTER TABLE "Room" ALTER COLUMN "visibility" DROP DEFAULT;

-- Alter the Room.visibility column to use the enum
ALTER TABLE "Room" ALTER COLUMN "visibility" TYPE "RoomVisibility" USING "visibility"::"RoomVisibility";

-- Add the default back
ALTER TABLE "Room" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
