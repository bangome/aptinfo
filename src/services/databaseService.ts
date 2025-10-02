import { createPureClient } from '@/lib/supabase/server';
import { ApartmentComplexInsert, ApartmentTradeTransactionInsert, ApartmentRentTransactionInsert } from '@/lib/supabase/database.types';

export class DatabaseService {
  private supabase = createPureClient();

  async initializeDatabase() {
    try {
      const supabase = await this.supabase;

      // Check if tables exist by trying to query them
      console.log('Checking existing tables...');

      // Try to query apartment_complexes table
      const { data: existingComplexes, error: complexError } = await supabase
        .from('apartment_complexes')
        .select('id')
        .limit(1);

      if (!complexError) {
        console.log('Database tables already exist');
        return { success: true, message: 'Tables already exist' };
      }

      // Tables don't exist, we need to create them using Supabase SQL editor or migration
      console.log('Tables do not exist. Please create them using Supabase dashboard SQL editor.');
      console.log('You can copy the SQL from supabase/migrations/20250917040000_create_apartment_schema.sql');

      return {
        success: false,
        error: 'Tables do not exist. Please run the migration manually in Supabase dashboard.',
        migrationFile: 'supabase/migrations/20250917040000_create_apartment_schema.sql'
      };

    } catch (error) {
      console.error('Database service error:', error);
      return { success: false, error: String(error) };
    }
  }

  async insertApartmentComplex(data: ApartmentComplexInsert) {
    try {
      const supabase = await this.supabase;

      const { data: result, error } = await supabase
        .from('apartment_complexes')
        .insert(data as any)
        .select()
        .single();

      if (error) {
        console.error('Insert apartment complex error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Insert apartment complex service error:', error);
      return { success: false, error: String(error) };
    }
  }

  async insertTradeTransaction(data: ApartmentTradeTransactionInsert) {
    try {
      const supabase = await this.supabase;

      const { data: result, error } = await supabase
        .from('apartment_trade_transactions')
        .insert(data as any)
        .select()
        .single();

      if (error) {
        console.error('Insert trade transaction error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Insert trade transaction service error:', error);
      return { success: false, error: String(error) };
    }
  }

  async insertRentTransaction(data: ApartmentRentTransactionInsert) {
    try {
      const supabase = await this.supabase;

      const { data: result, error } = await supabase
        .from('apartment_rent_transactions')
        .insert(data as any)
        .select()
        .single();

      if (error) {
        console.error('Insert rent transaction error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Insert rent transaction service error:', error);
      return { success: false, error: String(error) };
    }
  }

  async findOrCreateApartmentComplex(name: string, address: string, regionCode: string) {
    try {
      const supabase = await this.supabase;

      // First try to find existing complex
      const { data: existing, error: findError } = await supabase
        .from('apartment_complexes')
        .select('*')
        .eq('name', name)
        .eq('region_code', regionCode)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Find apartment complex error:', findError);
        return { success: false, error: findError.message };
      }

      if (existing) {
        return { success: true, data: existing, created: false };
      }

      // Create new complex if not found
      const newComplex: ApartmentComplexInsert = {
        name,
        address,
        region_code: regionCode,
        data_source: 'government_api'
      };

      const insertResult = await this.insertApartmentComplex(newComplex);
      if (!insertResult.success) {
        return insertResult;
      }

      return { success: true, data: insertResult.data, created: true };

    } catch (error) {
      console.error('Find or create apartment complex service error:', error);
      return { success: false, error: String(error) };
    }
  }

  async getApartmentComplexes(filters: {
    region?: string;
    name?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const supabase = await this.supabase;

      let query = supabase
        .from('apartment_complexes')
        .select('*');

      if (filters.region) {
        query = query.eq('region_code', filters.region);
      }

      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get apartment complexes error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('Get apartment complexes service error:', error);
      return { success: false, error: String(error) };
    }
  }

  // 성능 최적화된 아파트 검색 (실거래가 포함)
  async getApartmentComplexesWithPrices(filters: {
    region?: string;
    name?: string;
    limit?: number;
    offset?: number;
    includePriceRange?: boolean;
  } = {}) {
    try {
      const supabase = await this.supabase;

      // 기본 아파트 정보 조회
      let complexQuery = supabase
        .from('apartment_complexes')
        .select('*');

      if (filters.region) {
        complexQuery = complexQuery.eq('region_code', filters.region);
      }

      if (filters.name) {
        complexQuery = complexQuery.ilike('name', `%${filters.name}%`);
      }

      if (filters.limit) {
        complexQuery = complexQuery.limit(filters.limit);
      }

      if (filters.offset) {
        complexQuery = complexQuery.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: complexes, error: complexError } = await complexQuery;

      if (complexError) {
        console.error('Get apartment complexes error:', complexError);
        return { success: false, error: complexError.message };
      }

      // 실거래가 정보가 필요한 경우 조인하여 한 번에 조회
      if (filters.includePriceRange && complexes && complexes.length > 0) {
        const complexNames = complexes.map(c => c.name);
        
        // 최근 6개월 거래 데이터를 병렬로 조회
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const [tradePromise, rentPromise] = await Promise.allSettled([
          supabase
            .from('apartment_trade_transactions')
            .select('apartment_name, deal_amount, deal_date')
            .in('apartment_name', complexNames)
            .gte('deal_date', sixMonthsAgo.toISOString().split('T')[0])
            .order('deal_date', { ascending: false }),
          
          supabase
            .from('apartment_rent_transactions')
            .select('apartment_name, deposit_amount, monthly_rent, deal_date')
            .in('apartment_name', complexNames)
            .gte('deal_date', sixMonthsAgo.toISOString().split('T')[0])
            .order('deal_date', { ascending: false })
        ]);

        // 가격 범위 정보를 아파트별로 집계
        const priceRanges: Record<string, any> = {};
        
        if (tradePromise.status === 'fulfilled' && tradePromise.value.data) {
          tradePromise.value.data.forEach(trade => {
            if (!priceRanges[trade.apartment_name]) {
              priceRanges[trade.apartment_name] = { trades: [], rents: [] };
            }
            priceRanges[trade.apartment_name].trades.push(trade.deal_amount);
          });
        }

        if (rentPromise.status === 'fulfilled' && rentPromise.value.data) {
          rentPromise.value.data.forEach(rent => {
            if (!priceRanges[rent.apartment_name]) {
              priceRanges[rent.apartment_name] = { trades: [], rents: [] };
            }
            priceRanges[rent.apartment_name].rents.push(rent.deposit_amount);
          });
        }

        // 각 아파트에 가격 범위 정보 추가
        const enrichedComplexes = complexes.map(complex => {
          const priceData = priceRanges[complex.name];
          let priceRange = null;

          if (priceData) {
            const trades = priceData.trades || [];
            const rents = priceData.rents || [];

            if (trades.length > 0) {
              priceRange = {
                tradeMin: Math.min(...trades),
                tradeMax: Math.max(...trades),
                tradeAvg: Math.round(trades.reduce((a, b) => a + b, 0) / trades.length)
              };
            }

            if (rents.length > 0) {
              priceRange = {
                ...priceRange,
                rentMin: Math.min(...rents),
                rentMax: Math.max(...rents),
                rentAvg: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length)
              };
            }
          }

          return {
            ...complex,
            priceRange
          };
        });

        return { success: true, data: enrichedComplexes };
      }

      return { success: true, data: complexes || [] };

    } catch (error) {
      console.error('Get apartment complexes with prices service error:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const databaseService = new DatabaseService();