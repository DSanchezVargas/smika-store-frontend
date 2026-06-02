import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";
import EventScheduleLink from "./EventScheduleLink";
import ClientIssueButton from "../support/ClientIssueButton";
import { pingBackendHealth } from "../../services/api";

function PublicLayout() {
  useEffect(() => {
    pingBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
      <EventScheduleLink />
      <ClientIssueButton />
    </div>
  );
}

export default PublicLayout;