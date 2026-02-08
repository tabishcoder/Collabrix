import { FaBars } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function TopNavbar() {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="h-14 bg-[var(--color-card)] border-b border-white/10 flex items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button className="md:hidden text-[var(--color-text-primary)]">
          <FaBars size={18} />
        </button>

        <span className="text-sm text-[var(--color-text-secondary)]">
          Workspace
        </span>
        <span className="font-semibold text-[var(--color-text-primary)]">
          Collabrix
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-[var(--color-text-secondary)]">
          {user?.name}
        </span>

        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-semibold">
          {user?.name?.[0] || "U"}
        </div>
      </div>
    </header>
  );
}
