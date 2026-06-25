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
const asociacionesRoutes = require('./routes/plantaCargos/asociacionesRoutes');
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
const ascensoRoutes = require('./routes/Contratos/ascensoRoutes');
const encargaturaRoutes = require('./routes/Contratos/EncargaturaRoutes');
const trasladoRoutes = require('./routes/Contratos/trasladoRoutes');
const cambioFechasAprendizRoutes = require('./routes/Contratos/cambioFechasAprendizRoutes');
const nombramientosRoutes = require('./routes/Contratos/nombramientoRoutes');
// =============================================
// IMPORTS DE RUTAS - PRINCIPALES
// =============================================
const documentoVerificacionRoutes = require('./routes/main/documentoVerificacionRoutes');
const asociadoRoutes = require('./routes/main/asociadoRoutes');
const authRoutes = require('./routes/main/authRoutes');

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
app.use('/api/anios', anioLegalRoutes);
app.use('/api/cargos-base', cargoBaseRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/categorias-director', categoriaDirectorRoutes);
app.use('/api/posiciones-cargo', posicionCargoRoutes);
app.use('/api/posiciones-fijo', posicionFijoRoutes);
app.use('/api/posiciones-sena', posicionSenaRoutes)
app.use('/api/movimientos-cargo', movimientoCargoRoutes);
app.use('/api/historico-salario', historicoSalarioRoutes);
app.use('/api/comparativo', comparativoRoutes);
app.use('/api/prestaciones', configuracionPrestacionesRoutes);
app.use('/api/tipos-planta', tipoPlantaRoutes);
app.use('/api/asociaciones-netas', asociacionesRoutes);

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
app.use('/api/ascensos', ascensoRoutes);
app.use('/api/encargaturas', encargaturaRoutes);
app.use('/api/traslados', trasladoRoutes);
app.use('/api/contratos-sena', cambioFechasAprendizRoutes);
app.use('/api/nombramientos', nombramientosRoutes);

// =============================================
// RUTAS - PRINCIPALES
// =============================================
app.use('/api/documentos-verificacion', documentoVerificacionRoutes);
app.use('/api/auth', authRoutes);


app.use('/api/asociadosQuin', asociadoRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    Servidor iniciado correctamente
    Modo: ${process.env.NODE_ENV || 'development'}
    Puerto: ${PORT}
    `);
});

try {
    require('./jobs');
    console.log('✅ Jobs programados iniciados correctamente');
} catch (error) {
    console.error('❌ Error al iniciar jobs:', error);
}