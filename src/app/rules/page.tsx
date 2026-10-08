import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Puck } from "@/components/Puck";
import { RinkSurface } from "@/components/rink/RinkSurface";
import { Jumbotron, SectionHeading } from "@/components/Scoreboard";
import { DIVISION_SPOTS, WILD_CARD_SPOTS } from "@/lib/domain/division";
import { GLOSSARY } from "@/lib/glossary";
import { POINTS_PER_WIN, SEASON_GAMES, TEAM_COUNT } from "@/lib/nhl/league";

export const metadata: Metadata = { title: "Rules" };

const SECTIONS = [
  { id: "rink", label: "The rink" },
  { id: "game", label: "The game" },
  { id: "standings", label: "Standings" },
  { id: "playoffs", label: "Playoffs" },
  { id: "calls", label: "Whistles" },
  { id: "glossary", label: "Stat glossary" },
] as const;

export default function RulesPage() {
  return (
    <>
      <Jumbotron kicker="▶ Rookie camp" title="The Rulebook">
        Everything you need to follow an NHL game and read the standings, without the 200-page official version.
      </Jumbotron>

      <nav aria-label="Rulebook sections" className="flex flex-wrap gap-2">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="-skew-x-12 border-2 border-boards bg-white/70 px-3 py-1 text-sm font-bold tracking-wider uppercase hover:bg-boards hover:text-white"
          >
            <span className="inline-block skew-x-12">{label}</span>
          </a>
        ))}
      </nav>

      <RinkGuide />
      <TheGame />
      <Standings />
      <Playoffs />
      <Whistles />
      <Glossary />
    </>
  );
}

function Section({
  id,
  title,
  line = "red",
  children,
}: {
  id: string;
  title: string;
  line?: "red" | "blue";
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <SectionHeading line={line}>
        <span id={`${id}-title`}>{title}</span>
      </SectionHeading>
      {children}
    </section>
  );
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <article className={`rounded-sm bg-white/80 p-4 shadow-md ring-1 ring-black/5 ${className}`}>
      <h3 className="mb-2 font-display text-lg leading-tight">{title}</h3>
      <div className="space-y-2 leading-snug text-ink/90">{children}</div>
    </article>
  );
}

/* ── The rink ─────────────────────────────────────────────────────────── */

// Marker positions as % of the 200×85 rink drawing.
const RINK_MARKERS = [
  {
    x: 5.5,
    y: 24,
    title: "Goal line & net",
    text: "The whole puck has to cross this thin red line, between the posts, for a goal.",
  },
  {
    x: 10.5,
    y: 50,
    title: "Crease",
    text: "The blue half-circle in front of the net is the goalie's space. Bumping the goalie there can wipe out a goal.",
  },
  {
    x: 15.5,
    y: 76,
    title: "Faceoff circles",
    text: "Play restarts with a faceoff at one of nine dots: the ref drops the puck between two centers.",
  },
  {
    x: 37.6,
    y: 24,
    title: "Blue lines",
    text: "They split the ice into three zones and decide offside: attackers can't enter the attacking zone before the puck.",
  },
  {
    x: 50,
    y: 76,
    title: "Center red line",
    text: "Halfway line. Shooting the puck from your own half all the way past the far goal line is icing.",
  },
  {
    x: 56,
    y: 24,
    title: "Neutral zone",
    text: "The middle ice between the blue lines, where possession usually gets fought over.",
  },
] as const;

function RinkGuide() {
  return (
    <Section id="rink" title="The Rink" line="blue">
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div className="@container relative aspect-[200/85] w-full drop-shadow-[0_10px_14px_rgb(9_14_26/0.25)]">
          <RinkSurface className="absolute inset-0 h-full w-full" />
          <div className="pointer-events-none absolute inset-x-[6%] bottom-[3%] flex justify-between font-led text-[clamp(10px,2.2vw,15px)] text-ink-soft">
            <span>DEFENDING ZONE</span>
            <span className="hidden sm:inline">NEUTRAL</span>
            <span>ATTACKING ZONE</span>
          </div>
          {RINK_MARKERS.map((m, i) => (
            <span
              key={m.title}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              aria-hidden="true"
            >
              <Puck size="sm" className="size-[clamp(18px,5.5cqw,32px)]! text-[clamp(11px,3.4cqw,18px)]!">
                {i + 1}
              </Puck>
            </span>
          ))}
        </div>
        <ol className="space-y-2">
          {RINK_MARKERS.map((m, i) => (
            <li key={m.title} className="flex gap-3">
              <Puck size="sm" className="text-base!">
                {i + 1}
              </Puck>
              <p className="leading-snug">
                <strong className="font-display text-sm tracking-wide">{m.title}.</strong> {m.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ── The game ─────────────────────────────────────────────────────────── */

const TIMELINE = [
  { label: "1st", clock: "20:00", note: "5-on-5", grow: 4 },
  { label: "2nd", clock: "20:00", note: "5-on-5", grow: 4 },
  { label: "3rd", clock: "20:00", note: "5-on-5", grow: 4 },
  { label: "OT", clock: "5:00", note: "3-on-3", grow: 1.4 },
  { label: "SO", clock: "1v1", note: "shootout", grow: 1.4 },
] as const;

function TheGame() {
  return (
    <Section id="game" title="The Game">
      <div className="jumbotron px-4 pt-6 pb-4">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">A regular-season game</p>
        <ol className="flex gap-1.5">
          {TIMELINE.map((p) => (
            <li
              key={p.label}
              // Equal columns on phones; proportional to playing time where there's room.
              style={{ ["--grow" as string]: p.grow }}
              className={`min-w-0 grow basis-0 border-t-4 px-1 pt-1 sm:grow-[var(--grow)] sm:px-2 ${p.label === "SO" ? "border-red-line" : p.label === "OT" ? "border-blue-line" : "border-led"}`}
            >
              <div className="font-display text-sm">{p.label}</div>
              <div className="led truncate text-xl leading-none sm:text-2xl">{p.clock}</div>
              <div className="truncate text-xs text-white/60">{p.note}</div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-white/70">
          OT and the shootout only happen if the score is tied after 60 minutes. The clock stops at every whistle, so a
          game takes about 2½ hours.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Who's on the ice">
          <p>
            Six per side: five skaters (usually three forwards and two defensemen) and a goalie. Players change on the
            fly every 40–60 seconds, in groups called <em>lines</em>.
          </p>
        </Card>
        <Card title="Goals & assists">
          <p>
            A goal counts when the whole puck crosses the goal line. Up to two teammates who touched it before the
            scorer get an assist.
          </p>
          <p>
            For a <em>player</em>, “points” means goals + assists. That&apos;s different from team standings points.
          </p>
        </Card>
        <Card title="Overtime">
          <p>
            Tied after three periods? In the regular season it goes to 5 minutes of sudden-death 3-on-3. The first goal
            wins.
          </p>
        </Card>
        <Card title="Shootout">
          <p>
            Still tied after OT: three shooters per team go one-on-one against the goalie. If it&apos;s still level, it
            goes to sudden-death rounds. The game is credited as a 1-goal win.
          </p>
        </Card>
        <Card title="Playoff overtime">
          <p>
            No shootouts in the playoffs. Teams play full 20-minute 5-on-5 periods until someone scores, sometimes deep
            into the night.
          </p>
        </Card>
        <Card title="Pulling the goalie">
          <p>
            A team trailing late often swaps its goalie for an extra skater to attack 6-on-5, risking an{" "}
            <em>empty-net goal</em> against.
          </p>
        </Card>
      </div>
    </Section>
  );
}

/* ── Standings ────────────────────────────────────────────────────────── */

const TIEBREAKERS = [
  "Points percentage (fewer games played wins a tie on points)",
  "Regulation wins",
  "Regulation + overtime wins (shootout wins don't count)",
  "Total wins",
  "Points in games between the tied teams",
  "Goal differential",
  "Goals scored",
] as const;

function Standings() {
  return (
    <Section id="standings" title="Points & Standings" line="blue">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {[
              { value: POINTS_PER_WIN, label: "Win", note: "any kind" },
              { value: 1, label: "OT / SO loss", note: "the “loser point”" },
              { value: 0, label: "Regulation loss", note: "lost in 60 min" },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <Puck size="lg" glow={p.value === POINTS_PER_WIN}>
                  {p.value}
                </Puck>
                <div>
                  <div className="font-display leading-tight">{p.label}</div>
                  <div className="text-sm text-ink-soft">{p.note}</div>
                </div>
              </div>
            ))}
          </div>
          <Card title="The season">
            <p>
              {TEAM_COUNT} teams play {SEASON_GAMES} games each, from October to mid-April. They split into two
              conferences (Eastern and Western) of two divisions each, eight teams per division.
            </p>
            <p>
              Standings are sorted by points. A record is written W-L-OT: 10-5-2 is 10 wins, 5 regulation losses and 2
              overtime/shootout losses, worth 22 points.
            </p>
          </Card>
        </div>

        <Card title="Breaking ties">
          <p>When two teams have the same points, the NHL looks at these in order:</p>
          <ol className="list-inside list-decimal space-y-1 marker:font-led marker:text-red-line">
            {TIEBREAKERS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="text-sm text-ink-soft">
            Late in the season you&apos;ll see letters by team names: <strong>x</strong> clinched a playoff spot,{" "}
            <strong>y</strong> the division, <strong>z</strong> the conference, <strong>p</strong> the best record in
            the league (Presidents&apos; Trophy), <strong>e</strong> eliminated.
          </p>
        </Card>
      </div>
    </Section>
  );
}

/* ── Playoffs ─────────────────────────────────────────────────────────── */

const ROUNDS = [
  { name: "First Round", matchups: ["A1 vs WC2", "A2 vs A3", "B1 vs WC1", "B2 vs B3"] },
  { name: "Second Round", matchups: ["Winners from division A", "Winners from division B"] },
  { name: "Conference Final", matchups: ["Last two in the conference"] },
  { name: "Stanley Cup Final", matchups: ["East champion vs West champion"] },
] as const;

function Playoffs() {
  return (
    <Section id="playoffs" title="Making the Playoffs">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Who gets in">
          <p>
            16 of the {TEAM_COUNT} teams, 8 per conference: the top {DIVISION_SPOTS} in each division, plus{" "}
            {WILD_CARD_SPOTS} <strong>wild cards</strong> per conference. Those are the next-best teams by points,
            whichever division they&apos;re in.
          </p>
          <p>
            The Divisions tab shows this live: the red line under 3rd place is the division cut, and the dashed line on
            each rink is the wild card cut.
          </p>
        </Card>
        <Card title="How it's played">
          <p>
            Four rounds, every one a best-of-seven: first team to four wins moves on. The better seed gets home ice in
            games 1, 2, 5 and 7.
          </p>
          <p>The winner lifts the Stanley Cup, the oldest trophy in North American pro sports.</p>
        </Card>
      </div>

      <div className="jumbotron mt-6 overflow-x-auto px-4 pt-6 pb-4">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">
          One conference&apos;s bracket (A and B are its two divisions)
        </p>
        <ol className="grid min-w-[640px] grid-cols-4 gap-3">
          {ROUNDS.map((round) => (
            <li key={round.name} className="flex flex-col">
              <div className="mb-2 font-display text-sm text-led">{round.name}</div>
              <ul className="flex flex-1 flex-col justify-around gap-2">
                {round.matchups.map((m) => (
                  <li
                    key={m}
                    className={`border-l-4 bg-white/5 px-2 py-1.5 font-led text-lg leading-tight ${
                      round.name === "Stanley Cup Final" ? "border-gold text-gold" : "border-red-line"
                    }`}
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ── Whistles ─────────────────────────────────────────────────────────── */

const PENALTIES = [
  {
    clock: "2:00",
    name: "Minor",
    text: "Tripping, hooking, slashing, holding, high-sticking… Ends early if the other team scores.",
  },
  { clock: "4:00", name: "Double minor", text: "Two minors at once, typically a high stick that draws blood." },
  { clock: "5:00", name: "Major", text: "Fighting or a dangerous hit. Served in full, however many goals are scored." },
  {
    clock: "10:00",
    name: "Misconduct",
    text: "The player sits, but the team doesn't play a man down. Usually for arguing with the refs.",
  },
] as const;

function Whistles() {
  return (
    <Section id="calls" title="Whistles You'll Hear About" line="blue">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Offside">
          <p>
            An attacker can&apos;t cross the opponent&apos;s blue line before the puck does. If they do, play stops and
            there&apos;s a faceoff outside the zone. Coaches can challenge a goal that followed an offside.
          </p>
        </Card>
        <Card title="Icing">
          <p>
            Shooting the puck from your own half past the opponent&apos;s goal line, without anyone touching it, is
            icing. The faceoff goes back to your end and your tired players can&apos;t change. A team killing a penalty
            is allowed to ice it.
          </p>
        </Card>
        <Card title="Power play & penalty kill">
          <p>
            When a player goes to the penalty box, their team plays a man short. The other team is on the{" "}
            <strong>power play</strong>; the short team is on the <strong>penalty kill</strong>. A goal by the short
            team is a <em>shorthanded goal</em>.
          </p>
          <p>
            A raised ref&apos;s arm means a <em>delayed penalty</em>: play goes on until the guilty team touches the
            puck, so the other team pulls its goalie for an extra attacker.
          </p>
        </Card>
        <Card title="Hat trick">
          <p>Three goals by one player in a game. Home fans throw their hats on the ice to celebrate. Seriously.</p>
        </Card>
      </div>

      <div className="jumbotron mt-6 px-4 pt-6 pb-4">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white/50 uppercase">The penalty box clock</p>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PENALTIES.map((p) => (
            <div key={p.name}>
              <dt>
                <span className="led block text-4xl leading-none">{p.clock}</span>
                <span className="font-display text-sm">{p.name}</span>
              </dt>
              <dd className="mt-1 text-sm text-white/70">{p.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

/* ── Glossary ─────────────────────────────────────────────────────────── */

function Glossary() {
  const entries = Object.values(GLOSSARY).toSorted((a, b) => a.title.localeCompare(b.title));
  return (
    <Section id="glossary" title="Stat Glossary">
      <p className="mb-4 text-ink-soft">
        The same explanations you get by hovering or tapping a dotted-underlined stat anywhere on the site.
      </p>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(({ title, text }) => (
          <div key={title} className="border-l-4 border-blue-line bg-white/60 py-1.5 pr-2 pl-3">
            <dt className="font-display text-sm tracking-wide">{title}</dt>
            <dd className="text-sm leading-snug text-ink/85">{text}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
