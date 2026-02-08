import React from "react";
import { Outlet } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import UserFooter from "./UserFooter";

const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar สำหรับฝั่ง User */}
      <UserNavbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Outlet />
        </div>
      </main>

      {/* Footer สำหรับฝั่ง User */}
      <UserFooter />
    </div>
  );
};

export default UserLayout;
