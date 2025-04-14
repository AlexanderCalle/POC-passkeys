/*
  Warnings:

  - You are about to drop the column `devices` on the `passkeys` table. All the data in the column will be lost.
  - You are about to drop the column `devices` on the `users` table. All the data in the column will be lost.

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
    CONSTRAINT "passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_passkeys" ("back_up", "counter", "device_type", "id", "passkey_id", "public_key", "user_id", "webauthnUser_id") SELECT "back_up", "counter", "device_type", "id", "passkey_id", "public_key", "user_id", "webauthnUser_id" FROM "passkeys";
DROP TABLE "passkeys";
ALTER TABLE "new_passkeys" RENAME TO "passkeys";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "username" TEXT NOT NULL
);
INSERT INTO "new_users" ("id", "name", "username") SELECT "id", "name", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
