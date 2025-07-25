// Check JWT token details
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zanV4d3pycHd5bGp1bXplbnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTU0ODEsImV4cCI6MjA2NTgzMTQ4MX0.Zca2so7Yk7-t1RE5lIT5J2qIiqXH4TwPPO4PwBrTG5o";

// Decode JWT payload
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
console.log('JWT Payload:', JSON.stringify(payload, null, 2));
