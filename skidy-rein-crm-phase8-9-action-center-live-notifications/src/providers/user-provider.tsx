"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserRole } from "@/types/common.types";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  fullNameAr: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
}

const UserContext = createContext<CurrentUser | null>(null);

interface UserProviderProps {
  user: CurrentUser;
  children: ReactNode;
}

export function UserProvider({ user, children }: UserProviderProps) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useCurrentUser must be used within <UserProvider>");
  }
  return user;
}