import { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function WindowFrame({ title, children }: Props) {
  return (
    <div className="window">
      <div style={{ marginBottom: 8 }}>
        <strong>{title}</strong>
      </div>
      {children}
    </div>
  );
}
