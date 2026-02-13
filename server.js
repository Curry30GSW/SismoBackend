const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// =============================================
// IMPORTS DE RUTAS - NUEVA ESTRUCTURA
// =============================================
const anioLegalRoutes = require('./routes/anioLegalRoutes');
const cargoBaseRoutes = require('./routes/cargoBaseRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const categoriaDirectorRoutes = require('./routes/categoriaDirectorRoutes');
const posicionCargoRoutes = require('./routes/posicionCargoRoutes');
const movimientoCargoRoutes = require('./routes/movimientoCargoRoutes');
const historicoSalarioRoutes = require('./routes/historicoSalarioRoutes');


const cargoRoutes = require('./routes/CargoRoutes')
const directoresCategoriasRoutes = require('./routes/DirectoresRoutes')
const departamentoRoutes = require('./routes/DepartamentosRoutes')

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
// RUTAS - NUEVA ESTRUCTURA
// =============================================
// Todas las rutas nuevas van con /api
app.use('/api/anios', anioLegalRoutes);              // -> /api/anios-legales
app.use('/api/cargos-base', cargoBaseRoutes);              // -> /api/cargos-base
app.use('/api/funcionarios', funcionarioRoutes);            // -> /api/funcionarios
app.use('/api/categorias-director', categoriaDirectorRoutes);      // -> /api/categorias-director
app.use('/api/posiciones-cargo', posicionCargoRoutes);          // -> /api/posiciones-cargo
app.use('/api/movimientos-cargo', movimientoCargoRoutes);        // -> /api/movimientos-cargo
app.use('/api/historico-salario', historicoSalarioRoutes);       // -> /api/historicos-salario



//RUTAS
app.use('/api', cargoRoutes)
app.use('/api', directoresCategoriasRoutes)
app.use('/api/dptos', departamentoRoutes)



app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    Servidor iniciado correctamente
    Modo: ${process.env.NODE_ENV || 'development'}
    Puerto: ${PORT}
    `);
});