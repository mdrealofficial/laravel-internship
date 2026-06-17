import axios from 'axios';

// Set default headers for Axios to carry cookies/session automatically
axios.defaults.withCredentials = true;

let currentSession: any = null;
let currentSessionFetched = false;
let authListeners: Array<(event: string, session: any) => void> = [];

// Fetch initial session immediately
axios.get('/api/supabase-compat/auth/session')
  .then(res => {
    currentSession = res.data.session;
    currentSessionFetched = true;
    const event = currentSession ? 'INITIAL_SESSION' : 'SIGNED_OUT';
    authListeners.forEach(cb => {
      try { cb(event, currentSession); } catch(e) { console.error(e); }
    });
  })
  .catch(() => {
    currentSessionFetched = true;
    authListeners.forEach(cb => {
      try { cb('SIGNED_OUT', null); } catch(e) { console.error(e); }
    });
  });

function notifyAuthChange(event: string, session: any) {
  currentSession = session;
  authListeners.forEach(cb => {
    try { cb(event, session); } catch(e) { console.error(e); }
  });
}

class SupabaseQueryBuilder {
  private table: string;
  private method: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectFields: string = '*';
  private insertData: any = null;
  private updateData: any = null;
  private filters: Array<{ type: string; col: string; val: any }> = [];
  private orderBy: Array<{ col: string; ascending: boolean }> = [];
  private limitValue: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private countOption: string | null = null;
  private headOption: boolean = false;
  private onConflictFields: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*', options?: { count?: string; head?: boolean }) {
    // If method is already set to a write operation (insert/update/delete/upsert),
    // .select() means "return the affected rows" — don't override the method.
    if (!this.method || this.method === 'select') {
      this.method = 'select';
    }
    this.selectFields = fields;
    if (options) {
      this.countOption = options.count ?? null;
      this.headOption = options.head ?? false;
    }
    return this;
  }

  insert(data: any) {
    this.method = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.method = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }) {
    this.method = 'upsert' as any; // Cast since method type is union
    this.insertData = data;
    if (options?.onConflict) {
      this.onConflictFields = options.onConflict;
    }
    return this;
  }

  eq(col: string, val: any) {
    if (val !== undefined && val !== null) {
      this.filters.push({ type: 'eq', col, val });
    }
    return this;
  }

  neq(col: string, val: any) {
    if (val !== undefined && val !== null) {
      this.filters.push({ type: 'neq', col, val });
    }
    return this;
  }

  in(col: string, val: any[]) {
    if (val !== undefined && val !== null) {
      this.filters.push({ type: 'in', col, val });
    }
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderBy.push({ col, ascending: options?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitValue = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  // Promise-like resolution so awaiting the builder initiates the network request
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const response = await axios.post('/api/supabase-compat/query', {
        table: this.table,
        method: this.method,
        selectFields: this.selectFields,
        insertData: this.insertData,
        updateData: this.updateData,
        filters: this.filters,
        orderBy: this.orderBy,
        limit: this.limitValue,
        isSingle: this.isSingle,
        isMaybeSingle: this.isMaybeSingle,
        countOption: this.countOption,
        headOption: this.headOption,
        onConflictFields: this.onConflictFields
      });
      const result = {
        data: response.data.data,
        error: response.data.error ? { message: response.data.error } : null,
        count: response.data.count ?? null
      };
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (error: any) {
      const errResult = {
        data: null,
        error: { message: error.response?.data?.error || error.message },
        count: null
      };
      if (onfulfilled) return onfulfilled(errResult); // Supabase returns error inside successful promise resolution mostly
      if (onrejected) return onrejected(errResult);
      return errResult;
    }
  }
}

export const supabaseConfigured = true;

export const supabase = {
  from(table: string) {
    return new SupabaseQueryBuilder(table);
  },

  auth: {
    async getSession() {
      try {
        const res = await axios.get('/api/supabase-compat/auth/session');
        currentSession = res.data.session;
        return { data: { session: currentSession }, error: null };
      } catch (err: any) {
        return { data: { session: null }, error: { message: err.message } };
      }
    },

    async signInWithPassword({ email, password }: any) {
      try {
        const res = await axios.post('/api/supabase-compat/auth/signin', { email, password });
        notifyAuthChange('SIGNED_IN', res.data.session);
        return { data: { session: res.data.session, user: res.data.session?.user }, error: null };
      } catch (err: any) {
        return { data: { session: null, user: null }, error: { message: err.response?.data?.error || err.message } };
      }
    },

    async signUp({ email, password, options }: any) {
      try {
        const res = await axios.post('/api/supabase-compat/auth/signup', { email, password, options });
        notifyAuthChange('SIGNED_IN', res.data.session);
        return { data: { session: res.data.session, user: res.data.session?.user }, error: null };
      } catch (err: any) {
        return { data: { session: null, user: null }, error: { message: err.response?.data?.error || err.message } };
      }
    },

    async signOut() {
      try {
        await axios.post('/api/supabase-compat/auth/signout');
        notifyAuthChange('SIGNED_OUT', null);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.push(callback);
      if (currentSessionFetched) {
        try {
          callback(currentSession ? 'INITIAL_SESSION' : 'SIGNED_OUT', currentSession);
        } catch(e) {
          console.error(e);
        }
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners = authListeners.filter(cb => cb !== callback);
            }
          }
        }
      };
    },

    async updateUser({ password, data: userData }: { password?: string; data?: any }) {
      try {
        const res = await axios.post('/api/supabase-compat/auth/update-user', { password, data: userData });
        return { data: res.data.data, error: res.data.error ? { message: res.data.error } : null };
      } catch (err: any) {
        return { data: null, error: { message: err.response?.data?.error || err.message } };
      }
    }
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File, options?: any) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);
            formData.append('bucket', bucket);

            const res = await axios.post('/api/supabase-compat/storage/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            return { data: res.data.data, error: res.data.error ? { message: res.data.error } : null };
          } catch (err: any) {
            return { data: null, error: { message: err.response?.data?.error || err.message } };
          }
        },

        getPublicUrl(path: string) {
          // Point directly to Laravel's symlinked storage directory
          const publicUrl = `${window.location.origin}/storage/${bucket}/${path}`;
          return { data: { publicUrl } };
        }
      };
    }
  },

  functions: {
    async invoke(name: string, options?: any) {
      try {
        const body = options?.body || {};
        const res = await axios.post(`/api/supabase-compat/functions/${name}`, body);
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.response?.data?.error || err.message } };
      }
    }
  }
};
