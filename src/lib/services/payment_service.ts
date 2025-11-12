import {
    createPaymentFromStripe,
    getPaymentByStripePaymentIntentId,
    updatePaymentByStripePaymentIntentId,
    getPaymentsByUserIdPaginated,
    getPaymentsCountByUserId
} from '@/db/queries/payments';
import type { PaymentSelect } from '@/types/schema';

/**
 * Create payment from Stripe payment intent
 */
export const createPaymentFromStripeIntent = async (
    data: {
        userId: string;
        subscriptionId: string | null;
        stripePaymentIntentId: string;
        amount: string;
        currency?: string;
        status: string;
        type: string
    }
): Promise<PaymentSelect | null> => {
    try {
        // Check if payment already exists
        const existingPayment = await getPaymentByStripePaymentIntentId(data.stripePaymentIntentId);
        if (existingPayment) {
            console.log(`Payment already exists for Stripe intent: ${data.stripePaymentIntentId}`);
            return existingPayment;
        }

        const payment = await createPaymentFromStripe(data);
        console.log(`✅ Created payment from Stripe: ${payment?.id} for user ${data.userId}`);
        return payment;
    } catch (error) {
        console.error('Error creating payment from Stripe:', error);
        return null;
    }
};

/**
 * Process payment from Stripe webhook
 */
export const processStripeWebhookPayment = async (
    stripePaymentIntentId: string,
    data: {
        userId: string;
        subscriptionId: string | null;
        amount: string;
        currency?: string;
        status: string;
        type: string;
    }
): Promise<PaymentSelect | null> => {
    try {
        // Check if payment already exists
        const existingPayment = await getPaymentByStripePaymentIntentId(stripePaymentIntentId);

        if (existingPayment) {
            // Update existing payment
            return await updatePaymentByStripePaymentIntentId(stripePaymentIntentId, {
                status: data.status,
                amount: data.amount,
                ...(data.subscriptionId && { subscriptionId: data.subscriptionId })
            });
        } else {
            // Create new payment
            return await createPaymentFromStripeIntent({
                ...data,
                stripePaymentIntentId
            });
        }
    } catch (error) {
        console.error(`Error processing Stripe webhook payment ${stripePaymentIntentId}:`, error);
        return null;
    }
};

/**
 * Get user payments with pagination
 */
export const getUserPaymentsPaginated = async (
    userId: string,
    options: {
        page?: number;
        limit?: number;
        orderBy?: 'createdAt' | 'amount' | 'status';
        orderDirection?: 'asc' | 'desc';
    } = {}
): Promise<{
    payments: PaymentSelect[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}> => {
    try {
        return await getPaymentsByUserIdPaginated(
            userId,
            options.page || 1,
            options.limit || 10,
            options.orderBy || 'createdAt',
            options.orderDirection || 'desc'
        );
    } catch (error) {
        console.error(`Error getting payments for user ${userId}:`, error);
        return {
            payments: [],
            total: 0,
            page: options.page || 1,
            totalPages: 0,
            limit: options.limit || 10
        };
    }
};

/**
 * Get total payments count for a user
 */
export const getUserPaymentsCount = async (userId: string): Promise<number> => {
    try {
        return await getPaymentsCountByUserId(userId);
    } catch (error) {
        console.error(`Error getting payments count for user ${userId}:`, error);
        return 0;
    }
};