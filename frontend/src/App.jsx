import { Route, Routes } from "react-router-dom";

import useWindowResize from "./hooks/ui/useWindowResize";
import useAppController from "./hooks/useAppController";

import ExpenseProvider from "./providers/ExpenseProvider";
import PreferenceProvider from "./providers/PreferenceProvider";

import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";
import StatusBanner from "./layout/StatusBanner";

import AddExpensePage from "./pages/AddExpensePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProfilePage from "./pages/ProfilePage";

import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import SignupPage from "./pages/auth/SignupPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import { ROUTES } from "./routes/routes";

function App() {
  useWindowResize();

  const {
    dark,
    setDark,
    status,
    showStatus,
    clearStatus,
    handleApiError,

    submitting,
    updatingProfile,

    analyticsGroupBy,
    handleAnalyticsGroupByChange,

    loginForm,
    setLoginForm,
    signupForm,
    setSignupForm,

    handleLogin,
    handleSignup,
    handleForgotPassword,
    handleUpdateProfile,
    handleLogout,

    user,
    authLoading,
  } = useAppController();

  const loginPageProps = {
    handleLogin,
    loginForm,
    setLoginForm,
    submitting,
    dark,
    setDark,
  };

  const signupPageProps = {
    handleSignup,
    signupForm,
    setSignupForm,
    submitting,
    dark,
    setDark,
  };

  const forgotPasswordPageProps = {
    handleForgotPassword,
    dark,
    setDark,
  };

  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route
            path={ROUTES.LOGIN}
            element={<LoginPage {...loginPageProps} />}
          />

          <Route
            path={ROUTES.SIGNUP}
            element={<SignupPage {...signupPageProps} />}
          />

          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={<ForgotPasswordPage {...forgotPasswordPageProps} />}
          />
        </Route>

        <Route
          path={ROUTES.RESET_PASSWORD}
          element={
            <ResetPasswordPage
              showStatus={showStatus}
              dark={dark}
              setDark={setDark}
            />
          }
        />

        <Route
          element={
            <PreferenceProvider showStatus={showStatus}>
              <ExpenseProvider
                user={user}
                authLoading={authLoading}
                handleApiError={handleApiError}
                showStatus={showStatus}
                clearStatus={clearStatus}
              >
                <ProtectedRoute user={user} loading={authLoading} />
              </ExpenseProvider>
            </PreferenceProvider>
          }
        >
          <Route
            element={
              <AppLayout
                user={user}
                handleLogout={handleLogout}
                dark={dark}
                setDark={setDark}
              />
            }
          >
            <Route path={ROUTES.HOME} element={<AddExpensePage />} />

            <Route path={ROUTES.EXPENSES} element={<ExpensesPage />} />

            <Route
              path={ROUTES.ANALYTICS}
              element={
                <AnalyticsPage
                  analyticsGroupBy={analyticsGroupBy}
                  handleAnalyticsGroupByChange={handleAnalyticsGroupByChange}
                />
              }
            />

            <Route
              path={ROUTES.PROFILE}
              element={
                <ProfilePage
                  user={user}
                  onUpdateProfile={handleUpdateProfile}
                  updatingProfile={updatingProfile}
                  showStatus={showStatus}
                />
              }
            />
          </Route>
        </Route>
      </Routes>

      <StatusBanner status={status} />
    </>
  );
}

export default App;
