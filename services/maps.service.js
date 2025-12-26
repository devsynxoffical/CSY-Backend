const { calculateDistance, calculateDeliveryTime } = require('../utils');
const { logger } = require('../utils');

/**
 * Maps Service for location-based features
 */
class MapsService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.hereApiKey = process.env.HERE_API_KEY;
    this.mapboxToken = process.env.MAPBOX_TOKEN;

    // Egypt bounds for validation
    this.egyptBounds = {
      north: 31.8,
      south: 21.0,
      east: 37.0,
      west: 24.7
    };

    // Major cities with coordinates by country
    this.majorCities = {
      // Egypt
      cairo: { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
      alexandria: { lat: 31.2001, lng: 29.9187, country: 'Egypt' },
      damietta: { lat: 31.4165, lng: 31.8133, country: 'Egypt' },
      mansoura: { lat: 31.0364, lng: 31.3807, country: 'Egypt' },
      tanta: { lat: 30.7885, lng: 31.0019, country: 'Egypt' },
      zagazig: { lat: 30.5833, lng: 31.5000, country: 'Egypt' },
      shibin: { lat: 30.5542, lng: 31.0090, country: 'Egypt' },
      benha: { lat: 30.4667, lng: 31.1833, country: 'Egypt' },
      portsaid: { lat: 31.2653, lng: 32.3019, country: 'Egypt' },
      suez: { lat: 29.9667, lng: 32.5333, country: 'Egypt' },
      ismailia: { lat: 30.6043, lng: 32.2722, country: 'Egypt' },
      fayoum: { lat: 29.3084, lng: 30.8428, country: 'Egypt' },
      minya: { lat: 28.1099, lng: 30.7503, country: 'Egypt' },
      asyut: { lat: 27.1801, lng: 31.1837, country: 'Egypt' },
      sohag: { lat: 26.5569, lng: 31.6948, country: 'Egypt' },
      qena: { lat: 26.1642, lng: 32.7267, country: 'Egypt' },
      luxor: { lat: 25.6872, lng: 32.6396, country: 'Egypt' },
      aswan: { lat: 24.0889, lng: 32.8998, country: 'Egypt' },
      
      // UAE / Dubai
      dubai: { lat: 25.2048, lng: 55.2708, country: 'UAE', emirate: 'Dubai' },
      abudhabi: { lat: 24.4539, lng: 54.3773, country: 'UAE', emirate: 'Abu Dhabi' },
      sharjah: { lat: 25.3573, lng: 55.4033, country: 'UAE', emirate: 'Sharjah' },
      ajman: { lat: 25.4052, lng: 55.5136, country: 'UAE', emirate: 'Ajman' },
      ummalquwain: { lat: 25.5650, lng: 55.5552, country: 'UAE', emirate: 'Umm Al Quwain' },
      rasalkhaimah: { lat: 25.7889, lng: 55.9590, country: 'UAE', emirate: 'Ras Al Khaimah' },
      fujairah: { lat: 25.1288, lng: 56.3264, country: 'UAE', emirate: 'Fujairah' },
      
      // Dubai Areas
      'dubai marina': { lat: 25.0772, lng: 55.1398, country: 'UAE', emirate: 'Dubai' },
      'downtown dubai': { lat: 25.1972, lng: 55.2744, country: 'UAE', emirate: 'Dubai' },
      'business bay': { lat: 25.1867, lng: 55.2644, country: 'UAE', emirate: 'Dubai' },
      'jumeirah': { lat: 25.2000, lng: 55.2400, country: 'UAE', emirate: 'Dubai' },
      'deira': { lat: 25.2667, lng: 55.3000, country: 'UAE', emirate: 'Dubai' },
      'bur dubai': { lat: 25.2500, lng: 55.3000, country: 'UAE', emirate: 'Dubai' },
      'dubai internet city': { lat: 25.0900, lng: 55.1600, country: 'UAE', emirate: 'Dubai' },
      'dubai media city': { lat: 25.0900, lng: 55.1600, country: 'UAE', emirate: 'Dubai' },
      'dubai knowledge park': { lat: 25.0900, lng: 55.1600, country: 'UAE', emirate: 'Dubai' },
      'palm jumeirah': { lat: 25.1124, lng: 55.1390, country: 'UAE', emirate: 'Dubai' },
      'dubai sports city': { lat: 25.0400, lng: 55.2000, country: 'UAE', emirate: 'Dubai' },
      'international city': { lat: 25.1500, lng: 55.3500, country: 'UAE', emirate: 'Dubai' },
      'motor city': { lat: 25.0500, lng: 55.2000, country: 'UAE', emirate: 'Dubai' },
      'dubai production city': { lat: 25.0900, lng: 55.1600, country: 'UAE', emirate: 'Dubai' }
    };
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address, options = {}) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.googleMapsApiKey}&region=eg`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${data.status}`);
      }

      const result = data.results[0];
      const location = result.geometry.location;

      // Validate coordinates are in Egypt
      if (!this.isInEgypt(location.lat, location.lng)) {
        logger.warn('Geocoded location outside Egypt', { address, location });
      }

      return {
        success: true,
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        types: result.types,
        confidence: result.geometry.location_type === 'ROOFTOP' ? 'high' : 'medium'
      };
    } catch (error) {
      logger.error('Address geocoding failed', {
        address,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude, longitude, options = {}) {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.googleMapsApiKey}&language=en`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }

      const result = data.results[0];

      return {
        success: true,
        formattedAddress: result.formatted_address,
        addressComponents: this.parseAddressComponents(result.address_components),
        placeId: result.place_id,
        types: result.types
      };
    } catch (error) {
      logger.error('Reverse geocoding failed', {
        latitude,
        longitude,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse address components from Google Maps response
   */
  parseAddressComponents(components) {
    const parsed = {};

    components.forEach(component => {
      const types = component.types;

      if (types.includes('street_number')) {
        parsed.streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        parsed.street = component.long_name;
      }
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        parsed.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        parsed.governorate = component.long_name;
      }
      if (types.includes('country')) {
        parsed.country = component.long_name;
      }
      if (types.includes('postal_code')) {
        parsed.postalCode = component.long_name;
      }
    });

    return parsed;
  }

  /**
   * Calculate distance and delivery info between two points
   */
  async calculateRouteInfo(originLat, originLng, destLat, destLng, options = {}) {
    try {
      const origin = `${originLat},${originLng}`;
      const destination = `${destLat},${destLng}`;

      // Use Google Maps Distance Matrix API
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${this.googleMapsApiKey}&units=metric&mode=driving`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || data.rows[0].elements[0].status !== 'OK') {
        throw new Error('Route calculation failed');
      }

      const element = data.rows[0].elements[0];
      const distanceKm = element.distance.value / 1000; // Convert to km
      const durationSec = element.duration.value; // Duration in seconds

      // Calculate delivery time and cost
      const deliveryInfo = calculateDeliveryTime(distanceKm);
      const deliveryCost = this.calculateDeliveryCost(distanceKm);

      return {
        success: true,
        distance: {
          meters: element.distance.value,
          kilometers: distanceKm,
          text: element.distance.text
        },
        duration: {
          seconds: durationSec,
          minutes: Math.round(durationSec / 60),
          text: element.duration.text
        },
        deliveryInfo,
        deliveryCost,
        routeAvailable: true
      };
    } catch (error) {
      logger.error('Route calculation failed', {
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        error: error.message
      });

      // Fallback to straight-line distance
      const straightDistance = calculateDistance(originLat, originLng, destLat, destLng);
      const deliveryInfo = calculateDeliveryTime(straightDistance);
      const deliveryCost = this.calculateDeliveryCost(straightDistance);

      return {
        success: false,
        error: error.message,
        distance: {
          kilometers: straightDistance,
          text: `${straightDistance.toFixed(1)} km (straight line)`
        },
        deliveryInfo,
        deliveryCost,
        routeAvailable: false
      };
    }
  }

  /**
   * Calculate delivery cost based on distance
   */
  calculateDeliveryCost(distanceKm, options = {}) {
    const baseFee = options.baseFee || 1500; // 15 EGP in piastres
    const perKmFee = options.perKmFee || 500; // 5 EGP per km in piastres

    let cost = baseFee;

    if (distanceKm > 2) { // First 2km free
      cost += (distanceKm - 2) * perKmFee;
    }

    // Cap maximum delivery cost
    const maxCost = 10000; // 100 EGP
    cost = Math.min(cost, maxCost);

    return {
      baseFee,
      perKmFee,
      distanceKm,
      totalCost: Math.round(cost),
      currency: 'EGP'
    };
  }

  /**
   * Check if coordinates are within Egypt
   */
  isInEgypt(latitude, longitude) {
    return latitude >= this.egyptBounds.south &&
           latitude <= this.egyptBounds.north &&
           longitude >= this.egyptBounds.west &&
           longitude <= this.egyptBounds.east;
  }

  /**
   * Find nearby businesses
   */
  async findNearbyBusinesses(userLat, userLng, radiusKm = 5, options = {}) {
    try {
      // This would typically query the database for businesses within radius
      // For now, return mock data structure

      const businesses = [
        {
          id: '1',
          name: 'Sample Restaurant',
          latitude: userLat + 0.01,
          longitude: userLng + 0.01,
          distance: calculateDistance(userLat, userLng, userLat + 0.01, userLng + 0.01),
          rating: 4.5,
          cuisine: 'Italian'
        }
      ];

      return {
        success: true,
        businesses: businesses.filter(business => business.distance <= radiusKm),
        center: { latitude: userLat, longitude: userLng },
        radius: radiusKm
      };
    } catch (error) {
      logger.error('Nearby businesses search failed', {
        userLat,
        userLng,
        radiusKm,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(originLat, originLng, destLat, destLng, options = {}) {
    try {
      const origin = `${originLat},${originLng}`;
      const destination = `${destLat},${destLng}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${this.googleMapsApiKey}&mode=driving&alternatives=false`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions request failed: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        success: true,
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance,
          duration: step.duration,
          startLocation: step.start_location,
          endLocation: step.end_location
        })),
        polyline: route.overview_polyline.points,
        bounds: route.bounds
      };
    } catch (error) {
      logger.error('Directions request failed', {
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate delivery address
   */
  async validateDeliveryAddress(address, options = {}) {
    try {
      const geocoded = await this.geocodeAddress(address);

      if (!geocoded.success) {
        return {
          isValid: false,
          error: 'Address could not be geocoded',
          suggestions: []
        };
      }

      // Check if address is in Egypt
      if (!this.isInEgypt(geocoded.latitude, geocoded.longitude)) {
        return {
          isValid: false,
          error: 'Address is outside our delivery area (Egypt only)',
          suggestions: []
        };
      }

      // Check delivery radius from business (if specified)
      if (options.businessLocation) {
        const distance = calculateDistance(
          geocoded.latitude,
          geocoded.longitude,
          options.businessLocation.latitude,
          options.businessLocation.longitude
        );

        if (distance > (options.maxDeliveryRadius || 20)) {
          return {
            isValid: false,
            error: `Address is ${distance.toFixed(1)}km away, maximum delivery distance is ${options.maxDeliveryRadius || 20}km`,
            suggestions: []
          };
        }
      }

      return {
        isValid: true,
        geocoded,
        deliveryPossible: true
      };
    } catch (error) {
      logger.error('Address validation failed', {
        address,
        error: error.message
      });

      return {
        isValid: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${this.googleMapsApiKey}&fields=name,formatted_address,geometry,types,opening_hours,rating,reviews`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Place details request failed: ${data.status}`);
      }

      const place = data.result;

      return {
        success: true,
        name: place.name,
        address: place.formatted_address,
        location: place.geometry.location,
        types: place.types,
        rating: place.rating,
        openingHours: place.opening_hours,
        reviews: place.reviews?.slice(0, 5) || [] // Limit to 5 reviews
      };
    } catch (error) {
      logger.error('Place details request failed', {
        placeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Search for places
   */
  async searchPlaces(query, location, options = {}) {
    try {
      const { latitude, longitude } = location;
      const radius = options.radius || 5000; // 5km default

      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=${radius}&key=${this.googleMapsApiKey}&region=eg`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Places search failed: ${data.status}`);
      }

      return {
        success: true,
        results: data.results.map(place => ({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          types: place.types,
          distance: calculateDistance(
            latitude,
            longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          )
        }))
      };
    } catch (error) {
      logger.error('Places search failed', {
        query,
        location,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get city information
   */
  /**
   * Get city information by name (supports multiple countries)
   */
  getCityInfo(cityName) {
    if (!cityName) return null;

    const normalizedName = cityName.toLowerCase().replace(/\s+/g, '');
    const cityData = this.majorCities[normalizedName];

    if (cityData) {
      return {
        lat: cityData.lat,
        lng: cityData.lng,
        country: cityData.country || 'Egypt',
        emirate: cityData.emirate || null
      };
    }

    // Try partial match for cities with spaces
    for (const [key, data] of Object.entries(this.majorCities)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return {
          lat: data.lat,
          lng: data.lng,
          country: data.country || 'Egypt',
          emirate: data.emirate || null
        };
      }
    }

    return null;
  }

  /**
   * Calculate optimal delivery route for multiple stops
   */
  async calculateOptimalRoute(stops, options = {}) {
    try {
      // This would use Google Maps Directions API with waypoints
      // For now, return a simple implementation

      const origin = stops[0];
      const destination = stops[stops.length - 1];
      const waypoints = stops.slice(1, -1);

      // Calculate total distance and time
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < stops.length - 1; i++) {
        const route = await this.calculateRouteInfo(
          stops[i].latitude,
          stops[i].longitude,
          stops[i + 1].latitude,
          stops[i + 1].longitude
        );

        if (route.success) {
          totalDistance += route.distance.kilometers;
          totalDuration += route.duration.seconds;
        }
      }

      return {
        success: true,
        stops,
        totalDistance,
        totalDuration,
        estimatedDeliveryTime: new Date(Date.now() + (totalDuration * 1000)),
        waypoints: waypoints.map((stop, index) => ({
          ...stop,
          order: index + 1
        }))
      };
    } catch (error) {
      logger.error('Optimal route calculation failed', {
        stopsCount: stops.length,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get map static image URL
   */
  getStaticMapUrl(latitude, longitude, options = {}) {
    const zoom = options.zoom || 15;
    const size = options.size || '400x300';
    const markers = options.markers || `color:red|${latitude},${longitude}`;

    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&markers=${markers}&key=${this.googleMapsApiKey}`;
  }

  /**
   * Validate coordinates format
   */
  validateCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return { isValid: false, error: 'Invalid coordinate format' };
    }

    if (lat < -90 || lat > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90' };
    }

    if (lng < -180 || lng > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180' };
    }

    return {
      isValid: true,
      latitude: lat,
      longitude: lng,
      inEgypt: this.isInEgypt(lat, lng)
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const status = {
      googleMaps: false,
      lastChecked: new Date()
    };

    try {
      if (this.googleMapsApiKey) {
        // Simple API test
        const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=cairo&key=${this.googleMapsApiKey}`;
        const response = await fetch(testUrl);
        const data = await response.json();
        status.googleMaps = data.status === 'OK';
      }
    } catch (error) {
      status.error = error.message;
    }

    return status;
  }
}

module.exports = new MapsService();
