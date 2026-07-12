import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import { Logo } from "@/components/logo";

const navigationItems = [
  {
    label: "Game modes",
    href: "/#game-modes",
  },
  {
    label: "How it works",
    href: "/#how-it-works",
  },
  {
    label: "About",
    href: "/#about",
  },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.055] bg-[#03090d]/75 backdrop-blur-2xl">
      <nav className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 sm:px-7 lg:px-10">
        <a
          href="/"
          aria-label="Go to RiftScout home"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#0ac8b9]"
        >
          <Logo />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navigationItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[#8fa1aa] transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <a
          href="/#game-modes"
          className="group inline-flex min-h-10 items-center justify-center gap-2 border border-[#c89b3c]/35 bg-[#c89b3c]/8 px-4 text-sm font-semibold text-[#efd990] transition duration-300 hover:border-[#c89b3c]/70 hover:bg-[#c89b3c]/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c89b3c]"
        >
          Open scout

          <FontAwesomeIcon
            icon={faArrowRight}
            className="text-xs transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </a>
      </nav>
    </header>
  );
}