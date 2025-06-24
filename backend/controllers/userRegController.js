import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      divisionId,
      districtId,
      cityId,
      regionId,
      address,
    } = req.body;

    
    if (!username || !email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        error: 'Username, email, password, first name, last name, and phone number are required'
      });
    }

    const existingUser = await client.query(
      'SELECT user_id FROM "User" WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userResult = await client.query(
      `INSERT INTO "User" (username, email, password_hash, first_name, last_name, phone_number, role_id, created_at, total_points)
       VALUES ($1, $2, $3, $4, $5, $6, 'customer', NOW(), 0) 
       RETURNING user_id, username, email, first_name, last_name, phone_number, role_id, created_at`,
      [username, email, passwordHash, firstName, lastName, phoneNumber]
    );

    const newUser = userResult.rows[0];

    if (regionId && address) {
      await client.query(
        `INSERT INTO "Address" (user_id, region_id, address, "isPrimary", created_at)
         VALUES ($1, $2, $3, true, NOW())`,
        [newUser.user_id, regionId, address]
      );
    }

    await client.query('COMMIT');

    const token = jwt.sign(
      {
        userId: newUser.user_id,
        username: newUser.username,
        role: newUser.role_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone_number: newUser.phone_number,
        role_id: newUser.role_id,
        created_at: newUser.created_at
      },
      token
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering user:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const userResult = await pool.query(
      'SELECT user_id, username, email, password_hash, first_name, last_name, phone_number, role_id FROM "User" WHERE username = $1 OR email = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      'UPDATE "User" SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );

    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        role: user.role_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role_id: user.role_id
      },
      token
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query(
      'SELECT user_id FROM "User" WHERE username = $1',
      [username]
    );

    res.json({ available: result.rows.length === 0 });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      'SELECT user_id FROM "User" WHERE email = $1',
      [email]
    );

    res.json({ available: result.rows.length === 0 });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT a.address_id, a.region_id, a.address, a."isPrimary", a.created_at, a.updated_at
       FROM "Address" a
       WHERE a.user_id = $1
       ORDER BY a."isPrimary" DESC, a.created_at DESC`,
      [userId]
    );

    res.json({ addresses: result.rows });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addUserAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { userId, regionId, address, isPrimary } = req.body;

    if (!userId || !regionId || !address) {
      return res.status(400).json({ error: 'User ID, region ID, and address are required' });
    }

    
    if (isPrimary) {
      await client.query(
        'UPDATE "Address" SET "isPrimary" = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await client.query(
      `INSERT INTO "Address" (user_id, region_id, address, "isPrimary", created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING address_id, user_id, region_id, address, "isPrimary", created_at`,
      [userId, regionId, address, isPrimary || false]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Address added successfully',
      address: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
