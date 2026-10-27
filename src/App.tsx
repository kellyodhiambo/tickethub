import { BrowserRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AppRoutes } from "./router";
import { AppProvider } from "@/store/AppStore";
import { AuthProvider } from "@/store/AuthProvider";
import { ThemeProvider } from "@/store/ThemeProvider";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <ScrollToTop />
              <AppRoutes />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;