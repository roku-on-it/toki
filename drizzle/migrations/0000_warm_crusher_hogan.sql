CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`body` text NOT NULL,
	`sent_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`secret_key` text NOT NULL,
	`avatar_url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_secret_key_unique` ON `users` (`secret_key`);