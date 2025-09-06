"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React from "react";
import { User } from "@pkg/types";

interface GuardedProps {
  children: React.ReactNode;
  role?: "admin" | "user";
}

export function Guarded({ children, role }: GuardedProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (!user) {
    router.push("/auth/sign-in");
    return null;
  }

  if (role && (user as User).role !== role) {
    router.push("/unauthorized");
    return null;
  }

  return <>{children}</>;
}
