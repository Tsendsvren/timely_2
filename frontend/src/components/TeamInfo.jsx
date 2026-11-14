import { TEAM } from "../mocks/team.js";

export default function TeamInfo() {
  return (
    <section className="card team-info" data-testid="team-info" aria-label="Багийн мэдээлэл">
      <h2>
        <span data-testid="team-name">{TEAM.teamName}</span> ·{' '}
        <span data-testid="project-name">{TEAM.projectName}</span>
      </h2>
      <ul className="team-list">
        {TEAM.members.map((m) => (
          <li key={m.code} data-testid={`team-member-${m.code}`}>
            <strong>{m.name}</strong>
            <span className="muted sm">{m.code} · {m.module}</span>
            <span className="sm">{m.area}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
