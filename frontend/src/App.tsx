import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/login";
import SignUp from "./pages/auth/signup";
import ForgotPassword from "./pages/auth/forgot-password";
import ConfirmAccount from "./pages/auth/confirm-account";
import ResetPassword from "./pages/auth/reset-password";
import VerifyMfa from "./pages/auth/verify-mfa";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import AccountsPage from "./pages/accounts";
import TransactionsPage from "./pages/transactions";
import PeoplePage from "./pages/people";
import BillsPage from "./pages/bills";
import Session from "./pages/sessions";
import AdminUsersPage from "./pages/admin/users";
import AppLayout from "./layout/AppLayout";
import BaseLayout from "./layout/BaseLayout";
import AuthRoute from "./routes/auth.route";
import PublicRoute from "./routes/public.route";
import AdminRoute from "./routes/admin.route";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route element={<BaseLayout />}>
            <Route path="" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="confirm-account" element={<ConfirmAccount />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="verify-mfa" element={<VerifyMfa />} />
          </Route>
        </Route>

        {/* Protected PesaFlow Routes */}
        <Route element={<AuthRoute />}>
          <Route element={<AppLayout />}>
            <Route path="home" element={<Dashboard />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="bills" element={<BillsPage />} />
            <Route path="security" element={<Home />} />
            <Route path="sessions" element={<Session />} />

            {/* Super Admin Console */}
            <Route element={<AdminRoute />}>
              <Route path="admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>
        {/* Catch-all for undefined routes */}
        <Route path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
