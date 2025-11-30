const { calculateDistance } = require('./calculateFees');

/**
 * Validate address components
 * @param {Object} address - Address object
 * @returns {Object} Validation result
 */
const validateAddress = (address) => {
  const errors = [];
  const warnings = [];

  // Required fields validation
  if (!address.recipient_name || address.recipient_name.trim().length < 2) {
    errors.push('Recipient name is required and must be at least 2 characters');
  }

  if (!address.area || address.area.trim().length < 2) {
    errors.push('Area is required and must be at least 2 characters');
  }

  if (!address.street || address.street.trim().length < 5) {
    errors.push('Street address is required and must be at least 5 characters');
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required and must be at least 2 characters');
  }

  if (!address.phone || !isValidPhoneNumber(address.phone)) {
    errors.push('Valid phone number is required');
  }

  // Coordinate validation
  if (address.latitude !== undefined && address.longitude !== undefined) {
    if (!isValidLatitude(address.latitude)) {
      errors.push('Invalid latitude. Must be between -90 and 90');
    }

    if (!isValidLongitude(address.longitude)) {
      errors.push('Invalid longitude. Must be between -180 and 180');
    }
  } else {
    warnings.push('Coordinates (latitude/longitude) are recommended for accurate delivery');
  }

  // Optional field validations
  if (address.floor && address.floor.length > 50) {
    warnings.push('Floor information is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
const isValidPhoneNumber = (phone) => {
  // Allow Egyptian (+20) or Syrian (+963) or generic international format
  const phoneRegex = /^(\+|00)?[0-9]{6,15}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Validate latitude
 * @param {number} lat - Latitude
 * @returns {boolean} True if valid
 */
const isValidLatitude = (lat) => {
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
};

/**
 * Validate longitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
const isValidLongitude = (lng) => {
  return typeof lng === 'number' && lng >= -180 && lng <= 180;
};

/**
 * Geocode address using Google Maps API (requires API key)
 * @param {string} addressString - Full address string
 * @returns {Promise<Object>} Geocoding result
 */
const geocodeAddress = async (addressString) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const encodedAddress = encodeURIComponent(addressString);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      success: true,
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      types: result.types
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} Reverse geocoding result
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${data.status}`);
    }

    const result = data.results[0];

    return {
      success: true,
      formattedAddress: result.formatted_address,
      addressComponents: result.address_components,
      placeId: result.place_id,
      types: result.types
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Calculate distance between two addresses
 * @param {Object} address1 - First address with lat/lng
 * @param {Object} address2 - Second address with lat/lng
 * @returns {number} Distance in kilometers
 */
const calculateAddressDistance = (address1, address2) => {
  if (!address1.latitude || !address1.longitude || !address2.latitude || !address2.longitude) {
    throw new Error('Both addresses must have latitude and longitude');
  }

  return calculateDistance(
    address1.latitude,
    address1.longitude,
    address2.latitude,
    address2.longitude
  );
};

/**
 * Format address for display
 * @param {Object} address - Address object
 * @returns {string} Formatted address string
 */
const formatAddress = (address) => {
  const parts = [];

  if (address.recipient_name) parts.push(address.recipient_name);
  if (address.street) parts.push(address.street);
  if (address.area) parts.push(address.area);
  if (address.city) parts.push(address.city);
  if (address.floor) parts.push(`Floor: ${address.floor}`);

  return parts.join(', ');
};

/**
 * Extract address components from formatted address
 * @param {string} formattedAddress - Full address string
 * @returns {Object} Address components
 */
const parseAddress = (formattedAddress) => {
  // This is a simple parser - in production, use Google Maps API for better parsing
  const parts = formattedAddress.split(',').map(part => part.trim());

  return {
    street: parts[0] || '',
    area: parts[1] || '',
    city: parts[2] || '',
    country: parts[3] || 'Egypt'
  };
};

/**
 * Check if address is within delivery area
 * @param {Object} address - Address with coordinates
 * @param {Array} deliveryAreas - Array of delivery area polygons
 * @returns {boolean} True if within delivery area
 */
const isWithinDeliveryArea = (address, deliveryAreas) => {
  if (!address.latitude || !address.longitude || !deliveryAreas) {
    return false;
  }

  // Simple bounding box check (for more complex polygons, use a proper library)
  return deliveryAreas.some(area => {
    if (area.type === 'circle') {
      const distance = calculateDistance(
        address.latitude,
        address.longitude,
        area.center.lat,
        area.center.lng
      );
      return distance <= area.radiusKm;
    }

    if (area.type === 'rectangle') {
      return address.latitude >= area.bounds.south &&
        address.latitude <= area.bounds.north &&
        address.longitude >= area.bounds.west &&
        address.longitude <= area.bounds.east;
    }

    return false;
  });
};

/**
 * Suggest address corrections
 * @param {Object} address - Address to check
 * @returns {Array} Suggestions for corrections
 */
const suggestAddressCorrections = (address) => {
  const suggestions = [];

  // Check for common issues
  if (address.street && address.street.length < 5) {
    suggestions.push('Street address seems too short. Please provide more details.');
  }

  if (address.area && !address.area.toLowerCase().includes('egypt')) {
    suggestions.push('Consider adding "Egypt" to the address for clarity.');
  }

  if (!address.floor && address.street.toLowerCase().includes('building')) {
    suggestions.push('Building addresses usually need floor and apartment information.');
  }

  return suggestions;
};

/**
 * Normalize address format
 * @param {Object} address - Address to normalize
 * @returns {Object} Normalized address
 */
const normalizeAddress = (address) => {
  return {
    recipient_name: address.recipient_name?.trim() || '',
    area: address.area?.trim() || '',
    street: address.street?.trim() || '',
    city: address.city?.trim() || '',
    floor: address.floor?.trim() || '',
    phone: address.phone?.replace(/\s+/g, '') || '',
    latitude: address.latitude || null,
    longitude: address.longitude || null,
    is_default: address.is_default || false
  };
};

module.exports = {
  validateAddress,
  isValidPhoneNumber,
  isValidLatitude,
  isValidLongitude,
  geocodeAddress,
  reverseGeocode,
  calculateAddressDistance,
  formatAddress,
  parseAddress,
  isWithinDeliveryArea,
  suggestAddressCorrections,
  normalizeAddress
};
