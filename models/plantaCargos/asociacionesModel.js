const { executeQueryAS400 } = require('../../config/ConectAS400');

const getNombreLibreria = (mes, anio) => {
    const mesStr = mes.toString().padStart(2, '0');
    const anioStr = anio.toString().slice(-2);
    return `COLIB${mesStr}${anioStr}`;
};

// 🔥 Función para calcular mes vencido (restar 1 mes)
const calcularMesVencido = (mes, anio) => {
    let mesVencido = mes - 1;
    let anioVencido = anio;

    if (mesVencido === 0) {
        mesVencido = 12;
        anioVencido = anio - 1;
    }

    return { mes: mesVencido, anio: anioVencido };
};

// 🔥 Función para obtener mes vencido automático (si no se envían parámetros)
const getMesVencidoActual = () => {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();

    return calcularMesVencido(mesActual, anioActual);
};

// 🔥 MODELO CORREGIDO
const getAsociacionesNetas = async (options = {}) => {
    let mes, anio, nombreLibreria;

    if (options.mes && options.anio) {
        // 🔥 Si el frontend envía mes y año, calcular el mes vencido (restar 1)
        const mesVencido = calcularMesVencido(options.mes, options.anio);
        mes = mesVencido.mes;
        anio = mesVencido.anio;
        nombreLibreria = getNombreLibreria(mes, anio);
    } else {
        // Si no se envían parámetros, usar mes vencido automático
        const mesVencidoActual = getMesVencidoActual();
        mes = mesVencidoActual.mes;
        anio = mesVencidoActual.anio;
        nombreLibreria = getNombreLibreria(mes, anio);
    }

    try {
        const query = `
            SELECT 
                ACP03.DIRE03, 
                ACP03.DESC03, 
                ACP05.DIST05, 
                COUNT(ACP05.NCTA05) AS CUENTAS 
            FROM ${nombreLibreria}.ACP03 ACP03
            INNER JOIN ${nombreLibreria}.ACP05 ACP05 
                ON ACP05.DIST05 = ACP03.DIST03
            WHERE 
                ACP05.EMPR05 = '01' 
                AND ACP05.NCTA05 > 9 
                AND ACP05.NCTA05 < 900000 
                AND ACP05.FRDA05 = 0
                AND ACP05.INDC05 = 0
            GROUP BY 
                ACP03.DIRE03, 
                ACP03.DESC03, 
                ACP05.DIST05
            ORDER BY 
                ACP03.DESC03 ASC
        `;
        const rows = await executeQueryAS400(query);

        if (!rows || rows.length === 0) {
            console.log(`⚠️ No se encontraron datos en AS400 para ${nombreLibreria}`);
            return [];
        }

        return rows;

    } catch (error) {
        console.error('❌ Error en getAsociacionesNetas:', error);
        throw new Error(`Error al consultar AS400: ${error.message}`);
    }
};

const getPeriodosDisponibles = async () => {
    const periodos = [];
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;

    // Generar últimos 12 meses VENCIDOS
    for (let i = 1; i <= 12; i++) {
        const mesVencido = calcularMesVencido(mesActual, anioActual);
        const mes = mesVencido.mes;
        const anio = mesVencido.anio;

        periodos.push({
            mes: mes,
            anio: anio,
            nombreLibreria: getNombreLibreria(mes, anio),
            fecha: new Date(anio, mes - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
        });

        // Para el siguiente iteración, restar otro mes
        let tempMes = mesActual - i;
        let tempAnio = anioActual;
        if (tempMes <= 0) {
            tempMes += 12;
            tempAnio--;
        }
    }

    return periodos;
};

module.exports = {
    getAsociacionesNetas,
    getMesVencidoActual,
    calcularMesVencido,
    getNombreLibreria,
    getPeriodosDisponibles
};