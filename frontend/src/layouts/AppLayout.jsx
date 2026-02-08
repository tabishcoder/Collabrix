import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

export default function AppLayout() {
  return (
    <div>
      <Navbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}
