import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, Calendar, Building2, User, Mail, ShieldAlert, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Application {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  status: 'submitted' | 'reviewing' | 'shortlisted' | 'approved' | 'rejected';
  delivery_status: string | null;
  admin_notes: string | null;
  created_at: string;
  form: {
    title: string;
    department: {
      name: string;
    } | null;
  } | null;
}

const statusColors = {
  submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  reviewing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  shortlisted: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const statusLabels = {
  submitted: 'Submitted',
  reviewing: 'Under Review',
  shortlisted: 'Shortlisted',
  approved: 'Approved / Hired',
  rejected: 'Not Selected',
};

export default function ApplicationStatusCheck() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, form:application_forms(*, department:departments(*))')
        .eq('applicant_email', email.trim().toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching application status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineSteps = (status: Application['status']) => {
    const steps = [
      { key: 'submitted', label: 'Submitted', completed: true },
      { 
        key: 'reviewing', 
        label: 'Under Review', 
        completed: ['reviewing', 'shortlisted', 'approved', 'rejected'].includes(status) 
      },
      { 
        key: 'outcome', 
        label: status === 'rejected' ? 'Not Selected' : status === 'approved' ? 'Approved' : status === 'shortlisted' ? 'Shortlisted' : 'Outcome Pending',
        completed: ['shortlisted', 'approved', 'rejected'].includes(status),
        isOutcome: true
      }
    ];
    return steps;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col">
      {/* Public Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <span>DIGI5 LTD Portal</span>
          </div>
          <Button variant="ghost" asChild>
            <a href="/apply">View Careers</a>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Track Application Status</h1>
          <p className="text-muted-foreground text-lg">
            Enter your registered email address to see your real-time application updates and history.
          </p>
        </div>

        {/* Search Input Box */}
        <Card className="mb-8 border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Application Lookup</CardTitle>
            <CardDescription>We will retrieve all applications associated with this email address.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="e.g. applicant@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Track Status
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p>Loading application details...</p>
          </div>
        ) : searched ? (
          applications.length === 0 ? (
            <Card className="border-destructive/10 bg-destructive/5 text-center p-8">
              <CardContent className="pt-6">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Applications Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find any internship applications registered under <span className="font-semibold text-foreground">{email}</span>.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Found {applications.length} Application{applications.length > 1 ? 's' : ''}
              </h2>
              
              {applications.map((app) => {
                const steps = getTimelineSteps(app.status);
                
                return (
                  <Card key={app.id} className="overflow-hidden border-muted-foreground/10 hover:border-primary/20 transition-all shadow">
                    <div className="p-6">
                      {/* Top Metadata Row */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-xl font-bold">{app.form?.title || 'Internship Application'}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                            {app.form?.department && (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" />
                                <span>{app.form.department.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>Applied: {format(new Date(app.created_at), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`py-1 px-3 text-sm font-medium ${statusColors[app.status]}`}>
                          {statusLabels[app.status]}
                        </Badge>
                      </div>

                      {/* Timeline Steps visualization */}
                      <div className="relative flex justify-between items-center max-w-md mx-auto my-8">
                        {/* Progress Connecting Line */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted z-0" />
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary z-0 transition-all duration-500" 
                          style={{
                            width: app.status === 'submitted' ? '0%' : app.status === 'reviewing' ? '50%' : '100%'
                          }}
                        />

                        {steps.map((step, index) => {
                          const isComplete = step.completed;
                          const isCurrent = (step.key === 'submitted' && app.status === 'submitted') || 
                                            (step.key === 'reviewing' && app.status === 'reviewing') || 
                                            (step.isOutcome && ['shortlisted', 'approved', 'rejected'].includes(app.status));
                          
                          return (
                            <div key={index} className="relative z-10 flex flex-col items-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs border font-semibold shadow-md transition-all ${
                                isComplete 
                                  ? 'bg-primary border-primary text-primary-foreground' 
                                  : 'bg-card border-muted text-muted-foreground'
                              } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                                {isComplete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                              </div>
                              <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Display Admin Notes/Notes to Applicant if present */}
                      {app.admin_notes && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed flex items-start gap-3 text-sm">
                          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-foreground block mb-1">Update Notes from Review Panel:</span>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.admin_notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-lg bg-card/30 border-dashed">
            <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p>Track your applications by entering your email above.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8 text-center text-sm text-muted-foreground mt-12">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} DIGI5 LTD. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
