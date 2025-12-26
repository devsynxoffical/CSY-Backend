const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { paymentService, notificationService, qrService, mapsService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_RULES } = require('../config/constants');
const { generateOrderNumber, calculatePlatformFee, calculatePartnerDiscount, calculateDeliveryFee } = require('../utils');

/**
 * Order Controller - Handles order creation, management and tracking operations
 */
class OrderController {
  /**
   * Create a new order
   */
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const {
        items,
        order_type,
        payment_method,
        delivery_address,
        delivery_notes,
        coupon_code
      } = req.body;

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order items are required',
          error: 'MISSING_ORDER_ITEMS'
        });
      }

      if (!order_type || !['delivery', 'pickup'].includes(order_type)) {
        return res.status(400).json({
          success: false,
          message: 'Valid order type is required (delivery or pickup)',
          error: 'INVALID_ORDER_TYPE'
        });
      }

      if (!payment_method || !['cash', 'online'].includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'Valid payment method is required (cash or online)',
          error: 'INVALID_PAYMENT_METHOD'
        });
      }

      if (order_type === 'delivery' && !delivery_address) {
        return res.status(400).json({
          success: false,
          message: 'Delivery address is required for delivery orders',
          error: 'MISSING_DELIVERY_ADDRESS'
        });
      }

      // Validate and calculate order items
      let totalAmount = 0;
      let platformFee = 0;
      let deliveryFee = 0;
      const orderItems = [];

      for (const item of items) {
        const { product_id, quantity, add_ons } = item;

        if (!product_id || !quantity || quantity < 1) {
          return res.status(400).json({
            success: false,
            message: 'Invalid product or quantity',
            error: 'INVALID_PRODUCT_DATA'
          });
        }

        // Validate product_id format (UUID)
        const trimmedProductId = product_id.trim();
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedProductId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid product ID format: ${product_id}`,
            error: 'INVALID_PRODUCT_ID_FORMAT'
          });
        }

        // Get product details
        const product = await prisma.product.findUnique({ 
          where: { id: trimmedProductId },
          include: {
            business: {
              select: { id: true, business_name: true, is_active: true }
            }
          }
        });
        
        if (!product) {
          logger.warn('Product not found during order creation', { 
            product_id: trimmedProductId,
            userId: req.user.id
          });
          return res.status(404).json({
            success: false,
            message: `Product not found: ${product_id}`,
            error: 'PRODUCT_NOT_FOUND'
          });
        }

        // Check if business is active
        if (!product.business || !product.business.is_active) {
          return res.status(400).json({
            success: false,
            message: `Product's business is not active`,
            error: 'BUSINESS_NOT_ACTIVE'
          });
        }

        if (!product.is_available) {
          return res.status(400).json({
            success: false,
            message: `Product is not available: ${product.name}`,
            error: 'PRODUCT_NOT_AVAILABLE'
          });
        }

        // Calculate item total
        let itemTotal = Number(product.price) * quantity;

        // Add add-ons pricing if any
        if (add_ons && Array.isArray(add_ons)) {
          for (const addOn of add_ons) {
            if (addOn.price) {
              itemTotal += addOn.price * quantity;
            }
          }
        }

        totalAmount += itemTotal;

        orderItems.push({
          product_id: trimmedProductId,
          business_id: product.business_id,
          quantity,
          unit_price: Number(product.price),
          total_price: itemTotal,
          preferences: add_ons && add_ons.length > 0 ? { add_ons } : null,
          is_available: product.is_available
        });
      }

      // Get business info (handle multi-establishment)
      const distinctBusinessIds = [...new Set(orderItems.map(item => item.business_id))];
      const businesses = await prisma.business.findMany({
        where: { id: { in: distinctBusinessIds } }
      });

      if (businesses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Business not found',
          error: 'BUSINESS_NOT_FOUND'
        });
      }

      // Use the first business as primary for distance/address logic
      const business = businesses[0];

      // Check for active "CoreSY Go" subscription
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          user_id: userId,
          is_active: true,
          end_date: { gte: new Date() },
          app_type: { in: ['go', 'pass_go', 'care_go'] }
        }
      });

      // Calculate taxes and fees
      let discountAmount = 0;

      // Distance Logic
      let distance = 5; // Default fallback
      if (business && business.latitude && business.longitude && delivery_address && delivery_address.latitude && delivery_address.longitude) {
        try {
          distance = await mapsService.calculateDistance(
            { lat: Number(business.latitude), lng: Number(business.longitude) },
            { lat: Number(delivery_address.latitude), lng: Number(delivery_address.longitude) }
          );
        } catch (e) {
          logger.warn('Distance calculation error', e);
        }
      }

      // Determine Base Delivery Fee (Dynamic)
      if (order_type === 'delivery') {
        // Base 15 EGP (approx 1500 SYP). Plus 15 EGP per extra km beyond 3km.
        deliveryFee = 15;
        if (distance > 3) {
          deliveryFee += Math.ceil(distance - 3) * 15;
        }

        // Multi-Establishment Surcharge
        const distinctBusinessIds = [...new Set(orderItems.map(item => item.business_id))];
        if (distinctBusinessIds.length > 1) {
          // Add 50 EGP for each additional establishment
          deliveryFee += (distinctBusinessIds.length - 1) * 50;
        }
      }

      // Apply Logic: CoreSY Go vs Standard
      if (activeSubscription && distance <= 3 && order_type === 'delivery') {
        deliveryFee = 0;
        discountAmount = 0; // Free delivery exception
      } else {
        discountAmount = calculatePartnerDiscount(totalAmount);
      }

      // Platform Fee (2%) - Calculated on (Subtotal - Discount)
      platformFee = calculatePlatformFee(totalAmount - discountAmount);

      const finalAmount = totalAmount - discountAmount + deliveryFee + platformFee;

      // Generate order number
      const orderNumber = generateOrderNumber();

      // Create order with Prisma
      const order = await prisma.order.create({
        data: {
          order_number: orderNumber,
          user_id: userId,
          order_type,
          payment_method,
          payment_status: 'pending',
          status: 'pending',
          delivery_address: delivery_address || {},
          total_amount: totalAmount,
          discount_amount: discountAmount,
          platform_fee: platformFee,
          delivery_fee: deliveryFee,
          final_amount: finalAmount
        }
      });

      // Create order items
      for (const item of orderItems) {
        await prisma.orderItem.create({
          data: {
            order_id: order.id,
            business_id: item.business_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            preferences: item.preferences,
            is_available: item.is_available
          }
        });
      }

      // Generate QR code for pickup orders
      if (order_type === 'pickup') {
        const qrCode = await qrService.generateOrderQR(order.id);
        await prisma.order.update({
          where: { id: order.id },
          data: { qr_code: qrCode }
        });
      }

      // Send notification to business(es)
      try {
        for (const biz of businesses) {
          await notificationService.sendNotification(
            biz.owner_email,
            'New Order Received',
            `You have received a new ${order_type} order #${orderNumber}`,
            { orderId: order.id, type: 'new_order' }
          );
        }
      } catch (notificationError) {
        logger.error('Failed to send order notification to business(es)', {
          orderId: order.id,
          error: notificationError.message
        });
      }

      // Return order details
      let orderDetails = null;
      try {
        orderDetails = await this._getOrderDetailsHelper(order.id);
        if (!orderDetails) {
          logger.warn('Order details helper returned null', { orderId: order.id });
          // Fallback: return basic order info if helper fails
          orderDetails = {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            order_type: order.order_type,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            total_amount: order.total_amount,
            final_amount: order.final_amount,
            created_at: order.created_at
          };
        }
      } catch (detailsError) {
        logger.error('Failed to get order details after creation', {
          orderId: order.id,
          error: detailsError.message,
          stack: detailsError.stack
        });
        // Fallback: return basic order info
        orderDetails = {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          order_type: order.order_type,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          total_amount: order.total_amount,
          final_amount: order.final_amount,
          created_at: order.created_at
        };
      }

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: orderDetails
        }
      });

    } catch (error) {
      logger.error('Create order error', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Get order details
   */
  async getOrderDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const orderDetails = await this._getOrderDetailsHelper(id);

      if (!orderDetails) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: ERROR_MESSAGES.ORDER_NOT_FOUND
        });
      }

      // Check if user owns this order
      if (orderDetails.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'UNAUTHORIZED_ACCESS'
        });
      }

      res.json({
        success: true,
        message: 'Order details retrieved successfully',
        data: orderDetails
      });

    } catch (error) {
      logger.error('Get order details error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve order details',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Update order
   */
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      const order = await Order.findOne({ id });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: ERROR_MESSAGES.ORDER_NOT_FOUND
        });
      }

      // Check if user owns this order
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'UNAUTHORIZED_ACCESS'
        });
      }

      // Only allow updates for certain statuses
      if (!['pending', 'accepted'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be updated at this stage',
          error: 'ORDER_NOT_UPDATABLE'
        });
      }

      // Validate allowed updates
      const allowedUpdates = ['delivery_address', 'delivery_notes'];
      const updateFields = {};

      for (const field of allowedUpdates) {
        if (updates[field] !== undefined) {
          updateFields[field] = updates[field];
        }
      }

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid updates provided',
          error: 'NO_UPDATES_PROVIDED'
        });
      }

      // Update order
      await Order.findOneAndUpdate(
        { id },
        { ...updateFields, updated_at: new Date() }
      );

      const updatedOrder = await this._getOrderDetailsHelper(id);

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: updatedOrder
      });

    } catch (error) {
      logger.error('Update order error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({ id });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: ERROR_MESSAGES.ORDER_NOT_FOUND
        });
      }

      // Check if user owns this order
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'UNAUTHORIZED_ACCESS'
        });
      }

      // Only allow cancellation for certain statuses
      if (!['pending', 'accepted'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled at this stage',
          error: 'ORDER_NOT_CANCELLABLE'
        });
      }

      // Update order status
      await Order.findOneAndUpdate(
        { id },
        {
          status: 'cancelled',
          updated_at: new Date()
        }
      );

      // Process refund if payment was made
      if (order.payment_status === 'paid') {
        // Create refund transaction
        await prisma.transaction.create({
          data: {
            user_id: userId,
            transaction_type: 'refund',
            reference_type: 'order',
            reference_id: order.id,
            order_id: order.id,
            amount: -order.final_amount,
            payment_method: order.payment_method,
            status: 'completed',
            description: `Refund for cancelled order ${order.order_number}`
          }
        });

        // Send refund notification
        try {
          await notificationService.sendNotification(
            req.user.email,
            'Order Refund Processed',
            `Your refund of ${order.final_amount} EGP for order ${order.order_number} has been processed`,
            { orderId: order.id, type: 'refund' }
          );
        } catch (notificationError) {
          logger.error('Failed to send refund notification', {
            orderId: order.id,
            error: notificationError.message
          });
        }
      }

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      logger.error('Cancel order error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 10,
        status,
        order_type
      } = req.query;

      const query = { user_id: userId };

      if (status) {
        query.status = status;
      }

      if (order_type) {
        query.order_type = order_type;
      }

      const skip = (page - 1) * limit;

      const orders = await prisma.order.findMany({
        where: query,
        orderBy: { created_at: 'desc' },
        skip: skip,
        take: parseInt(limit)
      });

      const total = await Order.countDocuments(query);

      // Get order details for each order
      const ordersWithDetails = [];
      for (const order of orders) {
        const details = await this._getOrderDetailsHelper(order.id);
        ordersWithDetails.push(details);
      }

      res.json({
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders: ordersWithDetails,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get user orders error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Calculate cart total
   */
  async calculateCartTotal(req, res) {
    try {
      const { items, order_type, coupon_code } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart items are required',
          error: 'MISSING_CART_ITEMS'
        });
      }

      let subtotal = 0;
      let platformFee = 0;
      let deliveryFee = 0;
      let discountAmount = 0;
      const cartItems = [];

      for (const item of items) {
        const { product_id, quantity, add_ons } = item;

        if (!product_id || !quantity || quantity < 1) {
          return res.status(400).json({
            success: false,
            message: 'Invalid product or quantity',
            error: 'INVALID_PRODUCT_DATA'
          });
        }

        // Get product details
        const product = await prisma.product.findUnique({ where: { id: product_id } });
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${product_id}`,
            error: 'PRODUCT_NOT_FOUND'
          });
        }

        // Calculate item total
        let itemTotal = product.price * quantity;

        // Add add-ons pricing
        if (add_ons && Array.isArray(add_ons)) {
          for (const addOn of add_ons) {
            if (addOn.price) {
              itemTotal += addOn.price * quantity;
            }
          }
        }

        subtotal += itemTotal;

        cartItems.push({
          product_id,
          product_name: product.name,
          quantity,
          price: product.price,
          add_ons: add_ons || [],
          total_price: itemTotal
        });
      }

      // Calculate fees
      platformFee = subtotal * 0.05; // 5% platform fee
      deliveryFee = order_type === 'delivery' ? 15 : 0;

      // Apply coupon discount if provided
      if (coupon_code) {
        // Implement coupon validation logic here
        // For now, skip coupon processing
      }

      const total = subtotal + platformFee + deliveryFee - discountAmount;

      res.json({
        success: true,
        message: 'Cart total calculated successfully',
        data: {
          items: cartItems,
          breakdown: {
            subtotal,
            platform_fee: platformFee,
            delivery_fee: deliveryFee,
            discount: discountAmount,
            total
          },
          currency: 'EGP'
        }
      });

    } catch (error) {
      logger.error('Calculate cart total error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to calculate cart total',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Track order location
   */
  async trackOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({ id });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          error: ERROR_MESSAGES.ORDER_NOT_FOUND
        });
      }

      // Check if user owns this order
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'UNAUTHORIZED_ACCESS'
        });
      }

      // Only track delivery orders
      if (order.order_type !== 'delivery') {
        return res.status(400).json({
          success: false,
          message: 'Tracking is only available for delivery orders',
          error: 'TRACKING_NOT_AVAILABLE'
        });
      }

      // Get driver location if order is in delivery
      let driverLocation = null;
      if (order.status === 'in_delivery' && order.driver_id) {
        const driver = await prisma.driver.findUnique({ where: { id: order.driver_id } });
        if (driver && driver.current_location) {
          driverLocation = driver.current_location;
        }
      }

      // Calculate estimated delivery time
      let estimatedTime = null;
      if (driverLocation && order.delivery_address) {
        try {
          estimatedTime = await mapsService.calculateDeliveryTime(
            driverLocation,
            order.delivery_address
          );
        } catch (error) {
          logger.error('Failed to calculate delivery time', { error: error.message });
        }
      }

      res.json({
        success: true,
        message: 'Order tracking information retrieved successfully',
        data: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          order_type: order.order_type,
          driver_location: driverLocation,
          estimated_delivery_time: estimatedTime,
          delivery_address: order.delivery_address
        }
      });

    } catch (error) {
      logger.error('Track order error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to track order',
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * Helper method to get complete order details
   */
  async _getOrderDetailsHelper(orderId) {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        logger.warn('Order not found in getOrderDetailsHelper', { orderId });
        return null;
      }

      // Get order items
      const items = await prisma.orderItem.findMany({
        where: { order_id: orderId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image_url: true,
              price: true
            }
          }
        },
        orderBy: { created_at: 'asc' }
      });

      // Get business info
      const businessId = items.length > 0 ? items[0].business_id : null;
      let business = null;
      if (businessId) {
        business = await prisma.business.findUnique({
          where: { id: businessId },
          select: {
            id: true,
            business_name: true,
            address: true,
            phone: true,
            // logo_url is not in schema, checking photos
            photos: true
          }
        });
      }

      // Get driver info if assigned
      let driver = null;
      if (order.driver_id) {
        driver = await prisma.driver.findUnique({
          where: { id: order.driver_id },
          select: {
            id: true,
            full_name: true,
            phone: true,
            current_latitude: true,
            current_longitude: true
          }
        });
      }

      return {
        id: order.id,
        order_number: order.order_number,
        user_id: order.user_id,
        driver_id: order.driver_id,
        order_type: order.order_type,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        status: order.status,
        delivery_address: order.delivery_address,
        total_amount: order.total_amount,
        discount_amount: order.discount_amount,
        platform_fee: order.platform_fee,
        delivery_fee: order.delivery_fee,
        final_amount: order.final_amount,
        qr_code: order.qr_code,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.unit_price,
          add_ons: item.preferences, // Mapping preferences to add_ons
          total_price: item.total_price,
          is_available: item.is_available,
          image_url: item.product?.image_url
        })),
        business,
        driver
      };
    } catch (error) {
      logger.error('Get order details helper error', {
        orderId,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }


  /**
   * Helper method to generate unique order number
   */
  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let counter = 1;
    let orderNumber;

    do {
      orderNumber = `ORD-${year}${month}${day}-${String(counter).padStart(4, '0')}`;
      const existingOrder = await prisma.order.findUnique({ where: { order_number: orderNumber } });
      if (!existingOrder) break;
      counter++;
    } while (counter < 10000);

    return orderNumber;
  }
}

const orderController = new OrderController();

// Bind all methods to preserve 'this' context when used as Express route handlers
const boundController = {};
for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(orderController))) {
  if (key !== 'constructor' && typeof orderController[key] === 'function') {
    boundController[key] = orderController[key].bind(orderController);
  }
}

module.exports = boundController;
