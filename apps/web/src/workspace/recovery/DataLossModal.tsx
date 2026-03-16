export type ScenarioType = "shutdown" | "lose-data";
export type ServerId = "S1" | "S2";

const titles: Record<ScenarioType, string> = {
  shutdown: "Server shut down — data deleted",
  "lose-data": "Unsaved work lost"
};

type Props = {
  type: ScenarioType;
  servers: ServerId[];
  backend?: { S1?: boolean; S2?: boolean; errors: string[] };
  onClose: () => void;
};

function bodyText(type: ScenarioType, servers: ServerId[]): string {
  const serverList = servers.length === 2 ? "S1 and S2" : servers[0];
  const base =
    type === "shutdown"
      ? `Server(s) ${serverList} wiped. All file data on the backend is deleted. Any work you had not saved is lost.`
      : `Server(s) ${serverList} wiped. Local drafts and the save queue were also cleared.`;
  return `${base} Re-open files to see empty or last-saved content.`;
}

export function DataLossModal({ type, servers, backend, onClose }: Props) {
  const title = titles[type];
  const body = bodyText(type, servers);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="data-loss-title">
      <div className="modal-card data-loss-modal">
        <h3 id="data-loss-title">{title}</h3>
        <p>{body}</p>
        {backend && servers.length > 0 && (
          <p className="data-loss-backend">
            {servers.map((id) => (
              <span key={id} className="data-loss-server">
                {id}: {backend[id] === true ? "✓ wiped" : "✗ failed"}
                {backend.errors?.some((e) => e.startsWith(id)) && (
                  <span className="data-loss-errors">
                    {" "}
                    ({backend.errors.find((e) => e.startsWith(id))?.replace(/^S[12]:\s*/, "")})
                  </span>
                )}
              </span>
            ))}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
