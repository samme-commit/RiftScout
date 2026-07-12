import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompass } from "@fortawesome/free-solid-svg-icons";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center">
        <div className="absolute inset-0 rotate-45 border border-[#c89b3c]/45 bg-[#c89b3c]/5" />

        <div className="relative grid h-7 w-7 place-items-center border border-[#0ac8b9]/30 bg-[#07151d] text-[#e6c773] shadow-[0_0_22px_rgba(10,200,185,0.13)]">
          <FontAwesomeIcon icon={faCompass} className="text-sm" />
        </div>
      </div>

      {!compact && (
        <div>
          <span className="font-display block text-[17px] font-semibold tracking-[0.13em] text-white">
            RIFT<span className="text-[#d5ad55]">SCOUT</span>
          </span>

          <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-[#72858f]">
            Draft intelligence
          </span>
        </div>
      )}
    </div>
  );
}