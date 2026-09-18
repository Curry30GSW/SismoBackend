const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// =============================================
// IMPORTS DE RUTAS 
// =============================================
const eventosRoutes = require('./routes/eventosRoutes');
const personasRoutes = require('./routes/personasRoutes');
const authRoutes = require('./routes/authRoutes');


dotenv.config({
    path: `.env.${process.env.NODE_ENV || 'development'}`
});

const PORT = process.env.PORT || 5019;

app.use(cookieParser());


// Cors Configuration
app.use(cors({
    origin: [
        "http://srv-bog-tes.coopserp.com/",
        "http://190.66.10.148:10704", "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));


app.use(express.json());


// =============================================
// RUTAS 
// =============================================
app.use('/api/eventos', eventosRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    Servidor iniciado correctamente
    Modo: ${process.env.NODE_ENV || 'development'} 
    Puerto: ${PORT}
    `);
});

