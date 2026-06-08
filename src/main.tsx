import React from "react";
import { createRoot } from "react-dom/client";

import "@/assets/fonts/Overseer/overseer.css";
import "@/assets/fonts/Overseer/overseer.ttf";

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#common_weight_name_mapping
// All weights need to be loaded for fonts to be rendered correctly:
import "@fontsource/roboto-condensed/300.css"; // light
import "@fontsource/roboto-condensed/400.css"; // normal (regular)
import "@fontsource/roboto-condensed/700.css"; // bold
import "@fontsource/roboto/300.css"; // light
import "@fontsource/roboto/400.css"; // normal (regular)
import "@fontsource/roboto/700.css"; // bold

import "@fontsource/noto-mono";

import "@/assets/styles/index.scss";

import App from "@/App";
import { isRelease } from "@/commands/additions";

import "@/lib/logging";

import "@/lib/i18n";

async function setup() {
  if (await isRelease()) {
    // https://codinhood.com/nano/dom/disable-context-menu-right-click-javascript
    // Disable context menu if in release build:
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
setup().catch((reason) => console.error(`Error in setup(): ${reason}`));

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
