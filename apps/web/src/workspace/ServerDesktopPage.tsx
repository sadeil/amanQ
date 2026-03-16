import { useLocation } from "react-router-dom";
import { OSDesktop } from "./os/OSDesktop";

type Props = {
  serverId: "server1" | "server2";
};

export function ServerDesktopPage({ serverId }: Props) {
  const location = useLocation();
  const initialDataLost = (location.state as { dataLost?: boolean } | null)?.dataLost === true;
  const serverWindow = serverId === "server1" ? "server1" : "server2";
  return (
    <OSDesktop
      initialOpenIds={["explorer", "editor", serverWindow]}
      initialFocusId="explorer"
      visibleWindowIds={["explorer", "editor", serverWindow]}
      serverContext={serverId === "server1" ? "S1" : "S2"}
      initialDataLost={initialDataLost}
    />
  );
}
