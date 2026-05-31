import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";
import EventScheduleLink from "./EventScheduleLink";
import ClientIssueButton from "../support/ClientIssueButton";

function PublicLayout() {
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