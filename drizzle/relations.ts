import { relations } from "drizzle-orm/relations";
import { users, statusUpdates, matters, titleAnalyses, checklistItems, wireInstructions, teamMembers, documentSlots, matterParties, emailThreads, apiKeys, apiUsageLogs, webhooks, feeEstimates, cdReviews, hoaReviews } from "./schema";

export const statusUpdatesRelations = relations(statusUpdates, ({one}) => ({
	user: one(users, {
		fields: [statusUpdates.userId],
		references: [users.id]
	}),
	matter: one(matters, {
		fields: [statusUpdates.matterId],
		references: [matters.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	statusUpdates: many(statusUpdates),
	titleAnalyses: many(titleAnalyses),
	matters: many(matters),
	wireInstructions: many(wireInstructions),
	teamMembers_ownerId: many(teamMembers, {
		relationName: "teamMembers_ownerId_users_id"
	}),
	teamMembers_joinedUserId: many(teamMembers, {
		relationName: "teamMembers_joinedUserId_users_id"
	}),
	emailThreads: many(emailThreads),
	apiKeys_userId: many(apiKeys, {
		relationName: "apiKeys_userId_users_id"
	}),
	apiKeys_createdBy: many(apiKeys, {
		relationName: "apiKeys_createdBy_users_id"
	}),
	apiUsageLogs: many(apiUsageLogs),
	webhooks_userId: many(webhooks, {
		relationName: "webhooks_userId_users_id"
	}),
	webhooks_createdBy: many(webhooks, {
		relationName: "webhooks_createdBy_users_id"
	}),
	feeEstimates: many(feeEstimates),
	cdReviews: many(cdReviews),
	hoaReviews: many(hoaReviews),
}));

export const mattersRelations = relations(matters, ({one, many}) => ({
	statusUpdates: many(statusUpdates),
	titleAnalyses: many(titleAnalyses),
	user: one(users, {
		fields: [matters.userId],
		references: [users.id]
	}),
	checklistItems: many(checklistItems),
	wireInstructions: many(wireInstructions),
	documentSlots: many(documentSlots),
	matterParties: many(matterParties),
	emailThreads: many(emailThreads),
	feeEstimates: many(feeEstimates),
	cdReviews: many(cdReviews),
	hoaReviews: many(hoaReviews),
}));

export const titleAnalysesRelations = relations(titleAnalyses, ({one}) => ({
	user: one(users, {
		fields: [titleAnalyses.userId],
		references: [users.id]
	}),
	matter: one(matters, {
		fields: [titleAnalyses.matterId],
		references: [matters.id]
	}),
}));

export const checklistItemsRelations = relations(checklistItems, ({one}) => ({
	matter: one(matters, {
		fields: [checklistItems.matterId],
		references: [matters.id]
	}),
}));

export const wireInstructionsRelations = relations(wireInstructions, ({one}) => ({
	user: one(users, {
		fields: [wireInstructions.userId],
		references: [users.id]
	}),
	matter: one(matters, {
		fields: [wireInstructions.matterId],
		references: [matters.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	user_ownerId: one(users, {
		fields: [teamMembers.ownerId],
		references: [users.id],
		relationName: "teamMembers_ownerId_users_id"
	}),
	user_joinedUserId: one(users, {
		fields: [teamMembers.joinedUserId],
		references: [users.id],
		relationName: "teamMembers_joinedUserId_users_id"
	}),
}));

export const documentSlotsRelations = relations(documentSlots, ({one}) => ({
	matter: one(matters, {
		fields: [documentSlots.matterId],
		references: [matters.id]
	}),
}));

export const matterPartiesRelations = relations(matterParties, ({one}) => ({
	matter: one(matters, {
		fields: [matterParties.matterId],
		references: [matters.id]
	}),
}));

export const emailThreadsRelations = relations(emailThreads, ({one}) => ({
	matter: one(matters, {
		fields: [emailThreads.matterId],
		references: [matters.id]
	}),
	user: one(users, {
		fields: [emailThreads.userId],
		references: [users.id]
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({one, many}) => ({
	user_userId: one(users, {
		fields: [apiKeys.userId],
		references: [users.id],
		relationName: "apiKeys_userId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [apiKeys.createdBy],
		references: [users.id],
		relationName: "apiKeys_createdBy_users_id"
	}),
	apiUsageLogs: many(apiUsageLogs),
}));

export const apiUsageLogsRelations = relations(apiUsageLogs, ({one}) => ({
	apiKey: one(apiKeys, {
		fields: [apiUsageLogs.apiKeyId],
		references: [apiKeys.id]
	}),
	user: one(users, {
		fields: [apiUsageLogs.userId],
		references: [users.id]
	}),
}));

export const webhooksRelations = relations(webhooks, ({one}) => ({
	user_userId: one(users, {
		fields: [webhooks.userId],
		references: [users.id],
		relationName: "webhooks_userId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [webhooks.createdBy],
		references: [users.id],
		relationName: "webhooks_createdBy_users_id"
	}),
}));

export const feeEstimatesRelations = relations(feeEstimates, ({one}) => ({
	user: one(users, {
		fields: [feeEstimates.userId],
		references: [users.id]
	}),
	matter: one(matters, {
		fields: [feeEstimates.matterId],
		references: [matters.id]
	}),
}));

export const cdReviewsRelations = relations(cdReviews, ({one}) => ({
	user: one(users, {
		fields: [cdReviews.userId],
		references: [users.id]
	}),
	matter: one(matters, {
		fields: [cdReviews.matterId],
		references: [matters.id]
	}),
}));

export const hoaReviewsRelations = relations(hoaReviews, ({one}) => ({
	user: one(users, {
		fields: [hoaReviews.userId],
		references: [users.id]
	}),
	matter: one(matters, {
		fields: [hoaReviews.matterId],
		references: [matters.id]
	}),
}));