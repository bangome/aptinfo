/**
 * Apartment Service Layer
 *
 * This service provides mock data and search functionality for apartments.
 * In a real implementation, this would connect to a backend API.
 */

import { Apartment, SearchFilters } from '@/types/apartment';
import { dummyApartments } from '@/data/dummy-apartments';

export interface SearchResponse {
  apartments: Apartment[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Simulates API delay for realistic loading experience
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search apartments based on query and filters
 *
 * Data Flow:
 * 1. User inputs query -> onChange handler updates component state
 * 2. onSubmit calls this search function
 * 3. Function filters mock data based on criteria
 * 4. Returns Promise with filtered results
 * 5. Component updates React state with results
 * 6. UI re-renders with new apartment cards
 */
export const apartmentService = {
  /**
   * Search apartments by query and filters
   * @param query - Search query (apartment name or address)
   * @param filters - Optional filters for advanced search
   * @returns Promise resolving to filtered apartment data
   */
  async search(query: string = '', filters: Partial<SearchFilters> = {}): Promise<SearchResponse> {
    // Simulate network delay (500ms - 1.5s)
    await delay(500 + Math.random() * 1000);

    let filteredApartments = [...dummyApartments];

    // Apply text query filter
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      filteredApartments = filteredApartments.filter(apartment =>
        apartment.name.toLowerCase().includes(lowercaseQuery) ||
        apartment.address.toLowerCase().includes(lowercaseQuery) ||
        apartment.region.toLowerCase().includes(lowercaseQuery) ||
        apartment.subRegion.toLowerCase().includes(lowercaseQuery)
      );
    }

    // Apply region filter
    if (filters.region) {
      filteredApartments = filteredApartments.filter(apartment =>
        apartment.region === filters.region ||
        apartment.subRegion === filters.region ||
        apartment.address.includes(filters.region)
      );
    }

    // Apply build year range filter
    if (filters.buildYearRange) {
      filteredApartments = filteredApartments.filter(apartment =>
        apartment.buildYear >= filters.buildYearRange![0] &&
        apartment.buildYear <= filters.buildYearRange![1]
      );
    }

    // Apply price range filter
    if (filters.priceRange && filters.priceRange[0] > 0) {
      filteredApartments = filteredApartments.filter(apartment =>
        apartment.price?.sale &&
        apartment.price.sale >= filters.priceRange![0] &&
        apartment.price.sale <= filters.priceRange![1]
      );
    }

    // Apply area range filter
    if (filters.areaRange) {
      filteredApartments = filteredApartments.filter(apartment =>
        apartment.area.exclusive >= filters.areaRange![0] &&
        apartment.area.exclusive <= filters.areaRange![1]
      );
    }

    // Apply facilities filter
    if (filters.facilities && filters.facilities.length > 0) {
      filteredApartments = filteredApartments.filter(apartment =>
        filters.facilities!.every(facility =>
          apartment.facilities.includes(facility)
        )
      );
    }

    // Sort by relevance (in real implementation, this would be more sophisticated)
    // Currently sorting by: exact name match > partial name match > address match > newest
    filteredApartments.sort((a, b) => {
      if (query.trim()) {
        const aNameExact = a.name.toLowerCase() === query.toLowerCase() ? 3 : 0;
        const bNameExact = b.name.toLowerCase() === query.toLowerCase() ? 3 : 0;

        const aNamePartial = a.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 0;
        const bNamePartial = b.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 0;

        const aAddressMatch = a.address.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        const bAddressMatch = b.address.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;

        const aScore = aNameExact + aNamePartial + aAddressMatch;
        const bScore = bNameExact + bNamePartial + bAddressMatch;

        if (aScore !== bScore) return bScore - aScore;
      }

      // Secondary sort by newest build year
      return b.buildYear - a.buildYear;
    });

    return {
      apartments: filteredApartments,
      total: filteredApartments.length,
      page: 1,
      limit: filteredApartments.length
    };
  },

  /**
   * Get apartment by ID
   * @param id - Apartment ID
   * @returns Promise resolving to apartment data or null if not found
   */
  async getById(id: string): Promise<Apartment | null> {
    // Simulate network delay
    await delay(200 + Math.random() * 300);

    const apartment = dummyApartments.find(apt => apt.id === id);
    return apartment || null;
  },

  /**
   * Get popular apartments (featured/recommended)
   * @param limit - Number of apartments to return
   * @returns Promise resolving to popular apartment data
   */
  async getPopular(limit: number = 3): Promise<Apartment[]> {
    // Simulate network delay
    await delay(300 + Math.random() * 200);

    // Return apartments sorted by price (high-end apartments are "popular")
    const popular = [...dummyApartments]
      .sort((a, b) => (b.price?.sale || 0) - (a.price?.sale || 0))
      .slice(0, limit);

    return popular;
  },

  /**
   * Get recent apartments (newly listed)
   * @param limit - Number of apartments to return
   * @returns Promise resolving to recent apartment data
   */
  async getRecent(limit: number = 6): Promise<Apartment[]> {
    // Simulate network delay
    await delay(250 + Math.random() * 250);

    // Return apartments sorted by build year (newest first)
    const recent = [...dummyApartments]
      .sort((a, b) => b.buildYear - a.buildYear)
      .slice(0, limit);

    return recent;
  }
};

export default apartmentService;