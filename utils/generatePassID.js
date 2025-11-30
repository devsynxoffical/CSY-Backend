const crypto = require('crypto');

/**
 * Generate unique Pass ID for users
 * Format: DM-XXXXXX (where DM is governorate code and XXXXXX is 6 digits)
 * @param {string} governorateCode - Two-letter governorate code (DM, HS, HM, etc.)
 * @returns {string} Generated Pass ID
 */
const generatePassID = (governorateCode = 'DM') => {
  // Generate 6-digit random number
  const randomDigits = crypto.randomInt(100000, 999999);

  // Combine governorate code with random digits
  const passId = `${governorateCode}-${randomDigits}`;

  return passId;
};

/**
 * Validate Pass ID format
 * @param {string} passId - Pass ID to validate
 * @returns {boolean} True if valid format
 */
const validatePassID = (passId) => {
  const passIdRegex = /^[A-Z]{2}-\d{6}$/;
  return passIdRegex.test(passId);
};

/**
 * Extract governorate code from Pass ID
 * @param {string} passId - Pass ID
 * @returns {string} Governorate code
 */
const getGovernorateFromPassID = (passId) => {
  if (!validatePassID(passId)) {
    throw new Error('Invalid Pass ID format');
  }
  return passId.substring(0, 2);
};

/**
 * Generate multiple unique Pass IDs
 * @param {string} governorateCode - Governorate code
 * @param {number} count - Number of IDs to generate
 * @returns {string[]} Array of unique Pass IDs
 */
const generateMultiplePassIDs = (governorateCode = 'DM', count = 1) => {
  const passIds = new Set();

  while (passIds.size < count) {
    const passId = generatePassID(governorateCode);
    passIds.add(passId);
  }

  return Array.from(passIds);
};

/**
 * Generate Pass ID with custom prefix
 * @param {string} prefix - Custom prefix (2 characters)
 * @param {number} digits - Number of digits (default 6)
 * @returns {string} Generated ID
 */
const generateCustomID = (prefix = 'DM', digits = 6) => {
  if (prefix.length !== 2 || !/^[A-Z]{2}$/.test(prefix)) {
    throw new Error('Prefix must be exactly 2 uppercase letters');
  }

  if (digits < 4 || digits > 8) {
    throw new Error('Digits must be between 4 and 8');
  }

  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const randomDigits = crypto.randomInt(min, max);

  return `${prefix}-${randomDigits.toString().padStart(digits, '0')}`;
};

/**
 * Check if Pass ID is available (not in use)
 * This would typically check against a database
 * @param {string} passId - Pass ID to check
 * @param {Function} checkFunction - Async function to check database
 * @returns {Promise<boolean>} True if available
 */
const isPassIDAvailable = async (passId, checkFunction) => {
  try {
    if (!validatePassID(passId)) {
      return false;
    }

    // Call the provided check function (e.g., database query)
    const exists = await checkFunction(passId);
    return !exists;
  } catch (error) {
    console.error('Error checking Pass ID availability:', error);
    return false;
  }
};

/**
 * Generate unique Pass ID with availability check
 * @param {string} governorateCode - Governorate code
 * @param {Function} checkFunction - Async function to check database
 * @param {number} maxAttempts - Maximum attempts to find unique ID
 * @returns {Promise<string|null>} Unique Pass ID or null if failed
 */
const generateUniquePassID = async (governorateCode = 'DM', checkFunction, maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const passId = generatePassID(governorateCode);
    const isAvailable = await isPassIDAvailable(passId, checkFunction);

    if (isAvailable) {
      return passId;
    }
  }

  console.error(`Failed to generate unique Pass ID after ${maxAttempts} attempts`);
  return null;
};

module.exports = {
  generatePassID,
  validatePassID,
  getGovernorateFromPassID,
  generateMultiplePassIDs,
  generateCustomID,
  isPassIDAvailable,
  generateUniquePassID
};
