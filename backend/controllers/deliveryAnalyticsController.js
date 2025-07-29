import pool from "../db.js";

// Debug function to check data quality and identify issues
export const debugOnTimeDeliveries = async (req, res) => {
    const client = await pool.connect();
    try {
        const { timeRange = '7d' } = req.query;

        let dateCondition = '';
        switch (timeRange) {
            case '7d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case '30d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'";
                break;
            case '90d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '90 days'";
                break;
            case '1y':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '1 year'";
                break;
        }

        const debugQuery = `
            SELECT 
                -- Basic counts for debugging
                COUNT(*) as total_deliveries,
                COUNT(CASE WHEN d.actual_arrival IS NOT NULL THEN 1 END) as has_actual_arrival,
                COUNT(CASE WHEN d.estimated_arrival IS NOT NULL THEN 1 END) as has_estimated_arrival,
                COUNT(CASE WHEN d.is_aborted = true THEN 1 END) as aborted_deliveries,
                COUNT(CASE WHEN d.is_aborted = false OR d.is_aborted IS NULL THEN 1 END) as not_aborted,
                
                -- Different variations of on-time calculations for comparison
                COUNT(CASE WHEN d.actual_arrival IS NOT NULL AND d.estimated_arrival IS NOT NULL THEN 1 END) as both_times_present,
                COUNT(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 END) as basic_on_time,
                COUNT(CASE WHEN d.actual_arrival IS NOT NULL AND d.actual_arrival <= d.estimated_arrival THEN 1 END) as on_time_with_null_check,
                COUNT(CASE WHEN d.actual_arrival IS NOT NULL AND d.is_aborted = false AND d.actual_arrival <= d.estimated_arrival THEN 1 END) as on_time_complete_check,
                COUNT(CASE WHEN d.actual_arrival IS NOT NULL AND (d.is_aborted = false OR d.is_aborted IS NULL) AND d.actual_arrival <= d.estimated_arrival THEN 1 END) as on_time_with_null_abort_check,
                
                -- Check for data type issues
                COUNT(CASE WHEN d.actual_arrival::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN 1 END) as valid_actual_format,
                COUNT(CASE WHEN d.estimated_arrival::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN 1 END) as valid_estimated_format,
                
                -- Sample data for inspection
                MIN(d.actual_arrival) as earliest_actual,
                MAX(d.actual_arrival) as latest_actual,
                MIN(d.estimated_arrival) as earliest_estimated,
                MAX(d.estimated_arrival) as latest_estimated
                
            FROM "Delivery" d
            WHERE 1=1 ${dateCondition};
        `;

        const debugResult = await client.query(debugQuery);
        
        // Also get a few sample records for manual inspection
        const sampleQuery = `
            SELECT 
                d.delivery_id,
                d.actual_arrival,
                d.estimated_arrival,
                d.is_aborted,
                d.created_at,
                CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 'ON_TIME' ELSE 'LATE' END as time_status,
                (d.actual_arrival <= d.estimated_arrival) as is_on_time_bool
            FROM "Delivery" d
            WHERE d.actual_arrival IS NOT NULL 
            AND d.estimated_arrival IS NOT NULL
            ${dateCondition}
            ORDER BY d.created_at DESC
            LIMIT 10;
        `;

        const sampleResult = await client.query(sampleQuery);

        res.status(200).json({
            success: true,
            debug_data: {
                summary: debugResult.rows[0],
                sample_records: sampleResult.rows,
                analysis: {
                    has_data: parseInt(debugResult.rows[0].total_deliveries) > 0,
                    has_completed_deliveries: parseInt(debugResult.rows[0].has_actual_arrival) > 0,
                    potential_issues: {
                        missing_actual_arrival: parseInt(debugResult.rows[0].total_deliveries) - parseInt(debugResult.rows[0].has_actual_arrival),
                        missing_estimated_arrival: parseInt(debugResult.rows[0].total_deliveries) - parseInt(debugResult.rows[0].has_estimated_arrival),
                        all_aborted: parseInt(debugResult.rows[0].aborted_deliveries) === parseInt(debugResult.rows[0].total_deliveries)
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error in debug function:', error);
        res.status(500).json({
            success: false,
            message: 'Error in debug function',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get delivery analytics overview metrics (FIXED VERSION)
export const getDeliveryMetrics = async (req, res) => {
    const client = await pool.connect();
    try {
        const { timeRange = '7d' } = req.query;

        // Calculate date range
        let dateCondition = '';
        switch (timeRange) {
            case '7d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case '30d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'";
                break;
            case '90d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '90 days'";
                break;
            case '1y':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '1 year'";
                break;
            default:
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'";
        }

        // COMPREHENSIVE FIX: Handle all possible data scenarios
        const deliveryMetricsQuery = `
            WITH delivery_stats AS (
                SELECT 
                    COUNT(*) as total_deliveries,
                    -- Completed deliveries: has actual_arrival and not aborted
                    COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        THEN 1 
                    END) as completed_deliveries,
                    -- Failed deliveries: explicitly aborted
                    COUNT(CASE WHEN d.is_aborted = true THEN 1 END) as failed_deliveries,
                    -- On-time deliveries: completed AND arrived on/before estimated time
                    COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        AND d.actual_arrival <= d.estimated_arrival 
                        THEN 1 
                    END) as on_time_deliveries,
                    -- Deliveries with both timestamps (for rate calculation denominator)
                    COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        THEN 1 
                    END) as deliveries_with_both_times
                FROM "Delivery" d
                WHERE 1=1 ${dateCondition}
            ),
            rating_stats AS (
                SELECT 
                    AVG(dr.rating)::DECIMAL(3,1) as avg_customer_rating,
                    COUNT(dr.rating) as total_ratings
                FROM "DeliveryReview" dr
                JOIN "Delivery" d ON d.delivery_id = dr.delivery_id
                WHERE 1=1 ${dateCondition}
            ),
            previous_period_stats AS (
                SELECT 
                    COUNT(*) as prev_total_deliveries,
                    COUNT(CASE WHEN d.is_aborted = true THEN 1 END) as prev_failed_deliveries,
                    COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        AND d.actual_arrival <= d.estimated_arrival 
                        THEN 1 
                    END) as prev_on_time_deliveries,
                    COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        THEN 1 
                    END) as prev_deliveries_with_both_times
                FROM "Delivery" d
                WHERE d.created_at >= CURRENT_DATE - INTERVAL '14 days' 
                AND d.created_at < CURRENT_DATE - INTERVAL '7 days'
            )
            SELECT 
                ds.total_deliveries,
                ds.completed_deliveries,
                ds.failed_deliveries,
                ds.on_time_deliveries,
                ds.deliveries_with_both_times,
                -- Use deliveries_with_both_times as denominator for more accurate rate
                CASE 
                    WHEN ds.deliveries_with_both_times > 0 
                    THEN ROUND((ds.on_time_deliveries::DECIMAL / ds.deliveries_with_both_times) * 100, 1)
                    ELSE 0 
                END as on_time_rate,
                rs.avg_customer_rating,
                rs.total_ratings,
                pps.prev_total_deliveries,
                pps.prev_failed_deliveries,
                pps.prev_on_time_deliveries,
                pps.prev_deliveries_with_both_times
            FROM delivery_stats ds
            CROSS JOIN rating_stats rs
            CROSS JOIN previous_period_stats pps;
        `;

        const result = await client.query(deliveryMetricsQuery);
        const metrics = result.rows[0];

        // Calculate percentage changes
        const totalDeliveriesChange = metrics.prev_total_deliveries > 0
            ? ((metrics.total_deliveries - metrics.prev_total_deliveries) / metrics.prev_total_deliveries * 100).toFixed(1)
            : 0;

        const failedDeliveriesChange = metrics.prev_failed_deliveries > 0
            ? ((metrics.failed_deliveries - metrics.prev_failed_deliveries) / metrics.prev_failed_deliveries * 100).toFixed(1)
            : metrics.failed_deliveries === 0 ? -100 : 0;

        // Fixed on-time rate change calculation
        const prevOnTimeRate = metrics.prev_deliveries_with_both_times > 0 
            ? (metrics.prev_on_time_deliveries / metrics.prev_deliveries_with_both_times * 100)
            : 0;
        const onTimeRateChange = prevOnTimeRate > 0
            ? (metrics.on_time_rate - prevOnTimeRate).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                totalDeliveries: parseInt(metrics.total_deliveries),
                completedDeliveries: parseInt(metrics.completed_deliveries),
                failedDeliveries: parseInt(metrics.failed_deliveries),
                onTimeDeliveries: parseInt(metrics.on_time_deliveries), // Added for debugging
                deliveriesWithBothTimes: parseInt(metrics.deliveries_with_both_times), // Added for debugging
                onTimeRate: parseFloat(metrics.on_time_rate),
                customerRating: parseFloat(metrics.avg_customer_rating) || 0,
                totalRatings: parseInt(metrics.total_ratings),
                changes: {
                    totalDeliveries: parseFloat(totalDeliveriesChange),
                    failedDeliveries: parseFloat(failedDeliveriesChange),
                    onTimeRate: parseFloat(onTimeRateChange)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching delivery metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery metrics',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get daily delivery trends (FIXED VERSION)
export const getDailyDeliveryTrends = async (req, res) => {
    const client = await pool.connect();
    try {
        const { timeRange = '7d' } = req.query;

        let days = 7;
        switch (timeRange) {
            case '7d': days = 7; break;
            case '30d': days = 30; break;
            case '90d': days = 90; break;
            case '1y': days = 365; break;
        }

        const dailyTrendsQuery = `
            WITH date_series AS (
                SELECT 
                    generate_series(
                        CURRENT_DATE - INTERVAL '${days - 1} days',
                        CURRENT_DATE,
                        INTERVAL '1 day'
                    )::date as date
            ),
            daily_deliveries AS (
                SELECT
                    DATE(d.created_at) as delivery_date,
                    COUNT(*) as total_deliveries,
                    COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND (d.is_aborted = false OR d.is_aborted IS NULL) 
                        THEN 1 
                    END) as delivered,
                    COUNT(CASE WHEN d.is_aborted = true THEN 1 END) as failed,
                    -- Fixed on-time calculation with proper null handling
                    COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        AND d.actual_arrival <= d.estimated_arrival 
                        THEN 1 
                    END) as on_time
                FROM "Delivery" d
                WHERE DATE(d.created_at) >= CURRENT_DATE - INTERVAL '${days - 1} days'
                GROUP BY DATE(d.created_at)
            )
            SELECT
                ds.date,
                TO_CHAR(ds.date, 'Dy') as day_name,
                COALESCE(dd.total_deliveries, 0) as total_deliveries,
                COALESCE(dd.delivered, 0) as delivered,
                COALESCE(dd.failed, 0) as failed,
                COALESCE(dd.on_time, 0) as on_time
            FROM date_series ds
            LEFT JOIN daily_deliveries dd ON ds.date = dd.delivery_date
            ORDER BY ds.date;
        `;

        const result = await client.query(dailyTrendsQuery);

        const trends = result.rows.map(row => ({
            date: row.day_name,
            fullDate: row.date,
            delivered: parseInt(row.delivered),
            failed: parseInt(row.failed),
            onTime: parseInt(row.on_time),
            total: parseInt(row.total_deliveries)
        }));

        res.status(200).json({
            success: true,
            data: trends
        });

    } catch (error) {
        console.error('Error fetching daily delivery trends:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily delivery trends',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get delivery distribution by regions (unchanged)
export const getRegionalDistribution = async (req, res) => {
    const client = await pool.connect();
    try {
        const { timeRange = '7d' } = req.query;

        let dateCondition = '';
        switch (timeRange) {
            case '7d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case '30d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'";
                break;
            case '90d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '90 days'";
                break;
            case '1y':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '1 year'";
                break;
        }

        const regionalQuery = `
            WITH total_deliveries AS (
                SELECT COUNT(*) as total_count
                FROM "Delivery" d
                WHERE d.actual_arrival IS NOT NULL 
                AND (d.is_aborted = false OR d.is_aborted IS NULL)
                ${dateCondition}
            ),
            regional_data AS (
                SELECT 
                    dr.name as region_name,
                    COUNT(d.delivery_id) as delivery_count,
                    COUNT(d.delivery_id) as completed_deliveries
                FROM "Delivery" d
                JOIN "Address" a ON a.address_id = d.address_id
                JOIN "Region" r ON r.region_id = a.region_id
                JOIN "DeliveryRegion" dr ON dr.delivery_region_id = r.delivery_region_id
                WHERE d.actual_arrival IS NOT NULL 
                AND (d.is_aborted = false OR d.is_aborted IS NULL)
                ${dateCondition}
                GROUP BY dr.name, dr.delivery_region_id
                ORDER BY delivery_count DESC
            )
            SELECT 
                rd.region_name as name,
                rd.delivery_count as count,
                rd.completed_deliveries,
                ROUND((rd.delivery_count::DECIMAL / NULLIF(td.total_count, 0)) * 100, 1) as percentage
            FROM regional_data rd
            CROSS JOIN total_deliveries td;
        `;

        const result = await client.query(regionalQuery);

        // Color palette for regions
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

        const regions = result.rows.map((row, index) => ({
            name: row.name,
            value: parseFloat(row.percentage) || 0,
            count: parseInt(row.count),
            completed_deliveries: parseInt(row.completed_deliveries),
            region_name: row.name,
            delivery_count: parseInt(row.count),
            color: colors[index % colors.length]
        }));

        res.status(200).json({
            success: true,
            data: regions
        });

    } catch (error) {
        console.error('Error fetching regional distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching regional distribution',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get performance trends over time (FIXED VERSION)
export const getPerformanceTrends = async (req, res) => {
    const client = await pool.connect();
    try {
        const { timeRange = '6months' } = req.query;

        let dateInterval = '';
        let dateFormat = '';
        let groupBy = '';

        switch (timeRange) {
            case '7d':
                dateInterval = "INTERVAL '7 days'";
                dateFormat = 'Dy';
                groupBy = 'DATE(d.created_at)';
                break;
            case '30d':
                dateInterval = "INTERVAL '30 days'";
                dateFormat = 'DD';
                groupBy = 'DATE(d.created_at)';
                break;
            case '6months':
            default:
                dateInterval = "INTERVAL '6 months'";
                dateFormat = 'Mon';
                groupBy = 'DATE_TRUNC(\'month\', d.created_at)';
        }

        const performanceQuery = `
            SELECT
                ${groupBy} as period_date,
                TO_CHAR(${groupBy}, '${dateFormat}') as period_name,
                COUNT(d.delivery_id) as total_deliveries,
                COUNT(CASE 
                    WHEN d.actual_arrival IS NOT NULL 
                    AND (d.is_aborted = false OR d.is_aborted IS NULL) 
                    THEN 1 
                END) as completed_deliveries,
                -- Fixed on-time calculation with proper null handling
                COUNT(CASE 
                    WHEN d.actual_arrival IS NOT NULL 
                    AND d.estimated_arrival IS NOT NULL
                    AND (d.is_aborted = false OR d.is_aborted IS NULL)
                    AND d.actual_arrival <= d.estimated_arrival 
                    THEN 1 
                END) as on_time_deliveries,
                COUNT(CASE 
                    WHEN d.actual_arrival IS NOT NULL 
                    AND d.estimated_arrival IS NOT NULL
                    AND (d.is_aborted = false OR d.is_aborted IS NULL)
                    THEN 1 
                END) as deliveries_with_both_times,
                AVG(dp.customer_rating)::DECIMAL(3,1) as avg_customer_rating
            FROM "Delivery" d
            LEFT JOIN "DeliveryPerformance" dp ON dp.delivery_id = d.delivery_id
            WHERE d.created_at >= CURRENT_DATE - ${dateInterval}
            GROUP BY ${groupBy}
            ORDER BY period_date;
        `;

        const result = await client.query(performanceQuery);

        const trends = result.rows.map(row => ({
            month: row.period_name,
            date: row.period_date,
            deliveries: parseInt(row.total_deliveries),
            onTimeRate: parseInt(row.deliveries_with_both_times) > 0
                ? parseFloat(((parseInt(row.on_time_deliveries) / parseInt(row.deliveries_with_both_times)) * 100).toFixed(1))
                : 0,
            customerSatisfaction: parseFloat(row.avg_customer_rating) || 0
        }));

        res.status(200).json({
            success: true,
            data: trends
        });

    } catch (error) {
        console.error('Error fetching performance trends:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching performance trends',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get top performing delivery boys (FIXED VERSION)
export const getTopPerformers = async (req, res) => {
    const client = await pool.connect();
    try {
        const { timeRange = '30d', limit = 5, sortBy = 'deliveries' } = req.query;

        let dateCondition = '';
        switch (timeRange) {
            case '7d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case '30d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'";
                break;
            case '90d':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '90 days'";
                break;
            case '1y':
                dateCondition = "AND d.created_at >= CURRENT_DATE - INTERVAL '1 year'";
                break;
        }

        // Build ORDER BY clause based on sortBy parameter
        let orderByClause = '';
        switch (sortBy) {
            case 'rating':
                orderByClause = `
                    ORDER BY 
                    AVG(dp.customer_rating) DESC NULLS LAST,
                    COUNT(d.delivery_id) DESC,
                    CASE 
                        WHEN COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            THEN 1 
                        END) > 0
                        THEN COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            AND d.actual_arrival <= d.estimated_arrival 
                            THEN 1 
                        END)::DECIMAL / COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            THEN 1 
                        END)
                        ELSE 0
                    END DESC
                `;
                break;
            case 'onTime':
                orderByClause = `
                    ORDER BY 
                    CASE 
                        WHEN COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            THEN 1 
                        END) > 0
                        THEN COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            AND d.actual_arrival <= d.estimated_arrival 
                            THEN 1 
                        END)::DECIMAL / COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            THEN 1 
                        END)
                        ELSE 0
                    END DESC,
                    COUNT(d.delivery_id) DESC,
                    AVG(dp.customer_rating) DESC NULLS LAST
                `;
                break;
            case 'deliveries':
            default:
                orderByClause = `
                    ORDER BY 
                    COUNT(d.delivery_id) DESC,
                    AVG(dp.customer_rating) DESC NULLS LAST,
                    CASE 
                        WHEN COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            THEN 1 
                        END) > 0
                        THEN COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            AND d.actual_arrival <= d.estimated_arrival 
                            THEN 1 
                        END)::DECIMAL / COUNT(CASE 
                            WHEN d.actual_arrival IS NOT NULL 
                            AND d.estimated_arrival IS NOT NULL
                            AND (d.is_aborted = false OR d.is_aborted IS NULL)
                            THEN 1 
                        END)
                        ELSE 0
                    END DESC
                `;
                break;
        }

        const topPerformersQuery = `
            SELECT 
                u.first_name || ' ' || u.last_name as name,
                u.user_id,
                COUNT(d.delivery_id) as total_deliveries,
                COUNT(CASE 
                    WHEN d.actual_arrival IS NOT NULL 
                    AND (d.is_aborted = false OR d.is_aborted IS NULL) 
                    THEN 1 
                END) as completed_deliveries,
                -- Fixed on-time calculation with proper null handling
                COUNT(CASE 
                    WHEN d.actual_arrival IS NOT NULL 
                    AND d.estimated_arrival IS NOT NULL
                    AND (d.is_aborted = false OR d.is_aborted IS NULL)
                    AND d.actual_arrival <= d.estimated_arrival 
                    THEN 1 
                END) as on_time_deliveries,
                COUNT(CASE 
                    WHEN d.actual_arrival IS NOT NULL 
                    AND d.estimated_arrival IS NOT NULL
                    AND (d.is_aborted = false OR d.is_aborted IS NULL)
                    THEN 1 
                END) as deliveries_with_both_times,
                AVG(dp.customer_rating)::DECIMAL(3,1) as avg_rating,
                -- Calculate on-time rate
                CASE 
                    WHEN COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        THEN 1 
                    END) > 0
                    THEN ROUND((COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        AND d.actual_arrival <= d.estimated_arrival 
                        THEN 1 
                    END)::DECIMAL / COUNT(CASE 
                        WHEN d.actual_arrival IS NOT NULL 
                        AND d.estimated_arrival IS NOT NULL
                        AND (d.is_aborted = false OR d.is_aborted IS NULL)
                        THEN 1 
                    END)) * 100, 1)
                    ELSE 0
                END as on_time_rate_percentage
            FROM "User" u
            JOIN "DeliveryBoy" db ON db.user_id = u.user_id
            JOIN "Delivery" d ON d.delivery_boy_id = db.user_id
            LEFT JOIN "DeliveryPerformance" dp ON dp.delivery_id = d.delivery_id AND dp.delivery_boy_id = db.user_id
            WHERE 1=1 ${dateCondition}
            GROUP BY u.user_id, u.first_name, u.last_name
            HAVING COUNT(d.delivery_id) > 0
            ${orderByClause}
            LIMIT $1;
        `;

        const result = await client.query(topPerformersQuery, [limit]);

        const performers = result.rows.map(row => ({
            name: row.name,
            userId: parseInt(row.user_id),
            deliveries: parseInt(row.total_deliveries),
            completedDeliveries: parseInt(row.completed_deliveries),
            onTimeRate: parseFloat(row.on_time_rate_percentage) || 0,
            rating: parseFloat(row.avg_rating) || 0,
            delivery_boy_id: parseInt(row.user_id),
            delivery_boy_name: row.name,
            total_deliveries: parseInt(row.total_deliveries),
            avg_rating: parseFloat(row.avg_rating) || 0,
            on_time_percentage: parseFloat(row.on_time_rate_percentage) || 0
        }));

        res.status(200).json({
            success: true,
            data: performers,
            sortBy,
            timeRange
        });

    } catch (error) {
        console.error('Error fetching top performers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top performers',
            error: error.message
        });
    } finally {
        client.release();
    }
};