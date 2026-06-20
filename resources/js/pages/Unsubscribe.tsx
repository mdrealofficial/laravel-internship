import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const Unsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_done'>('loading');
  const [companyName, setCompanyName] = useState('DIGI5 LTD');

  useEffect(() => {
    fetchCompanyAndUnsubscribe();
  }, [email]);

  const fetchCompanyAndUnsubscribe = async () => {
    try {
      // 1. Fetch company name
      const { data: settings } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'company_name')
        .single();
      if (settings?.setting_value) {
        setCompanyName(settings.setting_value);
      }

      if (!email) {
        setStatus('error');
        return;
      }

      // 2. Check if already unsubscribed
      const { data: existing, error: checkError } = await supabase
        .from('unsubscribed_emails')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        setStatus('already_done');
        return;
      }

      // 3. Insert into unsubscribe list
      const { error: insertError } = await supabase
        .from('unsubscribed_emails')
        .insert({ email });

      if (insertError) throw insertError;

      setStatus('success');
    } catch (err) {
      console.error('Error handling unsubscribe:', err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-slate-950/90">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Unsubscribe Request
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            {companyName} Email Subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Processing your unsubscribe request...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Unsubscribed Successfully
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  You have been successfully opted out from receiving emails for <strong>{email}</strong>.
                </p>
              </div>
            </div>
          )}

          {status === 'already_done' && (
            <div className="py-4 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Already Unsubscribed
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  <strong>{email}</strong> is already unsubscribed from our lists. No further action is required.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Something Went Wrong
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  We could not complete your unsubscribe request. Please verify the link or contact our support.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
            <Button asChild className="w-full">
              <Link to="/">Go to Homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
