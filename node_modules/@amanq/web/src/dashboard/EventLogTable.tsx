type Props = {
  events: { id: string; time: string; type: string; server?: string; details: string }[];
};

export function EventLogTable({ events }: Props) {
  return (
    <div>
      <div className="panel-title">
        <div>
          <h4>Event Log</h4>
          <span className="panel-subtitle">Failovers and backups</span>
        </div>
        <span className="panel-badge">Live</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Time</th>
            <th style={{ textAlign: "left" }}>Type</th>
            <th style={{ textAlign: "left" }}>Server</th>
            <th style={{ textAlign: "left" }}>Details</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr>
              <td colSpan={4} style={{ opacity: 0.7 }}>
                No events yet.
              </td>
            </tr>
          )}
          {events.map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.time).toLocaleTimeString()}</td>
              <td>
                <span className="event-pill">{event.type}</span>
              </td>
              <td>{event.server || "-"}</td>
              <td>{event.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
