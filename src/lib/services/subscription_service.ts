import {
    createSubscription as createSubscriptionDB,
    updateSubscriptionByStripeId as updateSubscriptionByStripeIdDB,
    updateSubscriptionById as updateSubscriptionByIdDB,
    getSubscriptionByAuth0UserId,
    getSubscriptionByStripeSubscriptionId,
    getSubscriptionByUserId
} from '@/db/queries';
import type { SubscriptionSelect } from '@/db/schema';

/**
 * Create a new subscription
 */
export const createSubscription = async (
    data: Omit<Parameters<typeof createSubscriptionDB>[0], 'createdAt' | 'updatedAt'>
): Promise<SubscriptionSelect | null> => {
    try {
        // Create subscription in database
        const subscription = await createSubscriptionDB(data);

        if (!subscription) {
            console.error('Failed to create subscription in database');
            return null;
        }

        console.log(`✅ Created subscription: ${subscription.id}`);
        return subscription;

    } catch (error) {
        console.error('Error creating subscription:', error);
        return null;
    }
};

/**
 * Update subscription by Stripe subscription ID
 */
export const updateSubscriptionByStripeId = async (
    stripeSubscriptionId: string,
    data: Omit<Parameters<typeof updateSubscriptionByStripeIdDB>[1], 'createdAt' | 'updatedAt'>
): Promise<SubscriptionSelect | null> => {
    try {
        // Update subscription in database
        const subscription = await updateSubscriptionByStripeIdDB(stripeSubscriptionId, data);

        if (!subscription) {
            console.error(`Failed to update subscription with Stripe ID: ${stripeSubscriptionId}`);
            return null;
        }

        console.log(`✅ Updated subscription: ${subscription.id} for Stripe ID: ${stripeSubscriptionId}`);
        return subscription;

    } catch (error) {
        console.error(`Error updating subscription with Stripe ID ${stripeSubscriptionId}:`, error);
        return null;
    }
};

/**
 * Get user's subscription by auth0UserId
 */
export const getUserSubscriptionByAuth0Id = async (auth0UserId: string): Promise<SubscriptionSelect | null> => {
    try {
        const subscription = await getSubscriptionByAuth0UserId(auth0UserId);
        return subscription || null;

    } catch (error) {
        console.error('Database GET user subscription error:', error);
        return null;
    }
};

/**
 * Get user's subscription by auth0UserId
 */
export const getUserSubscriptionByUserId = async (userId: number): Promise<SubscriptionSelect | null> => {
    try {
        const subscription = await getSubscriptionByUserId(userId);
        return subscription || null;

    } catch (error) {
        console.error('Database GET user subscription error:', error);
        return null;
    }
};


/**
 * Get user's subscription by Stripe subscription ID
 */
export const getUserSubscriptionByStripeSubscriptionId = async (stripeSubscriptionId: string): Promise<SubscriptionSelect | null> => {
    try {
        const subscription = await getSubscriptionByStripeSubscriptionId(stripeSubscriptionId);

        if (!subscription) {
            console.log(`❌ Subscription not found for Stripe subscription ID: ${stripeSubscriptionId}`);
            return null;
        }

        console.log(`✅ Found subscription for Stripe ID: ${stripeSubscriptionId}, subscription ID: ${subscription.id}`);
        return subscription;

    } catch (error) {
        console.error(`Error getting subscription by Stripe subscription ID ${stripeSubscriptionId}:`, error);
        return null;
    }
};

/**
 * Update subscription by user ID
 */
export const updateSubscriptionByUserId = async (
    userId: number,
    data: Partial<Omit<Parameters<typeof updateSubscriptionByIdDB>[1], 'createdAt'>>
): Promise<SubscriptionSelect | null> => {
    try {
        // First, get the current subscription for the user
        const existingSubscription = await getSubscriptionByUserId(userId);

        if (!existingSubscription) {
            console.error(`❌ No subscription found for user ID: ${userId}`);
            return null;
        }

        console.log(`🔄 Updating subscription for user ID: ${userId}, current subscription ID: ${existingSubscription.id}`);

        // Update the subscription using the subscription ID
        const updatedSubscription = await updateSubscriptionByIdDB(existingSubscription.id, data);

        if (!updatedSubscription) {
            console.error(`❌ Failed to update subscription for user ID: ${userId}`);
            return null;
        }

        console.log(`✅ Successfully updated subscription for user ID: ${userId}, subscription ID: ${updatedSubscription.id}`);
        return updatedSubscription;

    } catch (error) {
        console.error(`Error updating subscription for user ID ${userId}:`, error);
        return null;
    }
};

