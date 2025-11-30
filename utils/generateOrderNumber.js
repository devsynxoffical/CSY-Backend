/**
 * Generate unique order numbers
 */

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXXXX (e.g., ORD-20241201-000001)
 * @returns {string} Unique order number
 */
const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Generate a random 6-digit number
  const randomPart = Math.floor(100000 + Math.random() * 900000);

  return `ORD-${year}${month}${day}-${randomPart}`;
};

module.exports = {
  generateOrderNumber
};
