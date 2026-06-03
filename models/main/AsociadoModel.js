const { executeQueryAS400 } = require('../../config/ConectAS400');

const AsociadoModel = {

    // =========================================================
    // CONVERTIR FECHA AS400
    // =========================================================
    convertirFechaAS400: (valor) => {
        if (!valor || valor === 0) return null;

        // Convertir a número (si es string, limpiar espacios)
        let numValor;
        if (typeof valor === 'string') {
            numValor = parseInt(valor.trim(), 10);
        } else {
            numValor = valor;
        }

        if (isNaN(numValor) || numValor === 0) return null;

        // Fórmula mágica: sumar 19000000
        const fechaNum = numValor + 19000000;
        const fechaStr = fechaNum.toString();

        if (fechaStr.length !== 8) return null;

        const año = parseInt(fechaStr.substring(0, 4));
        const mes = parseInt(fechaStr.substring(4, 6));
        const dia = parseInt(fechaStr.substring(6, 8));

        if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

        const fecha = new Date(año, mes - 1, dia);
        return isNaN(fecha.getTime()) ? null : fecha;
    },

    // =========================================================
    // CALCULAR AÑOS EXACTOS (SOLO AÑOS)
    // =========================================================
    calcularAniosExactos: (desde, hasta) => {
        if (!desde || !hasta) return 0;
        let anios = hasta.getFullYear() - desde.getFullYear();
        const cumplio = hasta.getMonth() > desde.getMonth() ||
            (hasta.getMonth() === desde.getMonth() && hasta.getDate() >= desde.getDate());
        if (!cumplio) anios--;
        return anios;
    },

    // =========================================================
    // CALCULAR AÑOS, MESES Y DÍAS EXACTOS
    // =========================================================
    calcularTiempoExacto: (desde, hasta) => {
        if (!desde || !hasta) return {
            años: 0,
            meses: 0,
            dias: 0,
            texto: '0 años'
        };

        let años = hasta.getFullYear() - desde.getFullYear();
        let meses = hasta.getMonth() - desde.getMonth();
        let dias = hasta.getDate() - desde.getDate();

        // Ajustar días negativos
        if (dias < 0) {
            // Obtener el último día del mes anterior
            const ultimoDiaMesAnterior = new Date(hasta.getFullYear(), hasta.getMonth(), 0).getDate();
            dias += ultimoDiaMesAnterior;
            meses--;
        }

        // Ajustar meses negativos
        if (meses < 0) {
            meses += 12;
            años--;
        }

        // Formatear el texto
        const partes = [];
        if (años > 0) {
            partes.push(`${años} ${años === 1 ? 'año' : 'años'}`);
        }
        if (meses > 0) {
            partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
        }
        if (dias > 0) {
            partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
        }

        const texto = partes.length > 0 ? partes.join(', ') : '0 años';

        return {
            años: años,
            meses: meses,
            dias: dias,
            texto: texto
        };
    },

    // =========================================================
    // VALIDAR CONTINUIDAD
    // =========================================================
    calcularInicioContinuo: (cuentas) => {
        if (!cuentas.length) return null;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const unDia = 24 * 60 * 60 * 1000;

        const ordenadas = cuentas
            .filter(c => c.fecha_vinculacion)
            .sort((a, b) => a.fecha_vinculacion - b.fecha_vinculacion);

        if (!ordenadas.length) return null;

        let inicioBloque = null;
        let maxFin = null;

        for (const cuenta of ordenadas) {
            const inicio = new Date(cuenta.fecha_vinculacion);
            const fin = cuenta.fecha_retiro ? new Date(cuenta.fecha_retiro) : new Date(hoy);

            inicio.setHours(0, 0, 0, 0);
            fin.setHours(0, 0, 0, 0);

            if (!inicioBloque) {
                inicioBloque = inicio;
                maxFin = fin;
                continue;
            }

            if (inicio.getTime() <= maxFin.getTime()) {
                if (fin > maxFin) maxFin = fin;
            } else {
                inicioBloque = inicio;
                maxFin = fin;
            }
        }

        if (maxFin < hoy) return null;
        return inicioBloque;
    },

    // =========================================================
    // OBTENER TODOS LOS DATOS CON NÓMINAS
    // =========================================================
    getAllDatos: async () => {
        // Primera consulta para obtener datos de ACP05
        const queryCuentas = `
            SELECT
                NNIT05,
                DESC05,
                DIST05,
                NCTA05,
                FEVI05,
                FRDA05,
                INDC05,
                NOMI05
            FROM COLIB.ACP05
            WHERE FEVI05 > 0 AND NCTA05 > 9 AND NCTA05 < 900000 AND EMPR05 = '01'
            ORDER BY NNIT05, FEVI05
        `;

        const cuentasRows = await executeQueryAS400(queryCuentas);

        // Obtener todos los NOMI05 únicos para consultar ACP04
        const nominasUnicas = [...new Set(cuentasRows
            .filter(row => row.NOMI05 && row.NOMI05.trim() !== '')
            .map(row => row.NOMI05.trim()))];

        if (nominasUnicas.length === 0) {
            return cuentasRows.map(row => ({ ...row, DESC_NOMINA: null }));
        }

        // Consulta para obtener la relación NOMI05 con NOMI04 y DESC04
        const queryNominas = `
            SELECT DISTINCT
                NOMI04,
                DESC04
            FROM COLIB.ACP04
            WHERE NOMI04 IN (${nominasUnicas.map(() => '?').join(',')})
        `;

        const nominasRows = await executeQueryAS400(queryNominas, nominasUnicas);

        // Crear mapa de relación NOMI05 -> DESC04
        const nominaMap = new Map();
        nominasRows.forEach(row => {
            const nomi04 = row.NOMI04 ? String(row.NOMI04).trim() : '';
            const desc04 = row.DESC04 ? String(row.DESC04).trim() : '';
            if (nomi04 && desc04) {
                nominaMap.set(nomi04, desc04);
            }
        });

        // Combinar los resultados
        return cuentasRows.map(row => ({
            ...row,
            DESC_NOMINA: row.NOMI05 ? (nominaMap.get(String(row.NOMI05).trim()) || null) : null
        }));
    },

    // =========================================================
    // ASOCIADOS CON ANTIGÜEDAD MÍNIMA (CON NÓMINAS AGRUPADAS Y TIEMPO EXACTO)
    // =========================================================
    getAsociadosAntiguedadMinima: async (minAnios = 5, page = 2, limit = 5000) => {
        const offset = (page - 1) * limit;
        const rows = await AsociadoModel.getAllDatos();

        console.log(`Total de registros obtenidos: ${rows.length}`);

        const asociadosMap = new Map();

        for (const row of rows) {
            // OBTENER IDENTIFICACIÓN DIRECTAMENTE
            let id = row.NNIT05;

            if (!id) continue;

            // Limpiar espacios
            id = String(id).trim();

            if (id === '' || id === '0') continue;

            if (!asociadosMap.has(id)) {
                asociadosMap.set(id, {
                    identificacion: id,
                    nombres: row.DESC05 ? String(row.DESC05).trim() : '',
                    agencia: row.DIST05 ? String(row.DIST05).trim() : '',
                    cuentas: [],
                    nominasSet: new Set() // Usar Set para evitar duplicados
                });
            }

            const fechaVinc = AsociadoModel.convertirFechaAS400(row.FEVI05);
            const fechaRet = AsociadoModel.convertirFechaAS400(row.FRDA05);

            if (fechaVinc) {
                asociadosMap.get(id).cuentas.push({
                    cuenta: row.NCTA05 ? String(row.NCTA05).trim() : '',
                    fecha_vinculacion: fechaVinc,
                    fecha_retiro: fechaRet,
                    estado: row.INDC05,
                    nomina: row.DESC_NOMINA // Guardar la nómina
                });
            }

            // Agregar nómina al Set si existe
            if (row.DESC_NOMINA && row.DESC_NOMINA.trim() !== '') {
                asociadosMap.get(id).nominasSet.add(row.DESC_NOMINA);
            }
        }

        console.log(`Total de asociados únicos: ${asociadosMap.size}`);

        const hoy = new Date();
        const resultado = [];

        for (const [, asociado] of asociadosMap) {
            if (asociado.cuentas.length === 0) continue;

            const inicioContinuo = AsociadoModel.calcularInicioContinuo(asociado.cuentas);
            if (!inicioContinuo) continue;

            // Calcular tiempo exacto (años, meses, días)
            const tiempoExacto = AsociadoModel.calcularTiempoExacto(inicioContinuo, hoy);

            // Validar si cumple con los años mínimos requeridos
            if (tiempoExacto.años >= minAnios) {
                // Convertir Set de nóminas a string separado por comas
                const nominasConcatenadas = Array.from(asociado.nominasSet).join(', ');

                resultado.push({
                    identificacion: asociado.identificacion,
                    nombres: asociado.nombres,
                    sexo: asociado.sexo,
                    direccion: asociado.direccion,
                    agencia: asociado.agencia,
                    telefono: asociado.telefono,
                    cargo: asociado.cargo,
                    dependencia: asociado.dependencia,
                    fecha_primera_vinculacion: inicioContinuo.toISOString().split('T')[0],
                    anios_vinculado: tiempoExacto.años, // Mantener para compatibilidad
                    tiempo_vinculado: tiempoExacto.texto, // Nuevo campo con texto completo
                    tiempo_detalle: {
                        años: tiempoExacto.años,
                        meses: tiempoExacto.meses,
                        dias: tiempoExacto.dias
                    },
                    numero_cuentas: asociado.cuentas.length,
                    nominas: nominasConcatenadas // Campo con todas las nóminas
                });
            }
        }

        console.log(`Asociados con >= ${minAnios} años: ${resultado.length}`);

        resultado.sort((a, b) => b.anios_vinculado - a.anios_vinculado);

        const total = resultado.length;
        const paginados = resultado.slice(offset, offset + limit);

        return {
            data: paginados,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };
    },

    // =========================================================
    // RESUMEN DE ANTIGÜEDAD
    // =========================================================
    getResumenAntiguedad: async () => {
        const rows = await AsociadoModel.getAllDatos();

        const asociadosMap = new Map();

        for (const row of rows) {
            let id = row.NNIT05;
            if (!id) continue;
            id = String(id).trim();
            if (!id) continue;

            if (!asociadosMap.has(id)) {
                asociadosMap.set(id, { cuentas: [] });
            }

            const fechaVinc = AsociadoModel.convertirFechaAS400(row.FEVI05);
            if (fechaVinc) {
                asociadosMap.get(id).cuentas.push({
                    fecha_vinculacion: fechaVinc,
                    fecha_retiro: AsociadoModel.convertirFechaAS400(row.FRDA05)
                });
            }
        }

        const hoy = new Date();
        const rangos = {
            'Menos de 1 año': 0,
            '1-2 años': 0,
            '3-5 años': 0,
            '6-10 años': 0,
            '11-15 años': 0,
            '16-20 años': 0,
            'Más de 20 años': 0
        };

        for (const [, asociado] of asociadosMap) {
            const inicioContinuo = AsociadoModel.calcularInicioContinuo(asociado.cuentas);
            if (!inicioContinuo) continue;

            const tiempoExacto = AsociadoModel.calcularTiempoExacto(inicioContinuo, hoy);
            const anios = tiempoExacto.años;

            if (anios < 1) rangos['Menos de 1 año']++;
            else if (anios <= 2) rangos['1-2 años']++;
            else if (anios <= 5) rangos['3-5 años']++;
            else if (anios <= 10) rangos['6-10 años']++;
            else if (anios <= 15) rangos['11-15 años']++;
            else if (anios <= 20) rangos['16-20 años']++;
            else rangos['Más de 20 años']++;
        }

        return Object.entries(rangos)
            .map(([rango, cantidad]) => ({ rango_antiguedad: rango, cantidad_asociados: cantidad }))
            .filter(r => r.cantidad_asociados > 0);
    },

    // =========================================================
    // OBTENER ASOCIADO POR ID (CON NÓMINAS Y TIEMPO EXACTO)
    // =========================================================
    getAsociadoById: async (identificacion) => {
        const idLimpia = identificacion.toString().trim();

        const query = `
            SELECT
                NNIT05,
                DESC05,
                DIST05,
                NCTA05,
                FEVI05,
                FRDA05,
                INDC05,
                NOMI05
            FROM COLIB.ACP05
            WHERE NNIT05 = ? AND FEVI05 > 0
            ORDER BY FEVI05
        `;

        const rows = await executeQueryAS400(query, [idLimpia]);
        if (!rows.length) return null;

        // Obtener las nóminas únicas de este asociado
        const nominasUnicas = [...new Set(rows
            .filter(row => row.NOMI05 && row.NOMI05.trim() !== '')
            .map(row => row.NOMI05.trim()))];

        let nominaMap = new Map();
        if (nominasUnicas.length > 0) {
            const queryNominas = `
                SELECT DISTINCT
                    NOMI04,
                    DESC04
                FROM COLIB.ACP04
                WHERE NOMI04 IN (${nominasUnicas.map(() => '?').join(',')})
            `;
            const nominasRows = await executeQueryAS400(queryNominas, nominasUnicas);

            nominasRows.forEach(row => {
                const nomi04 = row.NOMI04 ? String(row.NOMI04).trim() : '';
                const desc04 = row.DESC04 ? String(row.DESC04).trim() : '';
                if (nomi04 && desc04) {
                    nominaMap.set(nomi04, desc04);
                }
            });
        }

        const hoy = new Date();
        const cuentas = [];
        const nominasSet = new Set();

        for (const row of rows) {
            const fechaVinc = AsociadoModel.convertirFechaAS400(row.FEVI05);
            if (fechaVinc) {
                const descNomina = row.NOMI05 ? (nominaMap.get(String(row.NOMI05).trim()) || null) : null;

                cuentas.push({
                    cuenta: row.NCTA05 ? String(row.NCTA05).trim() : '',
                    fecha_vinculacion: fechaVinc,
                    fecha_retiro: AsociadoModel.convertirFechaAS400(row.FRDA05),
                    estado: row.INDC05,
                    nomina: descNomina
                });

                if (descNomina && descNomina.trim() !== '') {
                    nominasSet.add(descNomina);
                }
            }
        }

        const inicioContinuo = AsociadoModel.calcularInicioContinuo(cuentas);
        const tiempoExacto = inicioContinuo ? AsociadoModel.calcularTiempoExacto(inicioContinuo, hoy) : { años: 0, meses: 0, dias: 0, texto: '0 años' };

        return {
            identificacion: idLimpia,
            nombres: rows[0].DESC05 ? String(rows[0].DESC05).trim() : '',
            agencia: rows[0].DIST05 ? String(rows[0].DIST05).trim() : '',
            fecha_primera_vinculacion: inicioContinuo ? inicioContinuo.toISOString().split('T')[0] : null,
            anios_vinculado: tiempoExacto.años, // Mantener para compatibilidad
            tiempo_vinculado: tiempoExacto.texto, // Nuevo campo con texto completo
            tiempo_detalle: {
                años: tiempoExacto.años,
                meses: tiempoExacto.meses,
                dias: tiempoExacto.dias
            },
            numero_cuentas: cuentas.length,
            cuentas: cuentas,
            nominas: Array.from(nominasSet).join(', ') // Todas las nóminas en un solo campo
        };
    }
};

module.exports = AsociadoModel;