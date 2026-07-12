import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChartLine,
  faCircleCheck,
  faCrosshairs,
  faShieldHalved,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

import { GameModeSelector } from "@/components/game-mode-selector";
import { Logo } from "@/components/logo";
import { Navbar } from "@/components/navbar";

const scoutFeatures = [
  {
    icon: faUserGroup,
    title: "Opponent scouting",
    description:
      "Understand champion pools, likely roles and opponent comfort picks.",
  },
  {
    icon: faCrosshairs,
    title: "Smarter target bans",
    description:
      "Combine matchup danger and player history into one clear recommendation.",
  },
  {
    icon: faChartLine,
    title: "Useful insights",
    description:
      "Get explanations instead of being shown a wall of disconnected statistics.",
  },
];

export default function HomePage() {
  return (
    <div id="top" className="rift-background">
      <Navbar />

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-74px)] max-w-[1240px] items-center gap-16 px-5 py-20 sm:px-7 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 border border-[#c89b3c]/20 bg-[#c89b3c]/7 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c89b3c] shadow-[0_0_10px_rgba(200,155,60,0.8)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9b85f]">
                League draft assistant
              </span>
            </div>

            <h1 className="font-display text-balance max-w-3xl text-[2.8rem] font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-6xl lg:text-[4.5rem]">
              Scout the lobby.
              <br />
              <span className="gold-text">Own the draft.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#91a2aa] sm:text-lg">
              RiftScout helps you understand opponents, identify dangerous
              comfort picks and make smarter ban decisions before the game
              begins.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#game-modes"
                className="group inline-flex min-h-12 items-center justify-center gap-3 bg-[#0ac8b9] px-6 text-sm font-bold uppercase tracking-[0.1em] text-[#02110f] shadow-[0_14px_38px_rgba(10,200,185,0.16)] transition duration-300 hover:bg-[#32d8cb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65e3d7]"
              >
                Start scouting

                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-xs transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center border border-white/[0.11] bg-white/[0.025] px-6 text-sm font-semibold text-[#b3c0c6] transition duration-300 hover:border-white/[0.2] hover:bg-white/[0.055] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
              <HeroCheck text="No account required" />
              <HeroCheck text="Built for every role" />
              <HeroCheck text="Clear recommendations" />
            </div>
          </div>

          <ScoutPreview />
        </section>

        <GameModeSelector />

        <section
          id="how-it-works"
          className="border-y border-white/[0.055] bg-black/10"
        >
          <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-7 lg:px-10">
            <div className="mb-12 max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c89b3c]">
                Built for better decisions
              </span>

              <h2 className="font-display mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Useful information, without the noise.
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#84969f] sm:text-base">
                RiftScout turns player history and matchup information into
                practical recommendations you can understand immediately.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {scoutFeatures.map((feature, index) => (
                <article
                  key={feature.title}
                  className="group border border-white/[0.075] bg-white/[0.018] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c89b3c]/25 hover:bg-white/[0.032]"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center border border-[#c89b3c]/20 bg-[#c89b3c]/7 text-[#d9b85f]">
                      <FontAwesomeIcon icon={feature.icon} />
                    </div>

                    <span className="text-[10px] font-bold tracking-[0.18em] text-[#53666f]">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mb-3 text-base font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-6 text-[#7d9099]">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        id="about"
        className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-10 sm:px-7 md:flex-row md:items-center md:justify-between lg:px-10"
      >
        <Logo />

        <p className="max-w-lg text-xs leading-5 text-[#60727b] md:text-right">
          RiftScout is an independent project and is not endorsed by Riot Games.
          League of Legends and Riot Games are trademarks of Riot Games, Inc.
        </p>
      </footer>
    </div>
  );
}

type HeroCheckProps = {
  text: string;
};

function HeroCheck({ text }: HeroCheckProps) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-[#82949d]">
      <FontAwesomeIcon
        icon={faCircleCheck}
        className="text-[#0ac8b9]"
      />
      {text}
    </div>
  );
}

function ScoutPreview() {
  const enemyPlayers = [
    {
      role: "TOP",
      player: "IronClad#EUW",
      champion: "Yone",
      score: "72",
    },
    {
      role: "JGL",
      player: "Pathfinder#EUW",
      champion: "Nocturne",
      score: "84",
    },
    {
      role: "MID",
      player: "BlinkReset#EUW",
      champion: "Katarina",
      score: "93",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[530px]">
      <div className="absolute -inset-10 -z-10 bg-[#0ac8b9]/5 blur-3xl" />

      <div className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#627781]">
              Live scout preview
            </span>

            <h2 className="mt-1 text-sm font-semibold text-white">
              Enemy team analysis
            </h2>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#68dcd2]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0ac8b9] shadow-[0_0_10px_rgba(10,200,185,0.75)]" />
            Ready
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 grid grid-cols-[48px_1fr_70px] gap-3 px-3 text-[9px] font-bold uppercase tracking-[0.17em] text-[#53666f]">
            <span>Role</span>
            <span>Player / comfort</span>
            <span className="text-right">Threat</span>
          </div>

          <div className="space-y-2">
            {enemyPlayers.map((enemy, index) => (
              <div
                key={enemy.role}
                className={[
                  "grid grid-cols-[48px_1fr_70px] items-center gap-3 border px-3 py-3",
                  index === 2
                    ? "border-[#c89b3c]/24 bg-[#c89b3c]/6"
                    : "border-white/[0.06] bg-white/[0.018]",
                ].join(" ")}
              >
                <span className="text-[10px] font-bold tracking-[0.13em] text-[#71848d]">
                  {enemy.role}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#d7e0e4]">
                    {enemy.player}
                  </p>

                  <p className="mt-1 text-[10px] text-[#778a94]">
                    Comfort pick:{" "}
                    <span className="text-[#b8c6cc]">{enemy.champion}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={[
                      "font-display text-lg font-semibold",
                      index === 2 ? "text-[#e2bd65]" : "text-[#a8b7be]",
                    ].join(" ")}
                  >
                    {enemy.score}
                  </span>

                  <span className="ml-0.5 text-[9px] text-[#52656e]">
                    /100
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border border-[#c89b3c]/25 bg-[linear-gradient(135deg,rgba(200,155,60,0.12),rgba(200,155,60,0.035))] p-4">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center border border-[#c89b3c]/25 bg-[#c89b3c]/10 text-[#e2bd65]">
                <FontAwesomeIcon icon={faShieldHalved} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#a78945]">
                  Recommended ban
                </span>

                <div className="mt-1 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold text-white">
                      Katarina
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[#8e9fa7]">
                      Enemy comfort pick and high matchup pressure.
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-bold text-[#e2bd65]">
                    93%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 hidden border border-white/[0.07] bg-[#071018]/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:block">
        <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#61747e]">
          Analysis
        </span>

        <p className="mt-1 text-xs font-semibold text-[#b5c2c8]">
          3 opponents found
        </p>
      </div>
    </div>
  );
}