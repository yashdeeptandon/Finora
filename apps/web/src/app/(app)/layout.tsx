"use client";

import { requireAuth } from "@/lib/auth";
import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { User } from "@pkg/types";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await requireAuth();
        setUser(userData as User);
      } catch (error) {
        // requireAuth handles redirection
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Or a redirect component if requireAuth fails client-side
  }

  return <AppShell user={user}>{children}</AppShell>;
}
