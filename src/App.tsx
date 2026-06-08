import {
  I18nBoundary,
  ProfilesBoundary,
  SettingsBoundary,
} from "@/components/boundaries";
import MyThemeProvider from "@/components/MyThemeProvider";
import Fallback from "@/views/errors/Fallback";
import { ErrorBoundary } from "react-error-boundary";
import { RouterProvider } from "react-router-dom";
import Layout from "./Layout";
import getRouter from "./router";

export default function App() {
  return (
    <MyThemeProvider>
      <ErrorBoundary FallbackComponent={Fallback}>
        <SettingsBoundary>
          <ProfilesBoundary>
            <I18nBoundary>
              <RouterProvider router={getRouter(<Layout />)} />
            </I18nBoundary>
          </ProfilesBoundary>
        </SettingsBoundary>
      </ErrorBoundary>
    </MyThemeProvider>
  );
}
