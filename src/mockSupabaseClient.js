// Mock Supabase Client for Testing
// This allows testing the async training operations without a real database

export const createMockSupabaseClient = () => {
  const mockData = {
    treinos: []
  };

  let nextId = 1;

  return {
    from: (table) => {
      const operations = {
        insert: async (data) => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const newRecords = data.map(record => ({
            ...record,
            id: nextId++,
            created_at: new Date().toISOString()
          }));
          
          mockData[table].push(...newRecords);
          
          return { 
            data: newRecords, 
            error: null 
          };
        },
        
        update: (data) => ({
          eq: async (column, value) => {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const index = mockData[table].findIndex(item => item[column] === value);
            if (index !== -1) {
              mockData[table][index] = {
                ...mockData[table][index],
                ...data
              };
              return { 
                data: mockData[table][index], 
                error: null 
              };
            }
            return { 
              data: null, 
              error: { message: 'Record not found' } 
            };
          }
        }),
        
        delete: () => ({
          eq: async (column, value) => {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const index = mockData[table].findIndex(item => item[column] === value);
            if (index !== -1) {
              mockData[table].splice(index, 1);
              return { 
                data: null, 
                error: null 
              };
            }
            return { 
              data: null, 
              error: { message: 'Record not found' } 
            };
          }
        }),
        
        select: (fields = '*') => ({
          order: (column, options = {}) => {
            // Simulate async operation
            return new Promise(resolve => {
              setTimeout(() => {
                let sortedData = [...mockData[table]];
                
                if (options.ascending === false) {
                  sortedData.sort((a, b) => {
                    if (a[column] < b[column]) return 1;
                    if (a[column] > b[column]) return -1;
                    return 0;
                  });
                } else {
                  sortedData.sort((a, b) => {
                    if (a[column] < b[column]) return -1;
                    if (a[column] > b[column]) return 1;
                    return 0;
                  });
                }
                
                resolve({ 
                  data: sortedData, 
                  error: null 
                });
              }, 100);
            });
          }
        })
      };
      
      return operations;
    },
    
    // Helper to reset mock data
    _reset: () => {
      mockData.treinos = [];
      nextId = 1;
    },
    
    // Helper to get current data
    _getData: (table) => mockData[table]
  };
};

// Example usage:
/*
const mockSupabase = createMockSupabaseClient();

// Add training
const { data, error } = await mockSupabase
  .from('treinos')
  .insert([{
    data: '29/12/2025',
    tipo: 'cardio',
    subcategoria: 'Corrida',
    duracao: 30,
    distancia: 5.0
  }]);

// Load trainings
const result = await mockSupabase
  .from('treinos')
  .select('*')
  .order('data', { ascending: false });

console.log(result.data); // All trainings

// Update training
await mockSupabase
  .from('treinos')
  .update({ duracao: 45 })
  .eq('id', 1);

// Delete training
await mockSupabase
  .from('treinos')
  .delete()
  .eq('id', 1);
*/
