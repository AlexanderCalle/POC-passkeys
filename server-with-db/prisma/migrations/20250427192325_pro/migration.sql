-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkeys" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "passkey_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "user_id" INTEGER NOT NULL,
    "webauthnUser_id" TEXT NOT NULL,
    "counter" BIGINT NOT NULL,
    "device_type" TEXT NOT NULL,
    "back_up" BOOLEAN NOT NULL,

    CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
