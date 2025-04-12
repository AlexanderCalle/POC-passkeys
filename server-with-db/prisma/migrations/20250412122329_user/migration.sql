/*
  Warnings:

  - You are about to alter the column `counter` on the `passkeys` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_passkeys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "passkey_id" TEXT NOT NULL,
    "public_key" BLOB NOT NULL,
    "user_id" INTEGER NOT NULL,
    "webauthnUser_id" TEXT NOT NULL,
    "counter" BIGINT NOT NULL,
    "device_type" TEXT NOT NULL,
    "back_up" BOOLEAN NOT NULL,
    "devices" JSONB NOT NULL,
    CONSTRAINT "passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_passkeys" ("back_up", "counter", "device_type", "devices", "id", "passkey_id", "public_key", "user_id", "webauthnUser_id") SELECT "back_up", "counter", "device_type", "devices", "id", "passkey_id", "public_key", "user_id", "webauthnUser_id" FROM "passkeys";
DROP TABLE "passkeys";
ALTER TABLE "new_passkeys" RENAME TO "passkeys";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "devices" JSONB NOT NULL DEFAULT []
);
INSERT INTO "new_users" ("devices", "id", "name") SELECT "devices", "id", "name" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
