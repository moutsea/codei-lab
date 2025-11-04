import { Metadata } from 'next';
import { UsagePageClient } from './client';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'API Usage Dashboard',
  description:
    'Check your Claude-ide API usage, including token consumption, usage limits, and remaining balance. Enter your API key to view detailed usage statistics.',
  robots: 'noindex, nofollow',
}

export default async function UsagePage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mt-16">
        <UsagePageClient />
      </div>
    </div>
  );
}