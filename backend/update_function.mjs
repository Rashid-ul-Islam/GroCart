import pool from './db.js';
import fs from 'fs';

async function updateFunction() {
    try {
        const sqlContent = fs.readFileSync('./Triggers/calculate_shipping_and_delivery.sql', 'utf8');
        await pool.query(sqlContent);
        console.log('Function calculate_shipping_and_delivery updated successfully');
    } catch (error) {
        console.error('Error updating function:', error.message);
    } finally {
        process.exit(0);
    }
}

updateFunction();
