import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationForm } from '@/types/database';
import { Calendar, Building2, ArrowRight } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function ApplicationList() {
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const { data } = await supabase
      .from('application_forms')
      .select('*, department:departments(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setForms(data);
    }
    setLoading(false);
  };

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return isPast(new Date(deadline));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Internship Opportunities</h1>
            <p className="text-lg text-muted-foreground">
              Explore our open positions and apply to start your career journey with us.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading opportunities...</p>
            </div>
          ) : forms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No open positions at the moment. Please check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {forms.map((form) => {
                const deadlinePassed = isDeadlinePassed(form.deadline);
                
                return (
                  <Card
                    key={form.id}
                    className={`transition-all hover:shadow-lg ${
                      deadlinePassed ? 'opacity-60' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{form.title}</CardTitle>
                          {form.description && (
                            <CardDescription className="mt-2">
                              {form.description}
                            </CardDescription>
                          )}
                        </div>
                        {deadlinePassed && (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        {form.department && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{form.department.name}</span>
                          </div>
                        )}
                        {form.deadline && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Deadline: {format(new Date(form.deadline), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        asChild
                        disabled={deadlinePassed}
                        className={deadlinePassed ? 'pointer-events-none' : ''}
                      >
                        <Link to={`/apply/${form.slug}`}>
                          {deadlinePassed ? 'Application Closed' : 'Apply Now'}
                          {!deadlinePassed && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
