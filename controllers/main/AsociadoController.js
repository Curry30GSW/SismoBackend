const XLSX = require('xlsx');
const AsociadoModel = require('../../models/main/AsociadoModel');
const { executeQueryAS400 } = require('../../config/ConectAS400');
const asociadoController = {

    testFechas: async (req, res) => {
        try {
            // Probar con valores específicos
            const valoresPrueba = [960401, 1231202, 1010101, 990101, 0, null];

            const resultados = [];

            for (const val of valoresPrueba) {
                if (!val || val === 0) {
                    resultados.push({ original: val, convertida: null, razon: 'Valor nulo o cero' });
                    continue;
                }

                const fechaNum = val + 19000000;
                const fechaStr = fechaNum.toString();

                if (fechaStr.length !== 8) {
                    resultados.push({ original: val, fechaNum, fechaStr, razon: `Longitud incorrecta: ${fechaStr.length}` });
                    continue;
                }

                const año = parseInt(fechaStr.substring(0, 4));
                const mes = parseInt(fechaStr.substring(4, 6));
                const dia = parseInt(fechaStr.substring(6, 8));

                if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
                    resultados.push({ original: val, fechaNum, fechaStr, año, mes, dia, razon: 'Fecha inválida' });
                    continue;
                }

                const fecha = new Date(año, mes - 1, dia);
                resultados.push({
                    original: val,
                    fechaNum,
                    fechaStr,
                    año, mes, dia,
                    fecha: fecha.toISOString().split('T')[0],
                    valido: !isNaN(fecha.getTime())
                });
            }

            // También probar con datos reales de la BD (primeros 5 registros)
            const query = `
            SELECT FEVI05, FRDA05, NNIT05
            FROM COLIB.ACP05
            WHERE FEVI05 > 0
            FETCH FIRST 10 ROWS ONLY
        `;

            const rows = await executeQueryAS400(query);
            const datosReales = [];

            for (const row of rows) {
                const fechaVinc = row.FEVI05;
                const fechaNum = fechaVinc + 19000000;
                const fechaStr = fechaNum.toString();

                datosReales.push({
                    raw: fechaVinc,
                    rawType: typeof fechaVinc,
                    fechaNum,
                    fechaStr,
                    longitud: fechaStr.length,
                    año: fechaStr.length >= 4 ? fechaStr.substring(0, 4) : null,
                    mes: fechaStr.length >= 6 ? fechaStr.substring(4, 6) : null,
                    dia: fechaStr.length >= 8 ? fechaStr.substring(6, 8) : null
                });
            }

            res.json({
                pruebas_conversion: resultados,
                datos_reales: datosReales,
                primer_registro_raw: rows[0]
            });

        } catch (error) {
            console.error('Error en test:', error);
            res.status(500).json({ error: error.message });
        }
    },

    diagnostico: async (req, res) => {
        try {
            const query = `
            SELECT 
                NNIT05,
                LENGTH(NNIT05) as longitud,
                HEX(NNIT05) as hex_value,
                TRIM(NNIT05) as limpio
            FROM COLIB.ACP05
            WHERE FEVI05 > 0
            FETCH FIRST 5 ROWS ONLY
        `;

            const rows = await executeQueryAS400(query);

            res.json({
                success: true,
                data: rows,
                tipos: rows.map(r => ({
                    raw: r.NNIT05,
                    tipo: typeof r.NNIT05,
                    esNull: r.NNIT05 === null,
                    esUndefined: r.NNIT05 === undefined,
                    longitud: r.longitud,
                    hex: r.hex_value,
                    limpio: r.limpio
                }))
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAntiguedadMinima: async (req, res) => {
        try {
            const { min_anios = 5, page = 1, limit = 6000 } = req.query;
            const anios = parseInt(min_anios);
            const pagina = parseInt(page);
            const limite = Math.min(parseInt(limit), 6000);

            const result = await AsociadoModel.getAsociadosAntiguedadMinima(anios, pagina, limite);

            const asociados = result.data;
            const total = asociados.length;

            const totalHombres = asociados.filter(a => a.sexo?.trim() === 'M').length;
            const totalMujeres = asociados.filter(a => a.sexo?.trim() === 'F').length;
            const promedioAntiguedad = total > 0
                ? (asociados.reduce((sum, a) => sum + (a.anios_vinculado || 0), 0) / total).toFixed(2)
                : 0;

            res.json({
                success: true,
                data: asociados,
                pagination: result.pagination,
                resumen: {
                    total_asociados: total,
                    min_anios_requeridos: anios,
                    promedio_antiguedad: promedioAntiguedad,
                    distribucion_sexo: {
                        masculino: totalHombres,
                        femenino: totalMujeres,
                        porcentaje_masculino: total > 0 ? ((totalHombres / total) * 100).toFixed(2) : 0,
                        porcentaje_femenino: total > 0 ? ((totalMujeres / total) * 100).toFixed(2) : 0
                    }
                }
            });

        } catch (error) {
            console.error('Error en getAntiguedadMinima:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getResumenAntiguedad: async (req, res) => {
        try {
            const resumen = await AsociadoModel.getResumenAntiguedad();
            res.json({ success: true, data: resumen });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAsociadoById: async (req, res) => {
        try {
            const { identificacion } = req.params;
            const asociado = await AsociadoModel.getAsociadoById(identificacion);

            if (!asociado) {
                return res.status(404).json({ success: false, message: 'Asociado no encontrado' });
            }

            res.json({ success: true, data: asociado });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getAsociadoByCedula: async (req, res) => {
        try {
            const { cedula } = req.params;

            if (!cedula) {
                return res.status(400).json({
                    success: false,
                    message: 'La cédula es requerida'
                });
            }

            // Limpiar la cédula
            const cedulaLimpia = cedula.toString().trim();

            // Consulta para obtener TODOS los datos del asociado
            const query = `
            SELECT
                NNIT05,
                NOMB05,
                APE105,
                APE205,
                SEXO05,
                DIRE05,
                CIUD05,
                TELE05,
                CARG05,
                DEPE05,
                NCTA05,
                FEVI05,
                FRDA05,
                INDC05
            FROM COLIB.ACP05
            WHERE TRIM(NNIT05) = ?
            ORDER BY FEVI05
        `;

            const rows = await executeQueryAS400(query, [cedulaLimpia]);

            console.log('Registros encontrados:', rows.length);

            if (!rows.length) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró asociado con cédula: ${cedulaLimpia}`
                });
            }

            // Obtener datos del primer registro para información general
            const primerRegistro = rows[0];

            // Procesar todas las cuentas
            const cuentas = [];
            let fechaPrimeraVinculacion = null;

            for (const row of rows) {
                // Convertir fecha de vinculación
                let fechaVinculacion = null;
                if (row.FEVI05 && row.FEVI05 > 0) {
                    const fechaNum = Number(row.FEVI05) + 19000000;
                    const fechaStr = fechaNum.toString();
                    if (fechaStr.length === 8) {
                        const año = fechaStr.substring(0, 4);
                        const mes = fechaStr.substring(4, 6);
                        const dia = fechaStr.substring(6, 8);
                        fechaVinculacion = `${año}-${mes}-${dia}`;
                    }
                }

                // Convertir fecha de retiro
                let fechaRetiro = null;
                if (row.FRDA05 && row.FRDA05 > 0) {
                    const fechaNum = Number(row.FRDA05) + 19000000;
                    const fechaStr = fechaNum.toString();
                    if (fechaStr.length === 8) {
                        const año = fechaStr.substring(0, 4);
                        const mes = fechaStr.substring(4, 6);
                        const dia = fechaStr.substring(6, 8);
                        fechaRetiro = `${año}-${mes}-${dia}`;
                    }
                }

                // Determinar la fecha más temprana de vinculación
                if (fechaVinculacion && (!fechaPrimeraVinculacion || fechaVinculacion < fechaPrimeraVinculacion)) {
                    fechaPrimeraVinculacion = fechaVinculacion;
                }

                // Determinar estado de la cuenta
                let estadoCuenta = 'ACTIVA';
                if (fechaRetiro && new Date(fechaRetiro) < new Date()) {
                    estadoCuenta = 'RETIRADA';
                }

                cuentas.push({
                    numero_cuenta: row.NCTA05 ? String(row.NCTA05).trim() : 'N/A',
                    fecha_vinculacion: fechaVinculacion,
                    fecha_retiro: fechaRetiro,
                    estado: estadoCuenta
                });
            }

            // Calcular antigüedad
            let antiguedad = null;
            if (fechaPrimeraVinculacion) {
                const hoy = new Date();
                const fechaInicio = new Date(fechaPrimeraVinculacion);
                let años = hoy.getFullYear() - fechaInicio.getFullYear();
                const mesActual = hoy.getMonth() + 1;
                const diaActual = hoy.getDate();
                const mesInicio = fechaInicio.getMonth() + 1;
                const diaInicio = fechaInicio.getDate();

                if (mesActual < mesInicio || (mesActual === mesInicio && diaActual < diaInicio)) {
                    años--;
                }
                antiguedad = años;
            }

            // Determinar estado general del asociado
            const tieneCuentaActiva = cuentas.some(c => c.estado === 'ACTIVA');
            const estadoGeneral = tieneCuentaActiva ? 'ACTIVO' : 'INACTIVO';

            res.json({
                success: true,
                data: {
                    cedula: cedulaLimpia,
                    nombres: primerRegistro.NOMB05 ? String(primerRegistro.NOMB05).trim() : '',
                    primer_apellido: primerRegistro.APE105 ? String(primerRegistro.APE105).trim() : '',
                    segundo_apellido: primerRegistro.APE205 ? String(primerRegistro.APE205).trim() : '',
                    sexo: primerRegistro.SEXO05 ? String(primerRegistro.SEXO05).trim() : '',
                    direccion: primerRegistro.DIRE05 ? String(primerRegistro.DIRE05).trim() : '',
                    ciudad: primerRegistro.CIUD05 ? String(primerRegistro.CIUD05).trim() : '',
                    telefono: primerRegistro.TELE05 ? String(primerRegistro.TELE05).trim() : '',
                    cargo: primerRegistro.CARG05 ? String(primerRegistro.CARG05).trim() : '',
                    dependencia: primerRegistro.DEPE05 ? String(primerRegistro.DEPE05).trim() : '',
                    fecha_primera_vinculacion: fechaPrimeraVinculacion,
                    antiguedad_anios: antiguedad,
                    estado: estadoGeneral,
                    total_cuentas: cuentas.length,
                    cuentas: cuentas
                }
            });

        } catch (error) {
            console.error('Error en getAsociadoByCedula:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // =========================================================
    // EXPORTAR A EXCEL - AGREGADO DENTRO DEL CONTROLADOR
    // =========================================================
    exportToExcel: async (req, res) => {
        try {
            // Obtener los datos (sin paginación)
            const minAnios = req.query.minAnios || 5;

            // Llamar a tu modelo sin paginación para obtener todos
            const { data } = await AsociadoModel.getAsociadosAntiguedadMinima(
                parseInt(minAnios),
                1,
                999999 // Un número grande para traer todos
            );

            // Preparar los datos para Excel
            const excelData = data.map(asociado => ({
                'IDENTIFICACIÓN': asociado.identificacion,
                'NOMBRES': asociado.nombres,
                'AGENCIA': asociado.agencia,
                'FECHA PRIMERA VINCULACIÓN': asociado.fecha_primera_vinculacion,
                'TIEMPO VINCULADO': asociado.tiempo_vinculado,
                'AÑOS': asociado.tiempo_detalle?.años || asociado.anios_vinculado,
                'MESES': asociado.tiempo_detalle?.meses || 0,
                'DÍAS': asociado.tiempo_detalle?.dias || 0,
                'NÚMERO DE CUENTAS': asociado.numero_cuentas,
                'NÓMINAS': asociado.nominas || ''
            }));

            // Crear hoja de trabajo
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Ajustar ancho de columnas
            const colWidths = [
                { wch: 15 }, // IDENTIFICACIÓN
                { wch: 40 }, // NOMBRES
                { wch: 15 }, // AGENCIA
                { wch: 25 }, // FECHA VINCULACIÓN
                { wch: 25 }, // TIEMPO VINCULADO
                { wch: 10 }, // AÑOS
                { wch: 10 }, // MESES
                { wch: 10 }, // DÍAS
                { wch: 15 }, // NÚMERO CUENTAS
                { wch: 50 }  // NÓMINAS
            ];
            worksheet['!cols'] = colWidths;

            // Crear libro de trabajo
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Asociados Antigüedad');

            // Generar archivo
            const filename = `asociados_antiguedad_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.send(buffer);

        } catch (error) {
            console.error('Error exportando a Excel:', error);
            res.status(500).json({ error: 'Error al exportar los datos' });
        }
    }
};

module.exports = asociadoController;


