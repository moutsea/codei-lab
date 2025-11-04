import Header from "@/components/header";
import { ReactNode } from "react";

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Claude-ide',
  description: 'Your personal dashboard for managing Claude-ide API usage, billing, and account settings.',
  robots: 'noindex, nofollow',
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}