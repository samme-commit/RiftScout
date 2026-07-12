import { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import { Navbar } from "@/components/navbar";
import { SetupWizard } from "@/components/setup-wizard";

export default function SetupPage() {
  return (
    <div className="rift-background min-h-screen">
      <Navbar />

      <main>
        <Suspense fallback={<SetupPageLoading />}>
          <SetupWizard />
        </Suspense>
      </main>
    </div>
  );
}

function SetupPageLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[1240px] items-center justify-center px-5">
      <div className="text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          className="text-2xl text-[#0ac8b9]"
        />

        <p className="mt-4 text-sm font-semibold text-[#a9b7bd]">
          Preparing RiftScout
        </p>
      </div>
    </div>
  );
}