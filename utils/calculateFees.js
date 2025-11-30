const { FEES } = require('../config/constants');

/**
 * Calculate platform fee for an order
 * @param {number} subtotal - Order subtotal
 * @returns {number} Platform fee
 */
const calculatePlatformFee = (subtotal) => {
  return Math.round(subtotal * FEES.PLATFORM_FEE_PERCENTAGE);
};

/**
 * Calculate delivery fee based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} baseFee - Base delivery fee (optional, uses default)
 * @param {number} perKmFee - Per kilometer fee (optional, uses default)
 * @returns {number} Delivery fee
 */
const calculateDeliveryFee = (distanceKm, baseFee = null, perKmFee = null) => {
  const base = baseFee || FEES.DELIVERY_FEE_BASE;
  const perKm = perKmFee || FEES.DELIVERY_FEE_PER_KM;

  const totalFee = base + (distanceKm * perKm);
  return Math.round(totalFee);
};

/**
 * Calculate driver earnings from delivery fee
 * @param {number} deliveryFee - Total delivery fee
 * @param {number} platformFeePercentage - Platform fee percentage (optional)
 * @returns {Object} Earnings breakdown
 */
const calculateDriverEarnings = (deliveryFee, platformFeePercentage = null) => {
  const platformFee = platformFeePercentage || FEES.DRIVER_PLATFORM_FEE_PERCENTAGE;
  const driverEarnings = Math.round(deliveryFee * (1 - platformFee));
  const platformCut = deliveryFee - driverEarnings;

  return {
    totalDeliveryFee: deliveryFee,
    driverEarnings,
    platformFee: platformCut,
    earningsPercentage: Math.round((driverEarnings / deliveryFee) * 100)
  };
};

/**
 * Calculate order totals
 * @param {Array} items - Order items with price and quantity
 * @param {number} deliveryFee - Delivery fee
 * @param {number} discountAmount - Discount amount (optional)
 * @returns {Object} Order totals
 */
const calculateOrderTotals = (items, deliveryFee = 0, discountAmount = 0) => {
  // Calculate subtotal from items
  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate platform fee
  const platformFee = calculatePlatformFee(subtotal);

  // Calculate total before discount
  const totalBeforeDiscount = subtotal + deliveryFee + platformFee;

  // Apply discount
  const finalAmount = Math.max(0, totalBeforeDiscount - discountAmount);

  return {
    subtotal: Math.round(subtotal),
    deliveryFee: Math.round(deliveryFee),
    platformFee: Math.round(platformFee),
    discountAmount: Math.round(discountAmount),
    totalBeforeDiscount: Math.round(totalBeforeDiscount),
    finalAmount: Math.round(finalAmount)
  };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate estimated delivery time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} averageSpeedKmh - Average speed (default 30 km/h)
 * @param {number} preparationTimeMin - Preparation time in minutes (default 15)
 * @returns {Object} Delivery time estimation
 */
const calculateDeliveryTime = (distanceKm, averageSpeedKmh = 30, preparationTimeMin = 15) => {
  const travelTimeMin = (distanceKm / averageSpeedKmh) * 60;
  const totalTimeMin = preparationTimeMin + travelTimeMin;

  const estimatedTime = new Date(Date.now() + (totalTimeMin * 60 * 1000));

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    travelTimeMin: Math.round(travelTimeMin),
    preparationTimeMin,
    totalTimeMin: Math.round(totalTimeMin),
    estimatedDeliveryTime: estimatedTime
  };
};

/**
 * Calculate wallet transaction fees
 * @param {number} amount - Transaction amount
 * @param {string} transactionType - Type of transaction
 * @returns {Object} Fee calculation
 */
const calculateWalletFees = (amount, transactionType) => {
  let fee = 0;
  let feeType = 'none';

  switch (transactionType) {
    case 'withdrawal':
      // 2% withdrawal fee with minimum 5 EGP
      fee = Math.max(500, Math.round(amount * 0.02));
      feeType = 'percentage';
      break;
    case 'topup':
      // No fee for topups
      fee = 0;
      feeType = 'none';
      break;
    case 'transfer':
      // 1 EGP fixed fee for transfers
      fee = 100;
      feeType = 'fixed';
      break;
    default:
      fee = 0;
      feeType = 'none';
  }

  return {
    originalAmount: amount,
    fee,
    feeType,
    finalAmount: amount - fee
  };
};

/**
 * Calculate points earned from purchase
 * @param {number} amount - Purchase amount in piastres
 * @param {number} pointsPerEGP - Points per EGP (optional, uses default)
 * @returns {number} Points earned
 */
const calculatePointsEarned = (amount, pointsPerEGP = null) => {
  const pointsRate = pointsPerEGP || FEES.POINTS_PER_EGP_SPENT;
  // Amount is in piastres, convert to EGP for calculation
  const amountEGP = amount / 100;
  return Math.floor(amountEGP * pointsRate);
};

/**
 * Calculate EGP equivalent of points for redemption
 * @param {number} points - Points to redeem
 * @param {number} egpPerPoint - EGP per point (optional, uses default)
 * @returns {number} EGP amount
 */
const calculatePointsRedemption = (points, egpPerPoint = null) => {
  const redemptionRate = egpPerPoint || FEES.EGP_PER_POINT_REDEEMED;
  return Math.round(points * redemptionRate);
};

/**
 * Calculate business commission from order
 * @param {number} orderTotal - Total order amount
 * @param {number} commissionPercentage - Commission percentage (default 10%)
 * @returns {Object} Commission breakdown
 */
const calculateBusinessCommission = (orderTotal, commissionPercentage = 0.10) => {
  const commission = Math.round(orderTotal * commissionPercentage);
  const businessEarnings = orderTotal - commission;

  return {
    orderTotal,
    commission,
    commissionPercentage: Math.round(commissionPercentage * 100),
    businessEarnings
  };
};

/**
 * Calculate tax amount
 * @param {number} amount - Amount to calculate tax on
 * @param {number} taxRate - Tax rate as decimal (default 0.14 for 14% VAT)
 * @returns {Object} Tax calculation
 */
const calculateTax = (amount, taxRate = 0.14) => {
  const taxAmount = Math.round(amount * taxRate);
  const totalWithTax = amount + taxAmount;

  return {
    originalAmount: amount,
    taxAmount,
    taxRate: Math.round(taxRate * 100),
    totalWithTax
  };
};

/**
 * Calculate cancellation fee
 * @param {string} orderStatus - Current order status
 * @param {number} orderTotal - Order total amount
 * @param {number} cancellationFeePercentage - Fee percentage (default 10%)
 * @returns {Object} Cancellation fee
 */
const calculateCancellationFee = (orderStatus, orderTotal, cancellationFeePercentage = 0.10) => {
  let fee = 0;
  let reason = '';

  switch (orderStatus) {
    case 'pending':
      fee = 0; // No fee for cancelling pending orders
      reason = 'No cancellation fee for pending orders';
      break;
    case 'accepted':
    case 'preparing':
      fee = Math.round(orderTotal * cancellationFeePercentage);
      reason = `Cancellation fee for ${orderStatus} orders`;
      break;
    case 'waiting_driver':
    case 'in_delivery':
      fee = Math.round(orderTotal * (cancellationFeePercentage * 2)); // Double fee
      reason = `High cancellation fee for ${orderStatus} orders`;
      break;
    default:
      fee = 0;
      reason = 'Order cannot be cancelled at this stage';
  }

  return {
    orderStatus,
    orderTotal,
    cancellationFee: fee,
    feePercentage: Math.round(cancellationFeePercentage * 100),
    reason
  };
};

module.exports = {
  calculatePlatformFee,
  calculateDeliveryFee,
  calculateDriverEarnings,
  calculateOrderTotals,
  calculateDistance,
  toRadians,
  calculateDeliveryTime,
  calculateWalletFees,
  calculatePointsEarned,
  calculatePointsRedemption,
  calculateBusinessCommission,
  calculateTax,
  calculateCancellationFee
};
