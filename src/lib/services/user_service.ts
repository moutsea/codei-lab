import { cache, cacheTTL } from '@/lib/cache';
import { createUserFromAuth0, getUserByStripeCustomerId, getUserById, getUserByAuth0Id, getUserDetailById, updateUserById, updateUserByAuth0Id, updateUserStripeCustomerId } from '@/db/queries';
import type { UserSelect } from '@/db/schema';
import type { UserDetail } from '@/db/queries/users';
import Stripe from 'stripe';
import { currentDate, currentMonth } from '../utils';

// ========== User Cache Keys (Only for UserDetail) ==========
const USER_CACHE_KEYS = {
    userDetail: (userId: number) => `user:id:${userId}:detail`,
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover',
});



/**
 * Create user in database with Auth0 data
 */
export const createUserFromDBByAuth0 = async (auth0Data: {
    auth0UserId: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
}): Promise<UserSelect | null> => {
    try {
        // Create user in database
        const user = await createUserFromAuth0(auth0Data);

        if (!user) {
            console.error('Failed to create user in database');
            return null;
        }

        console.log(`✅ Created user: ${user.auth0UserId}`);
        return user;

    } catch (error) {
        console.error('Error creating user from Auth0:', error);
        return null;
    }
};

/**
 * Get user by ID from database
 */
export const getUserFromDBById = async (id: number): Promise<UserSelect | null> => {
    try {
        const user = await getUserById(id);
        return user || null;
    } catch (error) {
        console.error('Database GET user by ID error:', error);
        return null;
    }
};

/**
 * Get user by Auth0 ID from database
 */
export const getUserFromDBByAuth0 = async (auth0UserId: string): Promise<UserSelect | null> => {
    try {
        const user = await getUserByAuth0Id(auth0UserId);
        return user || null;
    } catch (error) {
        console.error('Database GET user by Auth0 ID error:', error);
        return null;
    }
};

/**
 * Get user by Auth0 ID from database
 */
export const getUserFromDBByStripeCustomerId = async (stripeCustomerId: string): Promise<UserSelect | null> => {
    try {
        const user = await getUserByStripeCustomerId(stripeCustomerId);
        return user || null;
    } catch (error) {
        console.error('Database GET user by Auth0 ID error:', error);
        return null;
    }
};


/**
 * Get Auth0 user ID by database user ID from database
 */
export const getAuth0UserIdByUserId = async (userId: number): Promise<string | null> => {
    try {
        const user = await getUserById(userId);

        if (user && user.auth0UserId) {
            return user.auth0UserId;
        }

        return null;
    } catch (error) {
        console.error('Database GET user by ID error:', error);
        return null;
    }
};

/**
 * Get database user ID by Auth0 user ID from database
 */
export const getUserIdByAuth0UserId = async (auth0UserId: string): Promise<number | null> => {
    try {
        const user = await getUserByAuth0Id(auth0UserId);

        if (user && user.id) {
            return user.id;
        }

        return null;
    } catch (error) {
        console.error('Database GET user by Auth0 ID error:', error);
        return null;
    }
};

// ========== User Detail Functions with Cache ==========

/**
 * Get user detail by userId with cache-first approach
 */
export const getUserDetailByIdWithCache = async (userId: number): Promise<UserDetail | null> => {
    const userDetail = await getUserDetailFromCache(userId);
    if (userDetail && userDetail.active) {
        // console.log("=====userdetail from cache=====\n", userDetail);
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
 * Get user detail by auth0UserId with cache-first approach
 */
export const getUserDetailByAuth0IdWithCache = async (auth0UserId: string): Promise<UserDetail | null> => {
    const userId = await getUserIdByAuth0UserId(auth0UserId);

    if (userId) {
        return getUserDetailById(userId);
    }
    return null;
};

/**
 * Get user detail by userId from cache only (skip database)
 */
export const getUserDetailFromCache = async (userId: number): Promise<UserDetail | null> => {
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
export const deleteUserDetailCache = async (userId: number): Promise<void> => {
    if (!cache.isCacheEnabled()) return;

    try {
        const cacheKey = USER_CACHE_KEYS.userDetail(userId);
        await cache.delete(cacheKey);
        console.log(`✅ Deleted user detail cache for userId: ${userId}`);
    } catch (error) {
        console.error('Cache DELETE user detail error:', error);
    }
};

export const deleteUserDetailCacheByAuth0Id = async (auth0Id: string) => {
    const userId = await getUserIdByAuth0UserId(auth0Id);
    if (!userId) {
        return null;
    }
    return await deleteUserDetailCache(userId);
}

/**
 * Create or update user detail cache with smart merging
 * Only updates fields that are not null/undefined from the provided userDetail
 */
export const createOrUpdateUserDetailCache = async (userId: number, userDetail: Partial<UserDetail>): Promise<void> => {
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
                auth0UserId: userDetail.auth0UserId !== undefined ? userDetail.auth0UserId : existingDetail.auth0UserId,
                stripeSubscriptionId: userDetail.stripeSubscriptionId !== undefined ? userDetail.stripeSubscriptionId : existingDetail.stripeSubscriptionId,
                // stripeCustomerId: userDetail.stripeCustomerId !== undefined ? userDetail.stripeCustomerId : existingDetail.stripeCustomerId,
                planId: userDetail.planId !== undefined ? userDetail.planId : existingDetail.planId,
                membershipLevel: userDetail.membershipLevel !== undefined ? userDetail.membershipLevel : existingDetail.membershipLevel,
                active: userDetail.active !== undefined ? userDetail.active : existingDetail.active,
                currentEndAt: userDetail.currentEndAt !== undefined ? userDetail.currentEndAt : existingDetail.currentEndAt,
                requestLimit: userDetail.requestLimit !== undefined ? userDetail.requestLimit : existingDetail.requestLimit,
                tokenMonthlyUsed: userDetail.tokenMonthlyUsed !== undefined ? userDetail.tokenMonthlyUsed : existingDetail.tokenMonthlyUsed,
            };
            console.log(`✅ Merged and updated user detail cache for userId: ${userId}`);
        } else {
            // No existing cache data, create new entry with provided fields
            // Fill in default/undefined values for missing fields
            finalDetail = {
                userId: userDetail.userId !== undefined ? userDetail.userId : userId,
                name: userDetail.name || undefined,
                email: userDetail.email || undefined,
                auth0UserId: userDetail.auth0UserId || '',
                stripeSubscriptionId: userDetail.stripeSubscriptionId || undefined,
                planId: userDetail.planId || undefined,
                stripeCustomerId: userDetail.stripeCustomerId!,
                membershipLevel: userDetail.membershipLevel || undefined,
                active: userDetail.active || false,
                currentEndAt: userDetail.currentEndAt !== undefined ? userDetail.currentEndAt : null,
                requestLimit: userDetail.requestLimit!,
                tokenMonthlyUsed: userDetail.tokenMonthlyUsed!,
            };
            console.log(`✅ Created new user detail cache for userId: ${userId}`);
        }

        await cache.set(cacheKey, finalDetail, cacheTTL.USER_DATA);

    } catch (error) {
        console.error('Cache CREATE/UPDATE user detail error:', error);
    }
};

/**
 * Create or update user detail cache by auth0UserId with smart merging
 * Only updates fields that are not null/undefined from the provided userDetail
 */
export const createOrUpdateUserDetailCacheByAuth0Id = async (auth0UserId: string, userDetail: Partial<UserDetail>): Promise<void> => {
    const userId = await getUserIdByAuth0UserId(auth0UserId);

    if (userId) {
        createOrUpdateUserDetailCache(userId, userDetail);
    }
};

// ========== User Update Functions ==========

/**
 * Update user by ID with direct database access
 */
export const updateUserByIdService = async (
    id: number,
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
 * Update user by Auth0 ID with direct database access
 */
export const updateUserByAuth0IdService = async (
    auth0UserId: string,
    data: Partial<Omit<UserSelect, 'id' | 'createdAt'>>
): Promise<UserSelect | null> => {
    try {
        const user = await updateUserByAuth0Id(auth0UserId, data);
        if (user) {
            console.log(`✅ Updated user by Auth0 ID: ${auth0UserId}`);
        }
        return user;
    } catch (error) {
        console.error('Error updating user by Auth0 ID:', error);
        return null;
    }
};

/**
 * Update user's Stripe customer ID
 */
export const updateUserStripeCustomerIdService = async (
    id: number,
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

/**
 * Get user's Stripe customer ID by Auth0 user ID
 * Returns null if user doesn't exist or doesn't have a Stripe customer ID
 */
export const getStripeCustomerIdByAuth0Id = async (auth0UserId: string): Promise<string | null> => {
    if (!auth0UserId) return null;
    try {
        const user = await getUserByAuth0Id(auth0UserId);

        if (!user) {
            console.log(`❌ User not found for Auth0 ID: ${auth0UserId}`);
            return null;
        }

        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }

        const customer = await stripe.customers.create({
            email: user.email,
            name: user.nickname || user.email,
            metadata: {
                userId: user.id.toString(),
                auth0UserId: user.auth0UserId,
            },
        });
        const customerId = customer.id;
        const newUser = await updateUserStripeCustomerId(user.id, customerId);

        return newUser?.stripeCustomerId || customerId;

    } catch (error) {
        console.error(`Error getting Stripe customer ID for Auth0 user ${auth0UserId}:`, error);
        return null;
    }
};

/**
 * Create or update user by Auth0 ID
 * If user exists, updates their information with the latest Auth0 data
 * If user doesn't exist, creates a new user
 */
export const createOrUpdateUserByAuth0Id = async (auth0Data: {
    auth0UserId: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
}): Promise<{ user: UserSelect | null; isNewUser: boolean }> => {
    const { auth0UserId, email, nickname, avatarUrl } = auth0Data;

    if (!auth0UserId || !email) {
        console.error('❌ Auth0 user ID and email are required');
        return { user: null, isNewUser: false };
    }

    try {
        // Check if user already exists
        let existingUser = await getUserByAuth0Id(auth0UserId);
        let isNewUser = false;

        if (!existingUser) {
            // Create new user
            const userIdPart = auth0UserId.split('|')[1] || 'unknown';

            const userDataToCreate = {
                auth0UserId,
                email: email.trim() !== '' ? email : `${userIdPart}@placeholder.local`,
                nickname: nickname || email?.split('@')[0] || 'User' + userIdPart.slice(-8),
                avatarUrl: avatarUrl || undefined,
            };

            console.log(`Creating new user for Auth0 ID: ${auth0UserId}`);
            existingUser = await createUserFromDBByAuth0(userDataToCreate);
            isNewUser = true;

            if (existingUser) {
                console.log(`✅ Successfully created new user with ID: ${existingUser.id}`);
            }
        } else {
            // Update existing user with latest Auth0 data
            const updateData: Partial<Omit<UserSelect, 'id' | 'createdAt'>> = {};

            // Only update fields that have changed or are different from current data
            if (email && email.trim() !== '' && email !== existingUser.email) {
                updateData.email = email.trim();
            }

            if (nickname && nickname !== existingUser.nickname) {
                updateData.nickname = nickname;
            }

            if (avatarUrl !== existingUser.avatarUrl) {
                updateData.avatarUrl = avatarUrl || null;
            }

            // Only update if there are actual changes
            if (Object.keys(updateData).length > 0) {
                console.log(`Updating existing user for Auth0 ID: ${auth0UserId}`);
                const updatedUser = await updateUserByAuth0IdService(auth0UserId, updateData);

                if (updatedUser) {
                    existingUser = updatedUser;
                    console.log(`✅ Successfully updated user with ID: ${existingUser.id}`);
                }
            }
        }

        return { user: existingUser, isNewUser };

    } catch (error) {
        console.error('❌ Error in createOrUpdateUserByAuth0Id:', error);
        return { user: null, isNewUser: false };
    }
};
