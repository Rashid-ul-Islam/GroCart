import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from './db.js'; // Import the Supabase client

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Test route
app.get("/test", (req, res) => {
    res.send("Welcome from the backend");
});

// Database connection test route
app.get("/db-test", async (req, res) => {
    try {
        // Simple query to test database connection
        const { data, error } = await supabase
            .from('users') // Replace 'users' with an actual table name
            .select('*')
            .limit(1);
        
        if (error) {
            throw error;
        }
        
        res.json({
            message: "Database connected successfully!",
            data: data
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

// Example API endpoint to fetch data
app.get("/users", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) {
            throw error;
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            message: "Error fetching users",
            error: error.message
        });
    }
});

// Example API endpoint to create a user
app.post("/users", async (req, res) => {
    try {
        const { name, email } = req.body;
        
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, email }])
            .select();
        
        if (error) {
            throw error;
        }
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            message: "Error creating user",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
