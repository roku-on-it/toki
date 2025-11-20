import { relations } from "drizzle-orm/relations";
import { users, messages } from "./schema";

export const messagesRelations = relations(messages, ({one}) => ({
	user: one(users, {
		fields: [messages.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	messages: many(messages),
}));