import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminDashboardClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdminPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardClient />
    </div>
  );
}