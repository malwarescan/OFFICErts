-- Add Message author XOR constraint
ALTER TABLE "Message" ADD CONSTRAINT "Message_author_xor" CHECK (("userId" IS NOT NULL) != ("seatId" IS NOT NULL));
