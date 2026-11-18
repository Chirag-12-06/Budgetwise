import { Route, Routes } from "react-router-dom";

import useWindowResize from "./hooks/ui/useWindowResize";

import AuthProvider from "./providers/AuthProvider";
import ExpenseProvider from "./providers/ExpenseProvider";
import PreferenceProvider from "./providers/PreferenceProvider";

import { AppLayout, AuthLayout, StatusBanner } from "./layout";

import {
  AddExpensePage,
  AnalyticsPage,
  ExpensesPage,
  ProfilePage,
} from "./pages";

import {
  ForgotPasswordPage,
  LoginPage,
  ResetPasswordPage,
  SignupPage,
} from "./pages/auth";

import ProtectedRoute from "./routes/ProtectedRoute";
import { ROUTES } from "./routes/routes";

function App() {
  useWindowResize();

  return (
    <AuthProvider>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={<ForgotPasswordPage />}
          />
        </Route>

        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        <Route
          element={
            <PreferenceProvider>
              <ExpenseProvider>
                <ProtectedRoute />
              </ExpenseProvider>
            </PreferenceProvider>
          }
        >
          <Route element={<AppLayout />}>
            <Route path={ROUTES.HOME} element={<AddExpensePage />} />

            <Route path={ROUTES.EXPENSES} element={<ExpensesPage />} />

            <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />

            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>

      <StatusBanner />
    </AuthProvider>
  );
}

export default App;
