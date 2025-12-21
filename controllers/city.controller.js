const { prisma } = require('../models');
const { mapsService } = require('../services');
const { logger } = require('../utils');
const { GOVERNORATE_CODES } = require('../config/constants');

/**
 * City Controller - Handles city-related operations
 */
class CityController {
  /**
   * Get all cities
   * Returns unique cities from businesses and predefined major cities
   */
  async getAllCities(req, res) {
    try {
      const { governorate, search } = req.query;

      // Get unique cities from businesses
      const businesses = await prisma.business.findMany({
        where: {
          is_active: true,
          ...(governorate && { governorate }),
          ...(search && {
            city: { contains: search, mode: 'insensitive' }
          })
        },
        select: {
          city: true,
          governorate: true
        },
        distinct: ['city', 'governorate']
      });

      // Get major cities from maps service
      const majorCities = mapsService.majorCities || {};
      const majorCitiesList = Object.keys(majorCities).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        key: key,
        latitude: majorCities[key].lat,
        longitude: majorCities[key].lng,
        source: 'predefined'
      }));

      // Combine and format cities from businesses
      const businessCities = businesses
        .filter(b => b.city) // Filter out null/empty cities
        .map(business => {
          const cityKey = business.city.toLowerCase().replace(/\s+/g, '');
          const cityInfo = mapsService.getCityInfo(business.city);
          
          return {
            name: business.city,
            key: cityKey,
            governorate: business.governorate,
            latitude: cityInfo?.lat || null,
            longitude: cityInfo?.lng || null,
            source: 'business'
          };
        });

      // Merge and deduplicate cities
      const allCities = [...majorCitiesList, ...businessCities];
      const uniqueCities = Array.from(
        new Map(allCities.map(city => [city.key, city])).values()
      );

      // Sort alphabetically
      uniqueCities.sort((a, b) => a.name.localeCompare(b.name));

      res.json({
        success: true,
        message: 'Cities retrieved successfully',
        data: {
          cities: uniqueCities,
          total: uniqueCities.length
        }
      });
    } catch (error) {
      logger.error('Get all cities failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cities',
        error: error.message
      });
    }
  }

  /**
   * Get cities by governorate
   */
  async getCitiesByGovernorate(req, res) {
    try {
      const { governorate_code } = req.params;

      // Validate governorate code
      if (!GOVERNORATE_CODES[governorate_code]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid governorate code',
          error: `Governorate code must be one of: ${Object.keys(GOVERNORATE_CODES).join(', ')}`
        });
      }

      const governorateName = GOVERNORATE_CODES[governorate_code];

      // Get cities from businesses in this governorate
      const businesses = await prisma.business.findMany({
        where: {
          is_active: true,
          governorate: governorateName
        },
        select: {
          city: true,
          governorate: true
        },
        distinct: ['city']
      });

      const cities = businesses
        .filter(b => b.city)
        .map(business => {
          const cityInfo = mapsService.getCityInfo(business.city);
          return {
            name: business.city,
            governorate: business.governorate,
            governorate_code: governorate_code,
            latitude: cityInfo?.lat || null,
            longitude: cityInfo?.lng || null
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      res.json({
        success: true,
        message: `Cities in ${governorateName} retrieved successfully`,
        data: {
          governorate: governorateName,
          governorate_code: governorate_code,
          cities: cities,
          total: cities.length
        }
      });
    } catch (error) {
      logger.error('Get cities by governorate failed', {
        governorate_code: req.params.governorate_code,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cities',
        error: error.message
      });
    }
  }

  /**
   * Get city details
   */
  async getCityDetails(req, res) {
    try {
      const { cityName } = req.params;

      if (!cityName) {
        return res.status(400).json({
          success: false,
          message: 'City name is required',
          error: 'MISSING_CITY_NAME'
        });
      }

      // Get city info from maps service
      const cityInfo = mapsService.getCityInfo(cityName);

      // Get businesses in this city
      const businesses = await prisma.business.findMany({
        where: {
          is_active: true,
          city: { contains: cityName, mode: 'insensitive' }
        },
        select: {
          id: true,
          business_name: true,
          business_type: true,
          city: true,
          governorate: true,
          latitude: true,
          longitude: true,
          rating_average: true,
          rating_count: true
        }
      });

      // Get unique governorates for this city
      const governorates = [...new Set(businesses.map(b => b.governorate))];

      res.json({
        success: true,
        message: 'City details retrieved successfully',
        data: {
          name: cityName,
          coordinates: cityInfo ? {
            latitude: cityInfo.lat,
            longitude: cityInfo.lng
          } : null,
          governorates: governorates,
          businesses_count: businesses.length,
          businesses: businesses.slice(0, 10) // Return first 10 businesses
        }
      });
    } catch (error) {
      logger.error('Get city details failed', {
        cityName: req.params.cityName,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve city details',
        error: error.message
      });
    }
  }

  /**
   * Search cities
   */
  async searchCities(req, res) {
    try {
      const { q, governorate, limit = 20 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
          error: 'INVALID_SEARCH_QUERY'
        });
      }

      // Search in businesses
      const businesses = await prisma.business.findMany({
        where: {
          is_active: true,
          city: { contains: q, mode: 'insensitive' },
          ...(governorate && { governorate })
        },
        select: {
          city: true,
          governorate: true
        },
        distinct: ['city', 'governorate'],
        take: parseInt(limit)
      });

      const cities = businesses
        .filter(b => b.city)
        .map(business => {
          const cityInfo = mapsService.getCityInfo(business.city);
          return {
            name: business.city,
            governorate: business.governorate,
            latitude: cityInfo?.lat || null,
            longitude: cityInfo?.lng || null,
            match_score: business.city.toLowerCase().startsWith(q.toLowerCase()) ? 1 : 0.5
          };
        })
        .sort((a, b) => {
          // Sort by match score first, then alphabetically
          if (b.match_score !== a.match_score) {
            return b.match_score - a.match_score;
          }
          return a.name.localeCompare(b.name);
        });

      res.json({
        success: true,
        message: 'Cities found successfully',
        data: {
          query: q,
          cities: cities,
          total: cities.length
        }
      });
    } catch (error) {
      logger.error('Search cities failed', {
        query: req.query.q,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to search cities',
        error: error.message
      });
    }
  }

  /**
   * Get all governorates with their cities
   */
  async getGovernoratesWithCities(req, res) {
    try {
      const governorates = {};

      // Get all businesses grouped by governorate
      const businesses = await prisma.business.findMany({
        where: { is_active: true },
        select: {
          city: true,
          governorate: true
        },
        distinct: ['city', 'governorate']
      });

      // Group cities by governorate
      businesses.forEach(business => {
        if (!business.governorate || !business.city) return;

        if (!governorates[business.governorate]) {
          governorates[business.governorate] = {
            name: business.governorate,
            code: Object.keys(GOVERNORATE_CODES).find(
              key => GOVERNORATE_CODES[key] === business.governorate
            ) || null,
            cities: []
          };
        }

        if (!governorates[business.governorate].cities.includes(business.city)) {
          governorates[business.governorate].cities.push(business.city);
        }
      });

      // Sort cities within each governorate
      Object.keys(governorates).forEach(gov => {
        governorates[gov].cities.sort();
      });

      const result = Object.values(governorates).map(gov => ({
        ...gov,
        cities_count: gov.cities.length
      }));

      res.json({
        success: true,
        message: 'Governorates with cities retrieved successfully',
        data: {
          governorates: result,
          total: result.length
        }
      });
    } catch (error) {
      logger.error('Get governorates with cities failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve governorates',
        error: error.message
      });
    }
  }
}

module.exports = new CityController();

