"use client";

import { ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

type HeroLoginButtonProps = {
  locale: string;
  children: ReactNode;
  className?: string;
};

export function HeroLoginButton({ locale, children, className }: HeroLoginButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleClick = useCallback(() => {
    const hasUser = Boolean(session?.user?.id);
    const target = hasUser ? `/${locale}/dashboard` : `/${locale}/login`;
    router.push(target);
  }, [router, session?.user?.id, locale]);

  return (
    <Button
      type="button"
      variant="black"
      size="lg"
      className={className}
      onClick={handleClick}
      disabled={status === "loading"}
    >
      {children}
    </Button>
  );
}
