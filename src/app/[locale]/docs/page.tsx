import { redirect } from "next/navigation";
import { getAllMarkdownFiles } from "@/lib/markdown";
import { locales } from "@/i18n/config";

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Learn how to use Claude-ide effectively. Explore setup guides, API usage, and feature documentation.'
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale: locale,
  }));
}

// Static page component - redirects to the first document
export default async function DocsListPage({ params }: PageProps) {
  const { locale } = await params;
  const documents = getAllMarkdownFiles(locale);

  // Get the first document and redirect to it
  if (documents.length > 0) {
    const firstDocument = documents[0];
    redirect(`/${locale}/docs/${firstDocument.category}/${firstDocument.slug}`);
  }

  // Fallback if no documents exist
  redirect(`/${locale}`);
}