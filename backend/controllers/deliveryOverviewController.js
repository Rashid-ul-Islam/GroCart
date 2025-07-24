import pool from '../db.js';

// Get delivery overview statistics
export const getDeliveryStats = async (req, res) => {
  const client = await pool.connect();

  try {
    console.log('Fetching delivery overview statistics...');

    // Start transaction
    await client.query('BEGIN');

    // Get current date for today's calculations
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Step 1: Get latest status for each delivery
    console.log('Step 1: Fetching latest delivery statuses...');
    const latestStatusQuery = `
      SELECT DISTINCT ON (sh.entity_id) 
        sh.entity_id as delivery_id,
        sh.status,
        sh.updated_at
      FROM "StatusHistory" sh
      WHERE sh.entity_type = 'order'
      ORDER BY sh.entity_id, sh.updated_at DESC
    `;
    const latestStatusResult = await client.query(latestStatusQuery);
    console.log(`Found ${latestStatusResult.rows.length} delivery statuses`);

    // Step 2: Get basic delivery counts
    console.log('Step 2: Fetching basic delivery counts...');
    const deliveryCountsQuery = `
      SELECT 
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN d.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_deliveries
      FROM "Delivery" d
    `;
    const deliveryCountsResult = await client.query(deliveryCountsQuery);
    const deliveryCounts = deliveryCountsResult.rows[0];
    console.log('Basic delivery counts:', deliveryCounts);

    // Step 3: Get deliveries with their latest status
    console.log('Step 3: Fetching deliveries with status...');
    const deliveriesWithStatusQuery = `
      SELECT 
        d.delivery_id,
        d.actual_arrival,
        d.estimated_arrival,
        d.created_at,
        COALESCE(ls.status, 'pending') as current_status
      FROM "Delivery" d
      LEFT JOIN (
        SELECT DISTINCT ON (sh.entity_id) 
          sh.entity_id as order_id,
          sh.status
        FROM "StatusHistory" sh
        WHERE sh.entity_type = 'order'
        ORDER BY sh.entity_id, sh.updated_at DESC
      ) ls ON d.order_id = ls.order_id
      WHERE d.created_at >= NOW() - INTERVAL '30 days'
    `;
    const deliveriesWithStatusResult = await client.query(deliveriesWithStatusQuery);
    console.log(`Found ${deliveriesWithStatusResult.rows.length} recent deliveries with status`);

    // Step 4: Calculate delivery statistics from the fetched data
    console.log('Step 4: Calculating delivery statistics...');
    const deliveries = deliveriesWithStatusResult.rows;
    console.log(deliveries);
    const totalDeliveries = deliveries.length;
    const activeDeliveries = deliveries.filter(d =>
      d.current_status !== 'delivery_completed' &&
      d.current_status !== 'payment_received' &&
      d.current_status !== 'cancelled'
    ).length;


    const completedToday = deliveries.filter(d =>
      (d.current_status === 'delivery_completed' || d.current_status === 'payment_received' || d.current_status === 'cancelled') &&
      d.actual_arrival &&
      new Date(d.actual_arrival).toISOString().split('T')[0] === today
    ).length;


    const completedYesterday = deliveries.filter(d =>
      (d.current_status === 'delivery_completed' || d.current_status === 'payment_received' || d.current_status === 'cancelled') &&
      d.actual_arrival &&
      new Date(d.actual_arrival).toISOString().split('T')[0] === yesterday
    ).length;

    // Calculate active deliveries for yesterday (approximate based on created date)
    const activeDeliveriesYesterday = deliveries.filter(d =>
      new Date(d.created_at).toISOString().split('T')[0] === yesterday &&
      d.current_status !== 'delivery_completed' &&
      d.current_status !== 'payment_received' &&
      d.current_status !== 'cancelled'
    ).length;

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const activeDeliveriesChange = calculatePercentageChange(activeDeliveries, activeDeliveriesYesterday);
    const completedTodayChange = calculatePercentageChange(completedToday, completedYesterday);

    const pendingAssignments = deliveries.filter(d =>
      !d.current_status ||
      !['delivery_completed', 'payment_received'].includes(d.current_status)
    ).length;

    console.log('Calculated stats:', {
      totalDeliveries,
      activeDeliveries,
      completedToday,
      completedYesterday,
      activeDeliveriesYesterday,
      activeDeliveriesChange,
      completedTodayChange,
      pendingAssignments
    });

    // Step 5: Calculate on-time delivery rate
    console.log('Step 5: Calculating on-time delivery rate...');
    const completedDeliveries = deliveries.filter(d =>
      d.current_status === 'delivery_completed' &&
      d.actual_arrival &&
      d.estimated_arrival
    );

    const onTimeDeliveries = completedDeliveries.filter(d =>
      new Date(d.actual_arrival) <= new Date(d.estimated_arrival)
    ).length;

    const onTimeRate = completedDeliveries.length > 0
      ? Math.round((onTimeDeliveries / completedDeliveries.length) * 100 * 10) / 10
      : 0;

    console.log(`On-time rate: ${onTimeDeliveries}/${completedDeliveries.length} = ${onTimeRate}%`);

    // Step 6: Get delivery boy statistics
    console.log('Step 6: Fetching delivery boy statistics...');
    const deliveryBoyStatsQuery = `
      SELECT 
        COUNT(*) as total_delivery_boys,
        COUNT(CASE WHEN availability_status = 'available' THEN 1 END) as available_delivery_boys,
        COUNT(CASE WHEN availability_status = 'busy' THEN 1 END) as busy_delivery_boys
      FROM "DeliveryBoy"
    `;
    const deliveryBoyResult = await client.query(deliveryBoyStatsQuery);
    const deliveryBoyStats = deliveryBoyResult.rows[0];
    console.log('Delivery boy stats:', deliveryBoyStats);

    // Commit transaction
    await client.query('COMMIT');

    // Prepare final response
    const stats = {
      totalDeliveries: parseInt(totalDeliveries) || 0,
      activeDeliveries: parseInt(activeDeliveries) || 0,
      completedToday: parseInt(completedToday) || 0,
      onTimeRate: parseFloat(onTimeRate) || 0,
      availableDeliveryBoys: parseInt(deliveryBoyStats.available_delivery_boys) || 0,
      busyDeliveryBoys: parseInt(deliveryBoyStats.busy_delivery_boys) || 0,
      pendingAssignments: parseInt(pendingAssignments) || 0,
      // Yesterday's data for comparison
      completedYesterday: parseInt(completedYesterday) || 0,
      activeDeliveriesYesterday: parseInt(activeDeliveriesYesterday) || 0,
      // Percentage changes
      activeDeliveriesChange: activeDeliveriesChange,
      completedTodayChange: completedTodayChange
    };

    console.log('Final delivery overview stats:', stats);
    res.json(stats);

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error fetching delivery overview stats:', error);
    res.status(500).json({
      error: 'Failed to fetch delivery statistics',
      details: error.message
    });
  } finally {
    client.release();
  }
};

// Get recent orders with delivery information
export const getRecentOrders = async (req, res) => {
  const client = await pool.connect();

  try {
    console.log('Fetching recent orders...');

    // Start transaction
    await client.query('BEGIN');

    const { searchTerm, filterRegion, limit = 10 } = req.query;

    // Step 1: Get latest delivery status for all orders
    console.log('Step 1: Fetching latest delivery statuses...');
    const latestDeliveryStatusQuery = `
      SELECT DISTINCT ON (sh.entity_id) 
        sh.entity_id as delivery_id,
        sh.status,
        sh.updated_at as status_updated_at
      FROM "StatusHistory" sh
      WHERE sh.entity_type = 'order'
      ORDER BY sh.entity_id, sh.updated_at DESC
    `;
    const latestDeliveryStatusResult = await client.query(latestDeliveryStatusQuery);
    console.log(`Found ${latestDeliveryStatusResult.rows.length} delivery statuses`);

    // Step 2: Get latest order status for all orders
    console.log('Step 2: Fetching latest order statuses...');
    const latestOrderStatusQuery = `
      SELECT DISTINCT ON (sh.entity_id) 
        sh.entity_id as order_id,
        sh.status as order_status,
        sh.updated_at as order_status_updated_at
      FROM "StatusHistory" sh
      WHERE sh.entity_type = 'order'
      ORDER BY sh.entity_id, sh.updated_at DESC
    `;
    const latestOrderStatusResult = await client.query(latestOrderStatusQuery);
    console.log(`Found ${latestOrderStatusResult.rows.length} order statuses`);

    // Step 3: Build base query for deliveries
    console.log('Step 3: Building delivery query with filters...');
    let whereConditions = ['d.created_at >= NOW() - INTERVAL \'7 days\''];
    let queryParams = [];
    let paramIndex = 1;

    // Add search term filter
    if (searchTerm && searchTerm.trim()) {
      whereConditions.push(`(
        d.order_id::TEXT ILIKE $${paramIndex} OR 
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) ILIKE $${paramIndex} OR 
        COALESCE(a.address, '') ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${searchTerm.trim()}%`);
      paramIndex++;
    }

    // Note: Region filter will be applied in Step 6 after we fetch address data
    let regionFilter = null;
    if (filterRegion && filterRegion.trim() && filterRegion !== 'all') {
      regionFilter = filterRegion.trim();
    }

    // Add limit parameter
    queryParams.push(parseInt(limit));

    // Step 4: Get basic delivery information
    console.log('Step 4: Fetching basic delivery information...');
    const baseDeliveryQuery = `
      SELECT 
        d.delivery_id,
        d.order_id,
        o.user_id,
        d.address_id,
        d.delivery_boy_id,
        d.estimated_arrival,
        d.created_at,
        o.total_amount
      FROM "Delivery" d
      LEFT JOIN "Order" o ON d.order_id = o.order_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex}
    `;

    const baseDeliveryResult = await client.query(baseDeliveryQuery, queryParams);
    const baseDeliveries = baseDeliveryResult.rows;
    console.log(`Found ${baseDeliveries.length} base deliveries`);

    if (baseDeliveries.length === 0) {
      await client.query('COMMIT');
      return res.json([]);
    }

    // Step 5: Get user information for customers
    console.log('Step 5: Fetching customer information...');
    const userIds = [...new Set(baseDeliveries.map(d => d.user_id).filter(Boolean))];
    let customers = {};

    if (userIds.length > 0) {
      const customerQuery = `
        SELECT 
          user_id,
          TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) as full_name
        FROM "User"
        WHERE user_id = ANY($1)
      `;
      const customerResult = await client.query(customerQuery, [userIds]);
      customerResult.rows.forEach(row => {
        customers[row.user_id] = row.full_name || 'Unknown Customer';
      });
    }
    console.log(`Fetched ${Object.keys(customers).length} customer records`);

    // Step 6: Get address information
    console.log('Step 6: Fetching address information...');
    const addressIds = [...new Set(baseDeliveries.map(d => d.address_id).filter(Boolean))];
    let addresses = {};

    if (addressIds.length > 0) {
      const addressQuery = `
        SELECT 
          a.address_id,
          COALESCE(a.address, 'Address not provided') as address,
          r.delivery_region_id,
          COALESCE(dr.name, 'Unknown Region') as region_name
        FROM "Address" a
        LEFT JOIN "Region" r ON a.region_id = r.region_id
        LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
        WHERE a.address_id = ANY($1)
      `;
      const addressResult = await client.query(addressQuery, [addressIds]);
      addressResult.rows.forEach(row => {
        addresses[row.address_id] = {
          address: row.address,
          regionName: row.region_name
        };
      });
    }
    console.log(`Fetched ${Object.keys(addresses).length} address records`);

    // Step 7: Get delivery boy information
    console.log('Step 7: Fetching delivery boy information...');
    const deliveryBoyIds = [...new Set(baseDeliveries.map(d => d.delivery_boy_id).filter(Boolean))];
    let deliveryBoys = {};

    if (deliveryBoyIds.length > 0) {
      const deliveryBoyQuery = `
        SELECT 
          u.user_id,
          TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as full_name
        FROM "DeliveryBoy" db
        LEFT JOIN "User" u ON db.user_id = u.user_id
        WHERE db.user_id = ANY($1)
      `;
      const deliveryBoyResult = await client.query(deliveryBoyQuery, [deliveryBoyIds]);
      deliveryBoyResult.rows.forEach(row => {
        deliveryBoys[row.user_id] = row.full_name || 'Not assigned';
      });
    }
    console.log(`Fetched ${Object.keys(deliveryBoys).length} delivery boy records`);

    // Step 8: Get status information
    console.log('Step 8: Mapping status information...');
    const deliveryStatuses = {};
    latestDeliveryStatusResult.rows.forEach(row => {
      deliveryStatuses[row.delivery_id] = row.status;
    });

    const orderStatuses = {};
    latestOrderStatusResult.rows.forEach(row => {
      orderStatuses[row.order_id] = row.order_status;
    });

    // Step 9: Combine all data and format response
    console.log('Step 9: Combining data and formatting response...');
    const orders = baseDeliveries
      .map(delivery => {
        const status = deliveryStatuses[delivery.delivery_id] ||
          orderStatuses[delivery.order_id] ||
          'pending';

        // Filter out completed and cancelled orders
        if (['delivery_completed', 'cancelled'].includes(status)) {
          return null;
        }

        const customerName = customers[delivery.user_id] || 'Unknown Customer';
        const addressInfo = addresses[delivery.address_id] || {
          address: 'Address not provided',
          regionName: 'Unknown Region'
        };
        const deliveryBoyName = deliveryBoys[delivery.delivery_boy_id] || 'Not assigned';

        // Apply region filter if specified
        if (regionFilter && !addressInfo.regionName.toLowerCase().includes(regionFilter.toLowerCase())) {
          return null;
        }

        // Calculate priority based on total amount
        let priority = 'low';
        if (delivery.total_amount > 1000) priority = 'high';
        else if (delivery.total_amount > 500) priority = 'normal';

        // Format estimated time
        let estimatedTime = 'Time not set';
        if (delivery.estimated_arrival) {
          const now = new Date();
          const estimatedArrival = new Date(delivery.estimated_arrival);
          const hoursDiff = (estimatedArrival - now) / (1000 * 60 * 60);

          if (hoursDiff < 0) {
            estimatedTime = `${Math.abs(Math.round(hoursDiff))}h overdue`;
          } else if (Math.round(hoursDiff) === 0) {
            estimatedTime = 'Due now';
          } else {
            estimatedTime = `${Math.round(hoursDiff)}h remaining`;
          }
        }

        return {
          orderId: delivery.order_id,
          deliveryId: delivery.delivery_id,
          customerName: customerName,
          address: addressInfo.address,
          status: status,
          priority: priority,
          regionName: addressInfo.regionName,
          deliveryBoyName: deliveryBoyName,
          expectedDeliveryTime: delivery.estimated_arrival,
          createdAt: delivery.created_at,
          estimatedTime: estimatedTime,
          totalAmount: delivery.total_amount
        };
      })
      .filter(order => order !== null) // Remove null entries (completed/cancelled orders and filtered regions)
      .sort((a, b) => {
        // Sort by creation date (newest first), then by priority, then by status
        const dateCompare = new Date(b.createdAt) - new Date(a.createdAt);
        if (dateCompare !== 0) return dateCompare;

        const priorityOrder = { high: 1, normal: 2, low: 3 };
        const priorityCompare = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityCompare !== 0) return priorityCompare;

        const statusOrder = { pending: 1, in_transit: 2 };
        return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
      })
      .slice(0, parseInt(limit)); // Apply limit after filtering and sorting

    // Commit transaction
    await client.query('COMMIT');

    console.log(`Recent orders processed successfully: ${orders.length} orders`);
    res.json(orders);

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      error: 'Failed to fetch recent orders',
      details: error.message
    });
  } finally {
    client.release();
  }
};