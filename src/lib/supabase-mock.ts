// Mock implementation for Supabase client during development
// This prevents errors when Supabase is not configured

export const supabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options?: any) => {
        console.log(`[Mock] Upload to ${bucket}/${path}`);
        return { data: { path }, error: null };
      },
      createSignedUrl: async (path: string, expiresIn: number) => {
        console.log(`[Mock] Create signed URL for ${path}`);
        return { 
          data: { signedUrl: `https://mock-storage.com/${path}` }, 
          error: null 
        };
      }
    })
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          console.log(`[Mock] Select from ${table} where ${column} = ${value}`);
          return { data: null, error: null };
        }
      }),
      order: (column: string, options?: any) => ({
        eq: (column: string, value: any) => ({
          async then(callback: any) {
            console.log(`[Mock] Select from ${table}`);
            return callback({ data: [], error: null });
          }
        }),
        async then(callback: any) {
          console.log(`[Mock] Select from ${table}`);
          return callback({ data: [], error: null });
        }
      }),
      async then(callback: any) {
        console.log(`[Mock] Select from ${table}`);
        return callback({ data: [], error: null });
      }
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          console.log(`[Mock] Insert into ${table}:`, data);
          return { data: { id: 'mock_id', ...data[0] }, error: null };
        }
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        async then(callback: any) {
          console.log(`[Mock] Update ${table} where ${column} = ${value}:`, data);
          return callback({ data: null, error: null });
        }
      })
    })
  })
};
