import {
    createPayment as createPaymentDB,
    createPaymentFromStripe,
    getPaymentById,
    getPaymentByStripePaymentIntentId,
    getPaymentsByUserId,
    getPaymentsBySubscriptionId,
    getPaymentsByStatus,
    getPayments,
    getSuccessfulPaymentsByUserId,
    getFailedPaymentsByUserId,
    getPaymentsByDateRange,
    getPaymentsWithDetails,
    getPaymentsCount,
    getTotalRevenue,
    updatePaymentById,
    updatePaymentByStripePaymentIntentId,
    updatePaymentStatus,
    markPaymentAsSuccessful,
    markPaymentAsFailed,
    refundPayment,
    deletePaymentById,
    deletePaymentByStripePaymentIntentId,
    deletePaymentsByUserId,
    paymentExistsByStripePaymentIntentId,
    getUserPaymentStats,
    getRecentPaymentsByUserId,
    searchPayments
} from '@/db/queries/payments';
import type { PaymentSelect } from '@/db/schema';

// ========== Payment Creation ==========

/**
 * Create a new payment record
 */
export const createPayment = async (
    data: Omit<Parameters<typeof createPaymentDB>[0], 'createdAt'>
): Promise<PaymentSelect | null> => {
    try {
        const payment = await createPaymentDB(data);
        if (payment) {
            console.log(`✅ Created payment: ${payment.id} for user ${data.userId}`);
        }
        return payment;
    } catch (error) {
        console.error('Error creating payment:', error);
        return null;
    }
};

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

// ========== Payment Retrieval ==========

/**
 * Get payment by ID
 */
export const getPayment = async (id: number): Promise<PaymentSelect | null> => {
    try {
        return await getPaymentById(id);
    } catch (error) {
        console.error(`Error getting payment ${id}:`, error);
        return null;
    }
};

/**
 * Get payment by Stripe payment intent ID
 */
export const getPaymentByStripeId = async (stripePaymentIntentId: string): Promise<PaymentSelect | null> => {
    try {
        return await getPaymentByStripePaymentIntentId(stripePaymentIntentId);
    } catch (error) {
        console.error(`Error getting payment by Stripe ID ${stripePaymentIntentId}:`, error);
        return null;
    }
};

/**
 * Get all payments for a user
 */
export const getUserPayments = async (userId: string): Promise<PaymentSelect[]> => {
    try {
        return await getPaymentsByUserId(userId);
    } catch (error) {
        console.error(`Error getting payments for user ${userId}:`, error);
        return [];
    }
};

/**
 * Get payments for a subscription
 */
export const getSubscriptionPayments = async (subscriptionId: string): Promise<PaymentSelect[]> => {
    try {
        return await getPaymentsBySubscriptionId(subscriptionId);
    } catch (error) {
        console.error(`Error getting payments for subscription ${subscriptionId}:`, error);
        return [];
    }
};

/**
 * Get payments by status
 */
export const getPaymentsByStatusFilter = async (status: string): Promise<PaymentSelect[]> => {
    try {
        return await getPaymentsByStatus(status);
    } catch (error) {
        console.error(`Error getting payments with status ${status}:`, error);
        return [];
    }
};

/**
 * Get paginated payments with filters
 */
export const getPaymentList = async (options: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
    sortBy?: 'createdAt' | 'amount' | 'status';
    sortOrder?: 'asc' | 'desc';
} = {}): Promise<{
    payments: PaymentSelect[];
    totalCount: number;
}> => {
    try {
        const [payments, totalCount] = await Promise.all([
            getPayments(options),
            getPaymentsCount(options.status)
        ]);

        return { payments, totalCount };
    } catch (error) {
        console.error('Error getting payment list:', error);
        return { payments: [], totalCount: 0 };
    }
};

/**
 * Get successful payments for a user
 */
export const getUserSuccessfulPayments = async (userId: string): Promise<PaymentSelect[]> => {
    try {
        return await getSuccessfulPaymentsByUserId(userId);
    } catch (error) {
        console.error(`Error getting successful payments for user ${userId}:`, error);
        return [];
    }
};

/**
 * Get failed payments for a user
 */
export const getUserFailedPayments = async (userId: string): Promise<PaymentSelect[]> => {
    try {
        return await getFailedPaymentsByUserId(userId);
    } catch (error) {
        console.error(`Error getting failed payments for user ${userId}:`, error);
        return [];
    }
};

/**
 * Get payments within date range
 */
export const getPaymentsInDateRange = async (startDate: Date, endDate: Date): Promise<PaymentSelect[]> => {
    try {
        return await getPaymentsByDateRange(startDate, endDate);
    } catch (error) {
        console.error('Error getting payments in date range:', error);
        return [];
    }
};

/**
 * Get payments with user and subscription details
 */
export const getPaymentListWithDetails = async (options: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
} = {}): Promise<any[]> => {
    try {
        return await getPaymentsWithDetails(options);
    } catch (error) {
        console.error('Error getting payments with details:', error);
        return [];
    }
};

/**
 * Get recent payments for a user
 */
export const getRecentUserPayments = async (userId: string, limit: number = 10): Promise<PaymentSelect[]> => {
    try {
        return await getRecentPaymentsByUserId(userId, limit);
    } catch (error) {
        console.error(`Error getting recent payments for user ${userId}:`, error);
        return [];
    }
};

/**
 * Search payments
 */
export const searchPaymentList = async (query: string, limit: number = 20): Promise<PaymentSelect[]> => {
    try {
        return await searchPayments(query, limit);
    } catch (error) {
        console.error(`Error searching payments with query "${query}":`, error);
        return [];
    }
};

// ========== Payment Updates ==========

/**
 * Update payment by ID
 */
export const updatePayment = async (
    id: number,
    data: Partial<Omit<Parameters<typeof updatePaymentById>[1], never>>
): Promise<PaymentSelect | null> => {
    try {
        const payment = await updatePaymentById(id, data);
        if (payment) {
            console.log(`✅ Updated payment: ${id}`);
        }
        return payment;
    } catch (error) {
        console.error(`Error updating payment ${id}:`, error);
        return null;
    }
};

/**
 * Update payment by Stripe payment intent ID
 */
export const updatePaymentByStripe = async (
    stripePaymentIntentId: string,
    data: Partial<Omit<Parameters<typeof updatePaymentByStripePaymentIntentId>[1], never>>
): Promise<PaymentSelect | null> => {
    try {
        const payment = await updatePaymentByStripePaymentIntentId(stripePaymentIntentId, data);
        if (payment) {
            console.log(`✅ Updated payment by Stripe ID: ${stripePaymentIntentId}`);
        }
        return payment;
    } catch (error) {
        console.error(`Error updating payment by Stripe ID ${stripePaymentIntentId}:`, error);
        return null;
    }
};

/**
 * Update payment status
 */
export const updatePaymentStatusById = async (id: number, status: string): Promise<PaymentSelect | null> => {
    try {
        const payment = await updatePaymentStatus(id, status);
        if (payment) {
            console.log(`✅ Updated payment ${id} status to: ${status}`);
        }
        return payment;
    } catch (error) {
        console.error(`Error updating payment ${id} status:`, error);
        return null;
    }
};

/**
 * Mark payment as successful
 */
export const markPaymentSuccessful = async (id: number): Promise<PaymentSelect | null> => {
    try {
        const payment = await markPaymentAsSuccessful(id);
        if (payment) {
            console.log(`✅ Marked payment ${id} as successful`);
        }
        return payment;
    } catch (error) {
        console.error(`Error marking payment ${id} as successful:`, error);
        return null;
    }
};

/**
 * Mark payment as failed
 */
export const markPaymentFailed = async (id: number): Promise<PaymentSelect | null> => {
    try {
        const payment = await markPaymentAsFailed(id);
        if (payment) {
            console.log(`✅ Marked payment ${id} as failed`);
        }
        return payment;
    } catch (error) {
        console.error(`Error marking payment ${id} as failed:`, error);
        return null;
    }
};

/**
 * Refund payment
 */
export const refundPaymentById = async (id: number, amount?: string): Promise<PaymentSelect | null> => {
    try {
        const payment = await refundPayment(id, amount);
        if (payment) {
            console.log(`✅ Refunded payment ${id}`);
        }
        return payment;
    } catch (error) {
        console.error(`Error refunding payment ${id}:`, error);
        return null;
    }
};

// ========== Payment Deletion ==========

/**
 * Delete payment by ID
 */
export const deletePayment = async (id: number): Promise<PaymentSelect | null> => {
    try {
        const payment = await deletePaymentById(id);
        if (payment) {
            console.log(`✅ Deleted payment: ${id}`);
        }
        return payment;
    } catch (error) {
        console.error(`Error deleting payment ${id}:`, error);
        return null;
    }
};

/**
 * Delete payment by Stripe payment intent ID
 */
export const deletePaymentByStripeId = async (stripePaymentIntentId: string): Promise<PaymentSelect | null> => {
    try {
        const payment = await deletePaymentByStripePaymentIntentId(stripePaymentIntentId);
        if (payment) {
            console.log(`✅ Deleted payment by Stripe ID: ${stripePaymentIntentId}`);
        }
        return payment;
    } catch (error) {
        console.error(`Error deleting payment by Stripe ID ${stripePaymentIntentId}:`, error);
        return null;
    }
};

/**
 * Delete all payments for a user (use with caution)
 */
export const deleteUserPayments = async (userId: string): Promise<PaymentSelect[]> => {
    try {
        const payments = await deletePaymentsByUserId(userId);
        console.log(`✅ Deleted ${payments.length} payments for user ${userId}`);
        return payments;
    } catch (error) {
        console.error(`Error deleting payments for user ${userId}:`, error);
        return [];
    }
};

// ========== Payment Analytics & Utilities ==========

/**
 * Check if payment exists by Stripe payment intent ID
 */
export const checkPaymentExistsByStripeId = async (stripePaymentIntentId: string): Promise<boolean> => {
    try {
        return await paymentExistsByStripePaymentIntentId(stripePaymentIntentId);
    } catch (error) {
        console.error(`Error checking payment existence for Stripe ID ${stripePaymentIntentId}:`, error);
        return false;
    }
};

/**
 * Get payment statistics for a user
 */
export const getUserPaymentAnalytics = async (userId: string): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    successfulAmount: number;
    successRate: number;
}> => {
    try {
        const stats = await getUserPaymentStats(userId);
        const successRate = stats.totalPayments > 0
            ? (stats.successfulPayments / stats.totalPayments) * 100
            : 0;

        return {
            ...stats,
            successRate: Math.round(successRate * 100) / 100 // Round to 2 decimal places
        };
    } catch (error) {
        console.error(`Error getting payment analytics for user ${userId}:`, error);
        return {
            totalPayments: 0,
            successfulPayments: 0,
            failedPayments: 0,
            totalAmount: 0,
            successfulAmount: 0,
            successRate: 0,
        };
    }
};

/**
 * Get total revenue with optional filters
 */
export const getRevenueAnalytics = async (options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
} = {}): Promise<{
    totalRevenue: number;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
}> => {
    try {
        const totalRevenue = await getTotalRevenue(options);
        return {
            totalRevenue,
            ...options
        };
    } catch (error) {
        console.error('Error getting revenue analytics:', error);
        return {
            totalRevenue: 0,
            ...options
        };
    }
};

/**
 * Get payment count with optional status filter
 */
export const getPaymentAnalytics = async (status?: string): Promise<{
    totalCount: number;
    status?: string;
}> => {
    try {
        const totalCount = await getPaymentsCount(status);
        return {
            totalCount,
            status
        };
    } catch (error) {
        console.error('Error getting payment analytics:', error);
        return {
            totalCount: 0,
            status
        };
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
    }
): Promise<PaymentSelect | null> => {
    try {
        // Check if payment already exists
        const existingPayment = await getPaymentByStripeId(stripePaymentIntentId);

        if (existingPayment) {
            // Update existing payment
            return await updatePaymentByStripe(stripePaymentIntentId, {
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