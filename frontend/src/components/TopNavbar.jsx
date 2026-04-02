import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaBars,
  FaChevronDown,
  FaBell,
  FaSearch,
  FaFolder,
  FaPlus,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";

// 1. Import your logo (Update the path if your folder is named 'assets' vs 'assests')
import {assests} from "../assets/images/assests.js";
import LogoutButton from "./LogoutButton";

export default function TopNavbar({ onToggleSidebar }) {
  const dispatch = useDispatch();

  // Redux State
  const { user } = useSelector((state) => state.auth);
  const { activeSpace } = useSelector((s) => s.spaces);
  const { activeProject, allProjects } = useSelector((s) => s.projects);

  // Local UI State
  const [openDropdown, setOpenDropdown] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    return (
      allProjects?.filter((p) =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase()),
      ) || []
    );
  }, [allProjects, projectSearch]);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header className="h-16 bg-[#0d0d0e]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* LEFT: Logo + Brand + Hierarchy Navigation */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* BRAND SECTION */}
        <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
          <img
            src={assests.logo}
            alt="Collabrix Logo"
            className="w-20 object-contain rounded-md"
          />
          
        </div>

        {/* Mobile Sidebar Toggle (Shows after Brand on mobile) */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/5 rounded-lg text-white/70 md:hidden"
        >
          <FaBars size={18} />
        </button>

        {/* BREADCRUMBS / NAVIGATION HIERARCHY */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* 1. Workspace Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("workspace")}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition group"
            >
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20">
                {activeSpace?.name?.[0] || "W"}
              </div>
              <span className="hidden lg:block font-semibold text-sm text-white/90">
                {activeSpace?.name || "Workspace"}
              </span>
              <FaChevronDown
                className={`text-[10px] text-white/30 transition-transform ${openDropdown === "workspace" ? "rotate-180" : ""}`}
              />
            </button>

            {openDropdown === "workspace" && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-[#161617] border border-white/10 shadow-2xl rounded-xl p-1 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  Switch Space
                </div>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white bg-white/5 rounded-lg transition">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  {activeSpace?.name}
                </button>
                <div className="h-[1px] bg-white/5 my-1" />
                <button className="w-full text-left px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition">
                  + Create New Workspace
                </button>
              </div>
            )}
          </div>

          <span className="text-white/10 text-xl font-thin select-none">/</span>

          {/* 2. Searchable Project Switcher */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("project")}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition group border border-transparent hover:border-white/10"
            >
              <FaFolder className="text-emerald-400/80" size={14} />
              <span className="font-medium text-sm text-white max-w-[100px] md:max-w-none truncate">
                {activeProject?.name || "Select Project"}
              </span>
              <FaChevronDown
                className={`text-[10px] text-white/30 transition-transform ${openDropdown === "project" ? "rotate-180" : ""}`}
              />
            </button>

            {openDropdown === "project" && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-[#161617] border border-white/10 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-white/5">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs" />
                    <input
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Find project..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-indigo-600 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${project.id === activeProject?.id ? "bg-emerald-400" : "bg-white/10"}`}
                        />
                        {project.name}
                      </div>
                      {project.id === activeProject?.id && (
                        <FaCheckCircle className="text-emerald-400 text-xs" />
                      )}
                    </button>
                  ))}
                  {filteredProjects.length === 0 && (
                    <div className="p-4 text-center text-xs text-white/30">
                      No projects found
                    </div>
                  )}
                </div>
                <button className="w-full p-3 text-xs text-indigo-400 hover:bg-indigo-500/10 border-t border-white/5 font-semibold transition">
                  <FaPlus className="inline mr-2" /> Create New Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Tools & User */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Global Timer Widget */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mr-2 group cursor-pointer hover:bg-emerald-500/20 transition">
          <FaClock className="text-emerald-500 animate-pulse text-xs" />
          <span className="text-xs font-mono font-bold text-emerald-500">
            01:24:05
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("notif")}
            className="p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition relative"
          >
            <FaBell size={18} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d0d0e]"></span>
          </button>
          {/* Notifications Dropdown (Omitted for brevity, kept structure) */}
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-1 hidden md:block" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("profile")}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-white/5 transition"
          >
            <span className="hidden md:block text-xs font-medium text-white/60">
              {user?.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {user?.name?.[0] || "U"}
            </div>
          </button>

          {openDropdown === "profile" && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#161617] border border-white/10 shadow-2xl rounded-xl p-1.5 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 mb-1">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-white/40 truncate">
                  {user?.email || "owner"}
                </p>
              </div>
              <div className="h-[1px] bg-white/5 my-1" />
              <button className="w-full text-left px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition">
                Profile Settings
              </button>
              <div className="h-[1px] bg-white/5 my-1" />
              <LogoutButton variant="dropdown" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
