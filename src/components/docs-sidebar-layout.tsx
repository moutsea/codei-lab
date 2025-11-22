"use client";

import { Link } from "@/i18n/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { FileText, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentItem {
  category: string;
  slug: string;
  title: string;
  filePath: string;
}

interface DocsSidebarLayoutProps {
  documents: DocumentItem[];
  currentCategory?: string;
  currentSlug?: string;
  children: React.ReactNode;
}

function groupDocumentsByCategory(documents: DocumentItem[]) {
  const grouped: Record<string, DocumentItem[]> = {};

  documents.forEach(doc => {
    if (!grouped[doc.category]) {
      grouped[doc.category] = [];
    }
    grouped[doc.category].push(doc);
  });

  return grouped;
}

function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function DocumentSidebar({ documents, currentCategory, currentSlug }: {
  documents: DocumentItem[];
  currentCategory?: string;
  currentSlug?: string;
}) {
  const groupedDocs = groupDocumentsByCategory(documents);

  return (
    <Sidebar
      variant="inset"
      collapsible="offcanvas"
      className="bg-card dark:bg-[#212121] border-r border-border pl-8 pt-18 overflow-x-hidden"
    >
      <SidebarContent className="bg-card dark:bg-[#212121] overflow-y-auto overflow-x-hidden">
        {Object.entries(groupedDocs).map(([category, docs]) => (
          <SidebarGroup key={category}>
            <SidebarGroupLabel className="px-3 py-3 text-foreground bg-card dark:bg-[#212121]">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">
                  {formatCategoryName(category)}
                </span>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent className="bg-card dark:bg-[#212121]">
              <SidebarMenu>
                {docs.map((doc) => {
                  const isActive = currentCategory === doc.category && currentSlug === doc.slug;
                  return (
                    <SidebarMenuItem key={doc.slug}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "hover:bg-muted text-muted-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary rounded-none",
                          "my-1 mx-3 py-3 px-4 text-sm"
                        )}
                      >
                        <Link href={{
                          pathname: '/docs/[category]/[slug]',
                          params: { category: doc.category, slug: doc.slug }
                        }}>
                          <FileText className={cn(
                            "w-4 h-4 text-muted-foreground ml-1",
                            isActive && "text-primary"
                          )} />
                          <span className="truncate ml-2">{doc.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

export function DocsSidebarLayout({
  documents,
  currentCategory,
  currentSlug,
  children
}: DocsSidebarLayoutProps) {
  return (
    <SidebarProvider>
      <DocumentSidebar
        documents={documents}
        currentCategory={currentCategory}
        currentSlug={currentSlug}
      />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 dark:bg-[#212121]">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
