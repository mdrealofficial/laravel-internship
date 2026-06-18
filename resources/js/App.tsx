import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Verify from "./pages/Verify";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InternManagement from "./pages/admin/InternManagement";
import BatchMessaging from "./pages/admin/BatchMessaging";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import CertificateManagement from "./pages/admin/CertificateManagement";
import StaffManagement from "./pages/admin/StaffManagement";
import FormManagement from "./pages/admin/FormManagement";
import FormBuilder from "./pages/admin/FormBuilder";
import ApplicationManagement from "./pages/admin/ApplicationManagement";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import RoleTitleManagement from "./pages/admin/RoleTitleManagement";
import InternDashboard from "./pages/intern/InternDashboard";
import InternCertificate from "./pages/intern/InternCertificate";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffAssessments from "./pages/staff/StaffAssessments";
import StaffSettings from "./pages/staff/StaffSettings";
import ApplicationList from "./pages/apply/ApplicationList";
import ApplicationForm from "./pages/apply/ApplicationForm";
import ApplicationStatusCheck from "./pages/apply/ApplicationStatusCheck";
import JobFormManagement from "./pages/admin/JobFormManagement";
import JobFormBuilder from "./pages/admin/JobFormBuilder";
import JobApplicationManagement from "./pages/admin/JobApplicationManagement";
import JobBatchMessaging from "./pages/admin/JobBatchMessaging";
import JobApplicationList from "./pages/apply/JobApplicationList";
import JobApplicationForm from "./pages/apply/JobApplicationForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main application component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Verify />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/verify" element={<Navigate to="/" replace />} />
            
            {/* Public Application Routes */}
            <Route path="/apply" element={<ApplicationList />} />
            <Route path="/apply/:slug" element={<ApplicationForm />} />
            <Route path="/jobs" element={<JobApplicationList />} />
            <Route path="/apply/job/:slug" element={<JobApplicationForm />} />
            <Route path="/status" element={<ApplicationStatusCheck />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/interns" element={<ProtectedRoute allowedRoles={['admin']}><InternManagement /></ProtectedRoute>} />
            <Route path="/admin/batch-messaging" element={<ProtectedRoute allowedRoles={['admin']}><BatchMessaging /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><DepartmentManagement /></ProtectedRoute>} />
            <Route path="/admin/certificates" element={<ProtectedRoute allowedRoles={['admin']}><CertificateManagement /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin']}><StaffManagement /></ProtectedRoute>} />
            <Route path="/admin/forms" element={<ProtectedRoute allowedRoles={['admin']}><FormManagement /></ProtectedRoute>} />
            <Route path="/admin/forms/new" element={<ProtectedRoute allowedRoles={['admin']}><FormBuilder /></ProtectedRoute>} />
            <Route path="/admin/forms/:id" element={<ProtectedRoute allowedRoles={['admin']}><FormBuilder /></ProtectedRoute>} />
            <Route path="/admin/job-forms" element={<ProtectedRoute allowedRoles={['admin']}><JobFormManagement /></ProtectedRoute>} />
            <Route path="/admin/job-forms/new" element={<ProtectedRoute allowedRoles={['admin']}><JobFormBuilder /></ProtectedRoute>} />
            <Route path="/admin/job-forms/:id" element={<ProtectedRoute allowedRoles={['admin']}><JobFormBuilder /></ProtectedRoute>} />
            <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['admin']}><ApplicationManagement /></ProtectedRoute>} />
            <Route path="/admin/job-applications" element={<ProtectedRoute allowedRoles={['admin']}><JobApplicationManagement /></ProtectedRoute>} />
            <Route path="/admin/job-batch-messaging" element={<ProtectedRoute allowedRoles={['admin']}><JobBatchMessaging /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleTitleManagement /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
            
            {/* Staff Routes */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/assessments" element={<ProtectedRoute allowedRoles={['staff']}><StaffAssessments /></ProtectedRoute>} />
            <Route path="/staff/settings" element={<ProtectedRoute allowedRoles={['staff']}><StaffSettings /></ProtectedRoute>} />
            
            {/* Intern Routes */}
            <Route path="/intern" element={<ProtectedRoute allowedRoles={['intern']}><InternDashboard /></ProtectedRoute>} />
            <Route path="/intern/certificate" element={<ProtectedRoute allowedRoles={['intern']}><InternCertificate /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
