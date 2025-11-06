/*
  Warnings:

  - You are about to drop the `notification_channels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_templates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."notification_channels" DROP CONSTRAINT "notification_channels_notificationId_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "channels" JSONB;

-- DropTable
DROP TABLE "public"."notification_channels";

-- DropTable
DROP TABLE "public"."notification_preferences";

-- DropTable
DROP TABLE "public"."notification_templates";
