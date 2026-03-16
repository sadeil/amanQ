import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function WindowManager({ children }: Props) {
  return <div className="workspace">{children}</div>;
}
