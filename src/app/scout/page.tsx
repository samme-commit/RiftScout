import { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import { Navbar } from "@/components/navbar";
import { OpponentScout } from "@/components/opponent-scout";

export default function ScoutPage() {
  return (
    <div className="rift-background min-h-screen">
      <Navbar />

      <main>
        <Suspense fallback={<ScoutPageLoading />}>
          <OpponentScout />
        </Suspense>
      </main>
    </div>
  );
}

function ScoutPageLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[1240px] items-center justify-center px-5">
      <div className="text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-2xl text-[#0ac8b9]"
        />

        <p className="mt-4 text-sm font-semibold text-[#a9b7bd]">
          Preparing opponent scout
        </p>
      </div>
    </div>
  );
}