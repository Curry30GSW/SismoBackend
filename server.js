const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// =============================================
// IMPORTS DE RUTAS - PLANTA DE CARGOS
// =============================================
const anioLegalRoutes = require('./routes/plantaCargos/anioLegalRoutes');
const cargoBaseRoutes = require('./routes/plantaCargos/cargoBaseRoutes');
const funcionarioRoutes = require('./routes/plantaCargos/funcionarioRoutes');
const categoriaDirectorRoutes = require('./routes/plantaCargos/categoriaDirectorRoutes');
const movimientoCargoRoutes = require('./routes/plantaCargos/movimientoCargoRoutes');
const historicoSalarioRoutes = require('./routes/plantaCargos/historicoSalarioRoutes');
const comparativoRoutes = require('./routes/plantaCargos/comparativoRoutes');
const configuracionPrestacionesRoutes = require('./routes/plantaCargos/configuracionPrestacionesRoutes');
const tipoPlantaRoutes = require('./routes/plantaCargos/tipoPlantaRoutes');
const posicionCargoRoutes = require('./routes/plantaCargos/posicionCargoRoutes');
const posicionFijoRoutes = require('./routes/plantaCargos/posicionFijoRoutes');
const posicionSenaRoutes = require('./routes/plantaCargos/posicionSenaRoutes');
const directoresCategoriasRoutes = require('./routes/plantaCargos/DirectoresRoutes');
const departamentoRoutes = require('./routes/plantaCargos/DepartamentosRoutes');
// =============================================
// IMPORTS DE RUTAS - CONTRATOS
// =============================================
const contratoRoutes = require('./routes/Contratos/contratoRoutes');
const bancoRoutes = require('./routes/Contratos/bancoRoutes');
const cajaCompensacionRoutes = require('./routes/Contratos/cajaCompensacionRoutes');
const cesantiasRoutes = require('./routes/Contratos/cesantiasRoutes');
const epsRoutes = require('./routes/Contratos/epsRoutes');
const pensionesRoutes = require('./routes/Contratos/pensionesRoutes');
const nivelRiesgoRoutes = require('./routes/Contratos/nivelRiesgoRoutes');
const prorrogaRoutes = require('./routes/Contratos/prorrogaRoutes');
const preavisoNoProrrogaRoutes = require('./routes/Contratos/preavisoNoProrrogaRoutes');

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
// RUTAS - PLANTA DE CARGOS
// =============================================
app.use('/api/anios', anioLegalRoutes);              // -> /api/anios-legales
app.use('/api/cargos-base', cargoBaseRoutes);              // -> /api/cargos-base
app.use('/api/funcionarios', funcionarioRoutes);            // -> /api/funcionarios
app.use('/api/categorias-director', categoriaDirectorRoutes);      // -> /api/categorias-director
app.use('/api/posiciones-cargo', posicionCargoRoutes);          // -> /api/posiciones-cargo
app.use('/api/posiciones-fijo', posicionFijoRoutes);
app.use('/api/posiciones-sena', posicionSenaRoutes)
app.use('/api/movimientos-cargo', movimientoCargoRoutes);        // -> /api/movimientos-cargo
app.use('/api/historico-salario', historicoSalarioRoutes);       // -> /api/historicos-salario
app.use('/api/comparativo', comparativoRoutes);
app.use('/api/prestaciones', configuracionPrestacionesRoutes); // -> /api/configuracion-prestaciones
app.use('/api/tipos-planta', tipoPlantaRoutes);        // -> /api/tipos-planta

//RUTAS
app.use('/api', directoresCategoriasRoutes)
app.use('/api/dptos', departamentoRoutes)


// =============================================
// RUTAS - CONTRATOS
// =============================================
app.use('/api/contratos', contratoRoutes);
app.use('/api/bancos', bancoRoutes);
app.use('/api/cajas-compensacion', cajaCompensacionRoutes);
app.use('/api/cesantias', cesantiasRoutes);
app.use('/api/eps', epsRoutes);
app.use('/api/pensiones', pensionesRoutes);
app.use('/api/niveles-riesgo', nivelRiesgoRoutes);
app.use('/api/prorrogas', prorrogaRoutes);
app.use('/api/preavisos', preavisoNoProrrogaRoutes);


app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    Servidor iniciado correctamente
    Modo: ${process.env.NODE_ENV || 'development'}
    Puerto: ${PORT}
    `);
});