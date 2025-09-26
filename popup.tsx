import React from "react";
import AppRouter from "./src/router/AppRouter";
import "./src/assets/style.css";

function IndexPopup() {
  return (
    <div className="w-[400px] h-[32rem] bg-gray-900 text-white overflow-auto">
      <AppRouter />
    </div>
  );
}

export default IndexPopup;
