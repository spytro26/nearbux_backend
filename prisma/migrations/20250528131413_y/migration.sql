-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "isSolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
