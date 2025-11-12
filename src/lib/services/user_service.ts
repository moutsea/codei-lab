import { cache, cacheTTL } from '@/lib/cache';
import { createUser, getUserByStripeCustomerId, getUserById, getUserByEmail, getUserDetailById, updateUserById, updateUserStripeCustomerId } from '@/db/queries';
import type { UserSelect } from '@/types/schema';
import type { UserDetail } from '@/types/db';
import type { AuthUserProfile } from '@/types';
import Stripe from 'stripe';

// ========== User Cache Keys (Only for UserDetail) ==========
const USER_CACHE_KEYS = {
    userDetail: (userId: string) => `user:id:${userId}:detail`,
};


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover',
});


// const customer = await stripe.customers.create({
//     email: user.email,
//     name: user.nickname || user.email,
//     metadata: {
//         userId: user.id,
//     },
// });
// const customerId = customer.id;

const normalizeEmail = (email?: string | null): string | null => {
    return email ? email.trim().toLowerCase() : null;
};

/**
 * Create a new user or update the existing record based on the auth provider payload.
 */
export const createOrUpdateUserFromAuthProfile = async (authUser: AuthUserProfile): Promise<UserSelect> => {
    if (!authUser?.id) {
        throw new Error('Auth user payload is missing required id');
    }

    const normalizedEmail = normalizeEmail(authUser.email);
    if (!normalizedEmail) {
        throw new Error('Auth user payload is missing required email address');
    }

    let user = await getUserById(authUser.id);

    if (!user && normalizedEmail) {
        user = await getUserByEmail(normalizedEmail);
        if (user) {
            console.log(`ℹ️ Found existing user by email for auth id ${authUser.id}`);
        }
    }

    if (!user) {
        user = await createUser({
            id: authUser.id,
            email: normalizedEmail,
            nickname: authUser.name ?? normalizedEmail,
            avatarUrl: authUser.image ?? null,
        });

        console.log(`✅ Created new user record: ${user.id}`);
        return user;
    }

    const updates: Partial<Omit<UserSelect, 'id' | 'createdAt'>> = {};

    if (normalizedEmail && normalizedEmail !== user.email) {
        updates.email = normalizedEmail;
    }

    if (authUser.name && authUser.name !== user.nickname) {
        updates.nickname = authUser.name;
    }

    if (authUser.image && authUser.image !== user.avatarUrl) {
        updates.avatarUrl = authUser.image;
    }

    if (Object.keys(updates).length === 0) {
        return user;
    }

    const updatedUser = await updateUserById(user.id, updates);

    if (updatedUser) {
        console.log(`✅ Updated user profile information: ${user.id}`);
        return updatedUser;
    }

    return user;
};

/**
 * Ensure the user has a Stripe customer ID, creating one if necessary.
 */
export const ensureStripeCustomerForUser = async (user: UserSelect): Promise<UserSelect> => {
    if (user.stripeCustomerId) {
        return user;
    }

    const customer = await stripe.customers.create({
        email: user.email,
        name: user.nickname || user.email,
        metadata: {
            userId: user.id,
        },
    });

    const updatedUser = await updateUserStripeCustomerId(user.id, customer.id);

    console.log(`✅ Created Stripe customer ${customer.id} for user ${user.id}`);

    return updatedUser ?? { ...user, stripeCustomerId: customer.id };
};

/**
 * Sync user data coming from auth providers and make sure the Stripe customer exists.
 */
export const syncUserFromAuthProfile = async (authUser: AuthUserProfile): Promise<UserSelect> => {
    const user = await createOrUpdateUserFromAuthProfile(authUser);
    return ensureStripeCustomerForUser(user);
};

/**
 * Get user by ID from database
 */
export const getUserFromDBById = async (id: string): Promise<UserSelect | null> => {
    try {
        const user = await getUserById(id);
        return user || null;
    } catch (error) {
        console.error('Database GET user by ID error:', error);
        return null;
    }
};


/**
 * Get user by Stripe customer ID from database
 */
export const getUserFromDBByStripeCustomerId = async (stripeCustomerId: string): Promise<UserSelect | null> => {
    try {
        const user = await getUserByStripeCustomerId(stripeCustomerId);
        return user || null;
    } catch (error) {
        console.error('Database GET user by Stripe customer ID error:', error);
        return null;
    }
};

// ========== User Detail Functions with Cache ==========

/**
 * Get user detail by userId with cache-first approach
 */
export const getUserDetailByIdWithCache = async (userId: string): Promise<UserDetail | null> => {
    const userDetail = await getUserDetailFromCache(userId);
    if (userDetail && userDetail.active) {
        return userDetail;
    }

    // Fallback to database
    try {
        const userDetail = await getUserDetailById(userId);

        if (userDetail && userDetail.active) {
            // Cache the user detail
            if (cache.isCacheEnabled()) {
                try {
                    const cacheKey = USER_CACHE_KEYS.userDetail(userId);
                    await cache.set(cacheKey, userDetail, cacheTTL.USER_DATA);
                    // console.log(`✅ Cached user detail for userId: ${userId}`);
                } catch (error) {
                    console.error('Cache SET user detail error:', error);
                }
            }
        }

        // console.log("=====userdetail from db=====", userDetail);
        return userDetail || null;

    } catch (error) {
        console.error('Database GET user detail error:', error);
        return null;
    }
};


/**
 * Get user detail by userId from cache only (skip database)
 */
export const getUserDetailFromCache = async (userId: string): Promise<UserDetail | null> => {
    if (!cache.isCacheEnabled()) {
        return null;
    }

    try {
        const cacheKey = USER_CACHE_KEYS.userDetail(userId);
        const cachedDetail = await cache.get(cacheKey) as UserDetail | null;
        return cachedDetail;
    } catch (error) {
        console.error('Cache GET user detail error:', error);
        return null;
    }
};

/**
 * Delete user detail cache by userId
 */
export const deleteUserDetailCache = async (userId: string): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = USER_CACHE_KEYS.userDetail(userId);
        await cache.delete(cacheKey);
        console.log(`✅ Deleted user detail cache for userId: ${userId}`);
    } catch (error) {
        console.error('Cache DELETE user detail error:', error);
    }
};

/**
 * Create or update user detail cache with smart merging
 * Only updates fields that are not null/undefined from the provided userDetail
 */
export const createOrUpdateUserDetailCache = async (userId: string, userDetail: Partial<UserDetail>): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = USER_CACHE_KEYS.userDetail(userId);

        // First, get existing cache data
        const existingDetail = await cache.get(cacheKey) as UserDetail | null;

        let finalDetail: UserDetail;

        if (existingDetail) {
            // Merge existing cache with new data (only update non-null fields)
            finalDetail = {
                ...existingDetail,
                userId: userDetail.userId !== undefined ? userDetail.userId : existingDetail.userId,
                name: userDetail.name !== undefined ? userDetail.name : existingDetail.name,
                email: userDetail.email !== undefined ? userDetail.email : existingDetail.email,
                stripeSubscriptionId: userDetail.stripeSubscriptionId !== undefined ? userDetail.stripeSubscriptionId : existingDetail.stripeSubscriptionId,
                planId: userDetail.planId !== undefined ? userDetail.planId : existingDetail.planId,
                membershipLevel: userDetail.membershipLevel !== undefined ? userDetail.membershipLevel : existingDetail.membershipLevel,
                active: userDetail.active !== undefined ? userDetail.active : existingDetail.active,
                currentEndAt: userDetail.currentEndAt !== undefined ? userDetail.currentEndAt : existingDetail.currentEndAt,
                quota: userDetail.quota !== undefined ? userDetail.quota : existingDetail.quota,
                quotaMonthlyUsed: userDetail.quotaMonthlyUsed !== undefined ? userDetail.quotaMonthlyUsed : existingDetail.quotaMonthlyUsed,
            };
            console.log(`✅ Merged and updated user detail cache for userId: ${userId}`);
        } else {
            // No existing cache data, create new entry with provided fields
            // Fill in default/undefined values for missing fields
            finalDetail = {
                userId: userDetail.userId !== undefined ? userDetail.userId : userId,
                name: userDetail.name || undefined,
                email: userDetail.email || undefined,
                stripeSubscriptionId: userDetail.stripeSubscriptionId || undefined,
                planId: userDetail.planId || undefined,
                stripeCustomerId: userDetail.stripeCustomerId!,
                membershipLevel: userDetail.membershipLevel || undefined,
                active: userDetail.active || false,
                currentEndAt: userDetail.currentEndAt !== undefined ? userDetail.currentEndAt : null,
                quota: userDetail.quota!,
                quotaMonthlyUsed: userDetail.quotaMonthlyUsed!,
                currency: userDetail.currency!
            };
            console.log(`✅ Created new user detail cache for userId: ${userId}`);
        }

        await cache.set(cacheKey, finalDetail, cacheTTL.USER_DATA);

    } catch (error) {
        console.error('Cache CREATE/UPDATE user detail error:', error);
    }
};

// ========== User Update Functions ==========

/**
 * Update user by ID with direct database access
 */
export const updateUserByIdService = async (
    id: string,
    data: Partial<Omit<UserSelect, 'id' | 'createdAt'>>
): Promise<UserSelect | null> => {
    try {
        const user = await updateUserById(id, data);
        if (user) {
            console.log(`✅ Updated user by ID: ${id}`);
        }
        return user;
    } catch (error) {
        console.error('Error updating user by ID:', error);
        return null;
    }
};


/**
 * Update user's Stripe customer ID
 */
export const updateUserStripeCustomerIdService = async (
    id: string,
    stripeCustomerId: string
): Promise<UserSelect | null> => {
    try {
        const user = await updateUserStripeCustomerId(id, stripeCustomerId);
        if (user) {
            console.log(`✅ Updated Stripe customer ID for user ${id}: ${stripeCustomerId}`);
        }
        return user;
    } catch (error) {
        console.error('Error updating user Stripe customer ID:', error);
        return null;
    }
};
