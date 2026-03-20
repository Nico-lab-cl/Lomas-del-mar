-- Script para agregar soporte de Chat (FB/IG) a la base de datos
-- Ejecuta este script en tu gestor de base de datos conectado a 'crm'

-- 1. Crear tabla Conversation
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "psid" TEXT NOT NULL UNIQUE,
    "platform" TEXT NOT NULL,
    "metaName" TEXT,
    "metaImage" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 2. Crear tabla Message
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "senderId" TEXT,
    "senderType" TEXT NOT NULL, 
    "sourceType" TEXT NOT NULL DEFAULT 'DIRECT', -- 'DIRECT' o 'COMMENT'
    "sourceId" TEXT, -- ID del mensaje o comentario en Meta
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Crear índices para mejorar velocidad de búsqueda
CREATE INDEX IF NOT EXISTS "Conversation_leadId_idx" ON "Conversation"("leadId");
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");
