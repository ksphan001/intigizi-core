import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import NotificationModal from './components/NotificationModal.jsx';
import { useNotification } from './context/NotificationContext.jsx';

// Layouts
import DashboardLayout from './components/DashboardLayout.jsx';
import PublicLayout from './components/PublicLayout.jsx';

// Halaman Publik
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import InfoSatgasPage from './pages/InfoSatgasPage.jsx';
import TutorialPage from './pages/TutorialPage.jsx';
import InfoPlangPage from './pages/InfoPlangPage.jsx';
import FaqPage from './pages/FaqPage.jsx';
import VendorDirectoryPage from './pages/VendorDirectoryPage.jsx';
import VendorDetailPage from './pages/VendorDetailPage.jsx';
import TrackDistributionPage from './pages/TrackDistributionPage.jsx';
import InfoPermodalanPage from './pages/InfoPermodalanPage.jsx';
import KitchenProfilePage from './pages/KitchenProfilePage.jsx';
import PublicFundingListPage from './pages/PublicFundingListPage.jsx';
import PublicFundingDetailPage from './pages/PublicFundingDetailPage.jsx';
import LabelInfoPage from './pages/LabelInfoPage.jsx';

// Halaman Terproteksi
import DashboardPage from './pages/DashboardPage.jsx';
import ProposalsPage from './pages/ProposalsPage.jsx';
import ProposalDetailPage from './pages/ProposalDetailPage.jsx';
import ProcurementPage from './pages/ProcurementPage.jsx';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage.jsx';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage.jsx';
import StockPage from './pages/StockPage.jsx';
import DistributionReportsPage from './pages/DistributionReportsPage.jsx';
import MenusPage from './pages/MenusPage.jsx';
import RecipeManagementPage from './pages/RecipeManagementPage.jsx';
import IngredientsPage from './pages/IngredientsPage.jsx';
import SuppliersPage from './pages/SuppliersPage.jsx';
import MarketplaceSuppliersPage from './pages/MarketplaceSuppliersPage.jsx';
import DistributionPointsPage from './pages/DistributionPointsPage.jsx';
import BeneficiariesPage from './pages/BeneficiariesPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import KitchenGalleryPage from './pages/KitchenGalleryPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import ProductionTasksPage from './pages/ProductionTasksPage.jsx';
import VolunteersPage from './pages/VolunteersPage.jsx';
import FundingApplicationPage from './pages/FundingApplicationPage.jsx';
import QuickDistributionPage from './pages/QuickDistributionPage.jsx';
import ManageSppgPage from './pages/ManageSppgPage.jsx';

// Laporan
import DistributionPerformancePage from './pages/Reports/DistributionPerformancePage.jsx';
import PurchaseReportPage from './pages/Reports/PurchaseReportPage.jsx';
import IngredientUsageReportPage from './pages/Reports/IngredientUsageReportPage.jsx';
import BudgetSummaryReportPage from './pages/Reports/BudgetSummaryReportPage.jsx';
import ProductionHistoryPage from './pages/ProductionHistoryPage.jsx';
import FinancialReportPage from './pages/Financials/FinancialReportPage.jsx';
import BkuReportPage from './pages/Financials/BkuReportPage.jsx';
import PrintableReportsPage from './pages/Reports/PrintableReportsPage.jsx';
import BpPenerimaanPage from './pages/Reports/BpPenerimaanPage.jsx';
import BpPengeluaranPage from './pages/Reports/BpPengeluaranPage.jsx';
import BpPajakPage from './pages/Reports/BpPajakPage.jsx';
import ResumeReportPage from './pages/Reports/ResumeReportPage.jsx';

// Halaman Keuangan
import JournalPage from './pages/Financials/JournalPage.jsx';
import HonorariumPage from './pages/Financials/HonorariumPage.jsx';

// Halaman Super Admin
import SuperAdminDashboardPage from './pages/SuperAdmin/DashboardPage.jsx';
import KitchenPartnersPage from './pages/SuperAdmin/KitchenPartnersPage.jsx';
import VendorsPage from './pages/SuperAdmin/VendorsPage.jsx';
import OrganizationDetailPage from './pages/SuperAdmin/OrganizationDetailPage.jsx';
import PendingRegistrationsPage from './pages/SuperAdmin/PendingRegistrationsPage.jsx';
import VendorCategoriesPage from './pages/SuperAdmin/VendorCategoriesPage.jsx';
import ExpenseCategoriesPage from './pages/SuperAdmin/ExpenseCategoriesPage.jsx';
import BeneficiaryCategoriesPage from './pages/SuperAdmin/BeneficiaryCategoriesPage.jsx';
import FundingApplicationsPage from './pages/SuperAdmin/FundingApplicationsPage.jsx';
import FundingApplicationDetailPage from './pages/SuperAdmin/FundingApplicationDetailPage.jsx';
import SuperAdminAnalyticsPage from './pages/SuperAdmin/AnalyticsPage.jsx';
import SubscriptionSettingsPage from './pages/SuperAdmin/SubscriptionSettingsPage.jsx';
import SubscriptionVerificationPage from './pages/SuperAdmin/SubscriptionVerificationPage.jsx';
import SubscriptionHistoryPage from './pages/SuperAdmin/SubscriptionHistoryPage.jsx';
// --- RUTE BARU ---
import InvestmentVerificationPage from './pages/SuperAdmin/InvestmentVerificationPage.jsx';
import BackupRestorePage from './pages/SuperAdmin/BackupRestorePage.jsx';
import MasterIngredientsPage from './pages/SuperAdmin/MasterIngredientsPage.jsx';

// Halaman Vendor & Supplier
import VendorDashboardPage from './pages/Vendor/DashboardPage.jsx';
import VendorProfilePage from './pages/Vendor/ProfilePage.jsx';
import VendorOrdersPage from './pages/Vendor/OrdersPage.jsx';
import SupplierDashboardPage from './pages/Supplier/DashboardPage.jsx';

// Halaman Investor
import InvestorDashboardPage from './pages/Investor/DashboardPage.jsx';
import InvestorKitchenActivityPage from './pages/Investor/KitchenActivityPage.jsx';

// Halaman Calon Mitra
import CalonMitraDashboardPage from './pages/CalonMitra/DashboardPage.jsx';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  return token ? children : <Navigate to="/login" />;
};

import { PrinterProvider } from './context/PrinterContext.jsx';

function App() {
  const { notification, hideNotification } = useNotification();

  return (
    <PrinterProvider>
      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/info-tim" element={<InfoSatgasPage />} />
          <Route path="/info-permodalan" element={<InfoPermodalanPage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/info-sertifikasi" element={<InfoPlangPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/lacak-distribusi" element={<TrackDistributionPage />} />
          <Route path="/dapur/:slug" element={<KitchenProfilePage />} />
          <Route path="/funding" element={<PublicFundingListPage />} />
          <Route path="/funding/:campaignId" element={<PublicFundingDetailPage />} />
          <Route path="/check-label" element={<LabelInfoPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="proposals" element={<ProposalsPage />} />
          <Route path="proposals/:proposalId" element={<ProposalDetailPage />} />
          <Route path="procurement/:proposalId" element={<ProcurementPage />} />
          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="purchase-orders/:poId" element={<PurchaseOrderDetailPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="production-tasks" element={<ProductionTasksPage />} />
          <Route path="distribution-reports" element={<DistributionReportsPage />} />
          <Route path="quick-distribution" element={<QuickDistributionPage />} />
          <Route path="menus" element={<MenusPage />} />
          <Route path="menus/:menuId" element={<RecipeManagementPage />} />
          <Route path="ingredients" element={<IngredientsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="sentra-intigizi" element={<MarketplaceSuppliersPage />} />
          <Route path="distribution-points" element={<DistributionPointsPage />} />
          <Route path="beneficiaries" element={<BeneficiariesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="kitchen-gallery" element={<KitchenGalleryPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="volunteers" element={<VolunteersPage />} />
          <Route path="funding/apply" element={<FundingApplicationPage />} />
          <Route path="funding/dashboard" element={<CalonMitraDashboardPage />} />
          <Route path="manage-sppgs" element={<ManageSppgPage />} />

          <Route path="financials/journal" element={<JournalPage />} />
          <Route path="financials/honorarium" element={<HonorariumPage />} />

          <Route path="reports/bku" element={<BkuReportPage />} />
          <Route path="reports/printable" element={<PrintableReportsPage />} />
          <Route path="reports/production" element={<ProductionHistoryPage />} />
          <Route path="reports/distribution" element={<DistributionPerformancePage />} />
          <Route path="reports/purchasing" element={<PurchaseReportPage />} />
          <Route path="reports/usage" element={<IngredientUsageReportPage />} />
          <Route path="reports/budget" element={<BudgetSummaryReportPage />} />
          <Route path="reports/financials" element={<FinancialReportPage />} />
          <Route path="reports/bp-penerimaan" element={<BpPenerimaanPage />} />
          <Route path="reports/bp-pengeluaran" element={<BpPengeluaranPage />} />
          <Route path="reports/bp-pajak" element={<BpPajakPage />} />
          <Route path="reports/resume" element={<ResumeReportPage />} />

          <Route path="admin/dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="admin/analytics" element={<SuperAdminAnalyticsPage />} />
          <Route path="admin/kitchen-partners" element={<KitchenPartnersPage />} />
          <Route path="admin/vendors" element={<Navigate to="/app/admin/dashboard" replace />} />
          <Route path="admin/organizations/:orgId" element={<OrganizationDetailPage />} />
          <Route path="admin/pending-registrations" element={<PendingRegistrationsPage />} />
          <Route path="admin/vendor-categories" element={<Navigate to="/app/admin/dashboard" replace />} />
          <Route path="admin/expense-categories" element={<ExpenseCategoriesPage />} />
          <Route path="admin/beneficiary-categories" element={<BeneficiaryCategoriesPage />} />
          <Route path="admin/funding-applications" element={<FundingApplicationsPage />} />
          <Route path="admin/funding-applications/:applicationId" element={<FundingApplicationDetailPage />} />
          <Route path="admin/subscription-settings" element={<SubscriptionSettingsPage />} />
          <Route path="admin/subscription-verification" element={<SubscriptionVerificationPage />} />
          <Route path="admin/subscription-history" element={<SubscriptionHistoryPage />} />
          {/* --- RUTE BARU DITAMBAHKAN --- */}
          <Route path="admin/investment-verification" element={<InvestmentVerificationPage />} />
          <Route path="admin/backup-restore" element={<BackupRestorePage />} />
          <Route path="admin/master-ingredients" element={<MasterIngredientsPage />} />

          <Route path="vendor/dashboard" element={<VendorDashboardPage />} />
          <Route path="vendor/profile" element={<VendorProfilePage />} />
          <Route path="vendor/orders" element={<VendorOrdersPage />} />

          <Route path="supplier/dashboard" element={<SupplierDashboardPage />} />

          <Route path="investor/dashboard" element={<InvestorDashboardPage />} />
          <Route path="investor/kitchen/:orgId" element={<InvestorKitchenActivityPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </PrinterProvider>
  );
}

export default App;