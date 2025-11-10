"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Menu } from "lucide-react";
import { LocaleToggle } from "@/components/locale/toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/user-menu";
import { StyleToggle } from "@/components/theme-toggle";
import { useTheme } from "@/contexts/theme-context";

interface NavigationItem {
  key: string;
  href: string;
}

export default function Header() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const { theme } = useTheme();

  const loginHref = locale === 'en' ? '/login' : `/${locale}/login`;

  const handleLoginNavigate = () => {
    router.push(loginHref);
  };

  const navigationItems: NavigationItem[] = [
    { key: "home", href: locale === 'en' ? '/' : `/${locale}` },
    { key: "document", href: `/${locale}/docs` },
    { key: "pricing", href: `/${locale}#pricing` },
    { key: "faq", href: `/${locale}#faq` },
    { key: "usage", href: `/${locale}/usage` },
  ];

  const isActive = (href: string) => {
    // Normalize pathname by removing locale prefix for comparison
    const normalizedPathname = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
    const normalizedHref = href.replace(new RegExp(`^/${locale}`), '') || '/';

    if (normalizedHref === '/') {
      return normalizedPathname === '/';
    }
    // For docs page, highlight if pathname starts with /docs (includes all subpages)
    if (normalizedHref === '/docs') {
      return normalizedPathname.startsWith('/docs');
    }
    // For other pages, use exact match
    return normalizedPathname === normalizedHref;
  };

  const Logo = () => (
    <Link
      href={locale === 'en' ? '/' : `/${locale}`}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
        {/* <span className="text-white font-bold text-lg">TL</span> */}
        <Image
          src={theme === 'dark' ? "/logo_black.png" : "/logo.png"}
          width={40}
          height={40}
          alt="Code I Lab Logo"
        />
      </div>
      <span className="text-xl font-bold text-foreground">
        Code I Lab
      </span>
    </Link>
  );

  const NavigationLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? "flex flex-col gap-4" : "flex items-center gap-6"}>
      {navigationItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "font-medium transition-colors duration-200",
            mobile
              ? "text-lg px-4 py-2 rounded-lg hover:bg-muted"
              : "text-muted-foreground hover:text-foreground",
            isActive(item.href) &&
            (mobile
              ? "bg-primary text-primary-foreground"
              : "text-primary font-semibold")
          )}
        >
          {t(item.key)}
        </Link>
      ))}
    </div>
  );

  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-0 bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <nav>
            <NavigationLinks />
          </nav>
        </div>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-4">
          <LocaleToggle />
          <StyleToggle />
          {user ? (
            <div className="ml-2">
              <UserMenu />
            </div>
          ) : (
            <Button
              variant="black"
              className="ml-2 transition-colors duration-200 button-themed"
              disabled={isLoading}
              onClick={handleLoginNavigate}
            >
              {isLoading ? (
                <Loader2
                  className="h-5 w-5 animate-spin spinner-themed"
                  style={{ strokeWidth: "3" }}
                />
              ) : (
                `Login`
              )}
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <LocaleToggle />
          <StyleToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 py-6">
                <nav>
                  <NavigationLinks mobile />
                </nav>

                <div className="border-t pt-6">
                  <div className="flex flex-col gap-4">
                    {/* User authentication section */}
                    {user ? (
                      <div className="flex justify-center">
                        <UserMenu />
                      </div>
                    ) : (
                      <Button
                        variant="black"
                        className="w-full transition-colors duration-200 button-themed"
                        disabled={isLoading}
                        onClick={handleLoginNavigate}
                      >
                        {isLoading ? (
                          <Loader2
                            className="h-5 w-5 animate-spin spinner-themed"
                            style={{ strokeWidth: "3" }}
                          />
                        ) : (
                          `Login`
                        )}
                      </Button>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                      <p>{t("language")} {t("current")}</p>
                      <p className="font-medium">
                        {locale === "en" ? "English" :
                          locale === "zh" ? "中文" :
                            locale === "fr" ? "Français" : locale}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
