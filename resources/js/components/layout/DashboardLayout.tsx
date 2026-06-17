import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Award, 
  FileText, 
  LogOut,
  Menu,
  X,
  Settings,
  UserCog,
  ClipboardCheck,
  FileEdit,
  Inbox,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/forms', label: 'Forms', icon: FileEdit },
  { path: '/admin/applications', label: 'Applications', icon: Inbox },
  { path: '/admin/interns', label: 'Interns', icon: Users },
  { path: '/admin/staff', label: 'Staff', icon: UserCog },
  { path: '/admin/departments', label: 'Departments', icon: Building2 },
  { path: '/admin/certificates', label: 'Certificates', icon: Award },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

const staffNavItems = [
  { path: '/staff', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/staff/assessments', label: 'Assessments', icon: ClipboardCheck },
  { path: '/staff/settings', label: 'Settings', icon: Settings },
];

const internNavItems = [
  { path: '/intern', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/intern/certificate', label: 'Certificate', icon: Award },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const navItems = userRole === 'admin' 
    ? adminNavItems 
    : userRole === 'staff' 
      ? staffNavItems 
      : internNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const NavItem = ({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) => {
    const Icon = item.icon;
    const content = (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon size={20} />
        {!collapsed && <span className="font-medium">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
          <span className="font-bold text-xl text-sidebar-foreground">DIGI5 LTD</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sidebar-primary-foreground font-bold text-lg">D5</span>
              </div>
              {!collapsed && (
                <span className="font-bold text-xl text-sidebar-foreground">DIGI5 LTD</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return <NavItem key={item.path} item={item} isActive={isActive} />;
            })}
          </nav>

          {/* Collapse button - desktop only */}
          <div className="hidden lg:block p-2 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!collapsed && <span className="ml-2 text-sm">Collapse</span>}
            </Button>
          </div>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={handleSignOut}
                  >
                    <LogOut size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sidebar-accent-foreground font-medium">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 capitalize">
                      {userRole}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={handleSignOut}
                >
                  <LogOut size={20} className="mr-3" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={cn(
        "pt-16 lg:pt-0 min-h-screen transition-all duration-300",
        collapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
