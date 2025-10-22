import type { IconData } from "@/data/iconData";

declare global {
  interface Window {
    __ICON_DATA__?: IconData;
    __SELECTED_FOLDER__?: string | null;
  }
}

export {};

