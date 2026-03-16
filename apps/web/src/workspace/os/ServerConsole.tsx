type Props = {
  serverId: string;
  state: any;
};

export function ServerConsole({ serverId, state }: Props) {
  const server = (state?.servers || []).find((s: any) => s.id === serverId);
  return (
    <div className="panel os-console">
      <h4>{serverId} Status</h4>
      <p>Status: {server?.status || "DOWN"}</p>
      <p>CPU: {server?.cpu ?? 0}%</p>
      <p>RAM: {server?.ram ?? 0}%</p>
      <p>Latency: {server?.latencyMs ?? 0} ms</p>
      <p>Last Seen: {server?.lastSeenSec ?? 0}s</p>
    </div>
  );
}
