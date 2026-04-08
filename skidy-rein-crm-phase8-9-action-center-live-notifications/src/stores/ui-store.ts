import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Locale } from "@/types/common.types";

/**
 * UI state management store
 * Handles sidebar state, locale, and global UI preferences
 * @author Abdelrahman
 */

interface UIState {
  /** Sidebar expanded or collapsed */
  sidebarOpen: boolean;
  /** Mobile sidebar overlay visible */
  mobileSidebarOpen: boolean;
  /** Current locale */
  locale: Locale;
  /** Toggle sidebar */
  toggleSidebar: () => void;
  /** Set sidebar state */
  setSidebarOpen: (open: boolean) => void;
  /** Toggle mobile sidebar */
  toggleMobileSidebar: () => void;
  /** Set mobile sidebar state */
  setMobileSidebarOpen: (open: boolean) => void;
  /** Switch locale */
  setLocale: (locale: Locale) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileSidebarOpen: false,
      locale: "ar",

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "skidy-rein-ui",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        locale: state.locale,
      }),
    }
  )
);