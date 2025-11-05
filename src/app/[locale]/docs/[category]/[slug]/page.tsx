import { notFound } from "next/navigation";
import { getMarkdownContent, getAllMarkdownFiles, findMarkdownFile } from "@/lib/markdown";
import { MarkdownContent } from "@/components/markdown-content";
import Header from "@/components/header";
import { Link } from "@/i18n/navigation";
import { Home, FileText, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { DocsSidebarLayout } from "@/components/docs-sidebar-layout";

interface PageProps {
  params: Promise<{
    locale: string;
    category: string;
    slug: string;
  }>;
}

// Generate static params for all documents and locales
export async function generateStaticParams() {
  const { locales } = await import("@/i18n/config");
  const params: Array<{
    locale: string;
    category: string;
    slug: string;
  }> = [];

  for (const locale of locales) {
    const files = getAllMarkdownFiles(locale);
    files.map((file) => ({
      locale: locale,
      category: file.category,
      slug: file.slug,
    })).forEach(param => params.push(param));
  }

  return params;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, category, slug } = await params;

  try {
    // Find the file by clean slug to get the actual file path
    const fileData = findMarkdownFile(slug, category, locale);
    if (!fileData) {
      return {
        title: 'Document Not Found',
      };
    }

    const content = getMarkdownContent(fileData.filePath, locale);
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    const canonicalPath = `/${encodeURIComponent(locale)}/docs/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;

    return {
      title: `${title} - Documentation`,
      description: `Documentation for ${title}`,
      alternates: {
        canonical: canonicalPath,
      },
    };
  } catch {
    return {
      title: 'Document Not Found',
    };
  }
}

export default async function DocPage({ params }: PageProps) {
  const { locale, category, slug } = await params;

  // console.log(locale, category, slug);
  const t = await getTranslations({ locale, namespace: 'navigation' });

  try {
    // Find the file by clean slug to get the actual file path
    const fileData = findMarkdownFile(slug, category, locale);
    if (!fileData) {
      notFound();
    }

    const content = getMarkdownContent(fileData.filePath, locale);
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;
    const allDocuments = getAllMarkdownFiles(locale);

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-screen">
          <DocsSidebarLayout
            documents={allDocuments}
            currentCategory={category}
            currentSlug={slug}
          >
            <div className="max-w-6xl bg-card p-6 rounded-lg">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
                <Link href="/" className="flex items-center gap-1 hover:text-foreground">
                  <Home className="w-4 h-4" />
                  {t('home')}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/docs" className="flex items-center gap-1 hover:text-foreground">
                  <FileText className="w-4 h-4" />
                  {t('document')}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="capitalize">{category.replace('-', ' ')}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">{title}</span>
              </nav>

              {/* Document Content */}
              <MarkdownContent content={content} className="ml-8" />
            </div>
          </DocsSidebarLayout>
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Error loading document ${category}/${slug}:`, error);
    notFound();
  }
}