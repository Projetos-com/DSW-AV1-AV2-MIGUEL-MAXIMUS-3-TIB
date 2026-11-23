-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'USUARIO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'USUARIO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(60) NOT NULL,
    "patrimonio" VARCHAR(30) NOT NULL,
    "descricao" VARCHAR(500),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" SERIAL NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "finalidade" VARCHAR(200) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "equipamento_id" INTEGER NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_patrimonio_key" ON "equipamentos"("patrimonio");

-- CreateIndex
CREATE INDEX "reservas_equipamento_id_inicio_fim_idx" ON "reservas"("equipamento_id", "inicio", "fim");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
