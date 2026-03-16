import { ReactNode } from "react";

export type WindowId =
  | "explorer"
  | "editor"
  | "controller"
  | "server1"
  | "server2"
  | "dashboard";

export type WindowItem = {
  id: WindowId;
  title: string;
  icon: string;
  content: ReactNode;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
  z: number;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized?: boolean;
  restoreBounds?: { x: number; y: number; w: number; h: number } | null;
};
