import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";
import EventScheduleLink from "./EventScheduleLink";

function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
      <EventScheduleLink />
    </div>
  );
}

export default PublicLayout;