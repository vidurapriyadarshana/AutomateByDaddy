-- CreateTable
CREATE TABLE `IdempotencyEvent` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `eventKey` VARCHAR(255) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `eventType` VARCHAR(100) NOT NULL,
    `externalEventId` VARCHAR(255) NOT NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `IdempotencyEvent_eventKey_key`(`eventKey`),
    INDEX `IdempotencyEvent_provider_idx`(`provider`),
    INDEX `IdempotencyEvent_eventType_idx`(`eventType`),
    INDEX `IdempotencyEvent_processedAt_idx`(`processedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
