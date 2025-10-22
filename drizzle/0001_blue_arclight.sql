CREATE TABLE `assessmentSessions` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64),
	`stage` varchar(32) NOT NULL DEFAULT 'opening',
	`conversationCount` int NOT NULL DEFAULT 0,
	`conversationHistory` text,
	`scores` text,
	`result` text,
	`startTime` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `assessmentSessions_id` PRIMARY KEY(`id`)
);
