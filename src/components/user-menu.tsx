"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { useLocale } from "next-intl";
import { useAdminStatus } from "@/hooks/useAdmin";

export default function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;
  const t = useTranslations("userMenu");
  const router = useRouter();
  const locale = useLocale();
  const { isAdmin } = useAdminStatus();

  const showAdminLink = isAdmin !== false;

  if (!user) {
    return null;
  }

  const handleDashboard = () => {
    router.push(locale === 'en' ? '/dashboard' : `/${locale}/dashboard`);
  };

  const handleAdmin = () => {
    router.push(locale === 'en' ? '/admin' : `/${locale}/admin`);
  };

  // const handleBilling = async () => {
  //   router.push(locale === 'en' ? '/dashboard/billing' : `/${locale}/dashboard/billing`)
  // };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative group">
          <div className="relative overflow-hidden rounded-full w-10 h-10 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer">
            <Image
              src={user.image || "/default_avatar.png"}
              alt="Profile"
              width={40}
              height={40}
              unoptimized
              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
            />
            {/* 悬浮时的遮罩效果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            {/* 悬浮时的边框效果 */}
            <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/50 transition-colors duration-300" />
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDashboard}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>{t("dashboard")}</span>
        </DropdownMenuItem>

        {showAdminLink && (
          <>
            <DropdownMenuItem onClick={handleAdmin}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* <DropdownMenuItem onClick={handleBilling}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>{t("billing")}</span>
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
