import Stripe from 'stripe'

// 尝试多个可能的 Stripe key 名称
const stripeKey = process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY;

if (!stripeKey) {
    throw new Error('Stripe API key not found. Please set STRIPE_SECRET_KEY in your environment variables.');
}

export const stripe = new Stripe(stripeKey, {
    typescript: true
});

export const generateBillingLink = async (stripeCustomerId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_WEB_URL;
    const defaultUrl = baseUrl + "/dashboard";

    if (!stripeCustomerId) return false;

    const stripeSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: defaultUrl
    })
    return stripeSession.url;
}