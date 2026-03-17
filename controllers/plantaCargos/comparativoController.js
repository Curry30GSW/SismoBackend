const AnioLegalModel = require('../../models/plantaCargos/AnioLegalModel');
const ComparativoModel = require('../../models/plantaCargos/ComparativoModel');
const pool = require('../../config/ConectDb');

const comparativoController = {
    // Comparativo por cargo entre dos años
    compararCargos: async (req, res) => {
        try {
            const { id1, id2 } = req.params;

            // Validar que los años existan
            const anio1 = await AnioLegalModel.getById(id1);
            const anio2 = await AnioLegalModel.getById(id2);

            if (!anio1 || !anio2) {
                return res.status(404).json({
                    success: false,
                    message: 'Uno o ambos años no fueron encontrados'
                });
            }

            // Obtener datos comparativos
            const rows = await ComparativoModel.getComparativoCargos(
                id1,
                id2,
                anio1.auxilio_transporte,
                anio2.auxilio_transporte
            );

            // Procesar resultados
            const cargos = rows.map(row => {
                // Calcular salario total por persona (salario base + bonificación + auxilio)
                const salarioTotal1 = (row.salario_base_1 || 0) + (row.bonificacion_1 || 0) + (row.auxilio_valor_1 || 0);
                const salarioTotal2 = (row.salario_base_2 || 0) + (row.bonificacion_2 || 0) + (row.auxilio_valor_2 || 0);

                // Calcular total planta (salario total * total de posiciones)
                const totalPlanta1 = salarioTotal1 * (row.total_posiciones_1 || 0);
                const totalPlanta2 = salarioTotal2 * (row.total_posiciones_2 || 0);

                // Calcular disponibles (total - ocupadas)
                const disponibles1 = (row.total_posiciones_1 || 0) - (row.ocupadas_1 || 0);
                const disponibles2 = (row.total_posiciones_2 || 0) - (row.ocupadas_2 || 0);

                return {
                    id_cargo: row.id_cargo_base,
                    cargo: row.nombre_cargo,
                    es_director: row.es_director_agencia === 1,

                    año_anterior: {
                        total: row.total_posiciones_1 || 0,
                        nombrados: row.ocupadas_1 || 0,
                        disponibles: disponibles1,
                        salario_base: row.salario_base_1 || 0,
                        bonificacion: row.bonificacion_1 || 0,
                        auxilio_transporte: row.auxilio_valor_1 || 0,
                        total_salario: salarioTotal1,
                        total_planta: totalPlanta1
                    },

                    año_actual: {
                        total: row.total_posiciones_2 || 0,
                        nombrados: row.ocupadas_2 || 0,
                        disponibles: disponibles2,
                        salario_base: row.salario_base_2 || 0,
                        bonificacion: row.bonificacion_2 || 0,
                        auxilio_transporte: row.auxilio_valor_2 || 0,
                        total_salario: salarioTotal2,
                        total_planta: totalPlanta2
                    },

                    incrementos: {
                        salario_base: row.salario_base_1 ? (((row.salario_base_2 || 0) / row.salario_base_1 - 1) * 100).toFixed(2) : '0.00',
                        total_salario: salarioTotal1 ? (((salarioTotal2 / salarioTotal1) - 1) * 100).toFixed(2) : '0.00',
                        total_planta: totalPlanta1 ? (((totalPlanta2 / totalPlanta1) - 1) * 100).toFixed(2) : '0.00'
                    }
                };
            });

            // Calcular totales generales
            const totales = cargos.reduce((acc, cargo) => ({
                total_anterior: acc.total_anterior + cargo.año_anterior.total,
                nombrados_anterior: acc.nombrados_anterior + cargo.año_anterior.nombrados,
                disponibles_anterior: acc.disponibles_anterior + cargo.año_anterior.disponibles,
                total_planta_anterior: acc.total_planta_anterior + cargo.año_anterior.total_planta,

                total_actual: acc.total_actual + cargo.año_actual.total,
                nombrados_actual: acc.nombrados_actual + cargo.año_actual.nombrados,
                disponibles_actual: acc.disponibles_actual + cargo.año_actual.disponibles,
                total_planta_actual: acc.total_planta_actual + cargo.año_actual.total_planta,
            }), {
                total_anterior: 0,
                nombrados_anterior: 0,
                disponibles_anterior: 0,
                total_planta_anterior: 0,
                total_actual: 0,
                nombrados_actual: 0,
                disponibles_actual: 0,
                total_planta_actual: 0,
            });

            res.json({
                success: true,
                message: 'Comparativo por cargo obtenido exitosamente',
                data: {
                    año_anterior: {
                        id: anio1.id_anio_legal,
                        anio: anio1.anio,
                        salario_minimo: anio1.salario_minimo_legal,
                        auxilio: anio1.auxilio_transporte
                    },
                    año_actual: {
                        id: anio2.id_anio_legal,
                        anio: anio2.anio,
                        salario_minimo: anio2.salario_minimo_legal,
                        auxilio: anio2.auxilio_transporte
                    },
                    totales,
                    cargos
                }
            });

        } catch (error) {
            console.error('Error en compararCargos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener comparativo por cargo',
                error: error.message
            });
        }
    },

    // Comparativo por departamento entre dos años
    compararDepartamentos: async (req, res) => {
        try {
            const { id1, id2 } = req.params;

            const anio1 = await AnioLegalModel.getById(id1);
            const anio2 = await AnioLegalModel.getById(id2);

            if (!anio1 || !anio2) {
                return res.status(404).json({
                    success: false,
                    message: 'Uno o ambos años no fueron encontrados'
                });
            }

            const rows = await ComparativoModel.getComparativoDepartamentos(id1, id2);

            const departamentos = rows.map(row => ({
                id_departamento: row.id_departamento,
                departamento: row.nombre_departamento,
                año_anterior: {
                    total: row.total_posiciones_1 || 0,
                    ocupadas: row.ocupadas_1 || 0,
                    disponibles: (row.total_posiciones_1 || 0) - (row.ocupadas_1 || 0)
                },
                año_actual: {
                    total: row.total_posiciones_2 || 0,
                    ocupadas: row.ocupadas_2 || 0,
                    disponibles: (row.total_posiciones_2 || 0) - (row.ocupadas_2 || 0)
                }
            }));

            res.json({
                success: true,
                message: 'Comparativo por departamento obtenido exitosamente',
                data: {
                    año_anterior: {
                        id: anio1.id_anio_legal,
                        anio: anio1.anio
                    },
                    año_actual: {
                        id: anio2.id_anio_legal,
                        anio: anio2.anio
                    },
                    departamentos
                }
            });

        } catch (error) {
            console.error('Error en compararDepartamentos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener comparativo por departamento',
                error: error.message
            });
        }
    },

    // Resumen ejecutivo comparativo
    resumenComparativo: async (req, res) => {
        try {
            const { id1, id2 } = req.params;

            const anio1 = await AnioLegalModel.getById(id1);
            const anio2 = await AnioLegalModel.getById(id2);

            if (!anio1 || !anio2) {
                return res.status(404).json({
                    success: false,
                    message: 'Uno o ambos años no fueron encontrados'
                });
            }

            // Obtener datos de posiciones
            const [rows] = await pool.query(`
                SELECT 
                    COUNT(DISTINCT pc1.id_posicion) as total_1,
                    COUNT(DISTINCT CASE WHEN pc1.id_funcionario IS NOT NULL THEN pc1.id_posicion END) as ocupadas_1,
                    COUNT(DISTINCT pc2.id_posicion) as total_2,
                    COUNT(DISTINCT CASE WHEN pc2.id_funcionario IS NOT NULL THEN pc2.id_posicion END) as ocupadas_2
                FROM (SELECT 1) as dummy
                LEFT JOIN posiciones_cargo pc1 ON pc1.id_anio_legal = ? AND pc1.activo = true
                LEFT JOIN posiciones_cargo pc2 ON pc2.id_anio_legal = ? AND pc2.activo = true
            `, [id1, id2]);

            const data = rows[0];

            res.json({
                success: true,
                message: 'Resumen comparativo obtenido exitosamente',
                data: {
                    año_anterior: {
                        anio: anio1.anio,
                        salario_minimo: anio1.salario_minimo_legal,
                        auxilio: anio1.auxilio_transporte,
                        total_posiciones: data.total_1 || 0,
                        ocupadas: data.ocupadas_1 || 0,
                        disponibles: (data.total_1 || 0) - (data.ocupadas_1 || 0)
                    },
                    año_actual: {
                        anio: anio2.anio,
                        salario_minimo: anio2.salario_minimo_legal,
                        auxilio: anio2.auxilio_transporte,
                        total_posiciones: data.total_2 || 0,
                        ocupadas: data.ocupadas_2 || 0,
                        disponibles: (data.total_2 || 0) - (data.ocupadas_2 || 0)
                    },
                    incrementos: {
                        salario_minimo: (((anio2.salario_minimo_legal / anio1.salario_minimo_legal) - 1) * 100).toFixed(2),
                        auxilio: (((anio2.auxilio_transporte / anio1.auxilio_transporte) - 1) * 100).toFixed(2),
                        posiciones: (((data.total_2 || 0) / (data.total_1 || 1)) - 1) * 100
                    }
                }
            });

        } catch (error) {
            console.error('Error en resumenComparativo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener resumen comparativo',
                error: error.message
            });
        }
    },

    getResumenAnioActual: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            // Validar que el año existe
            const anioLegal = await AnioLegalModel.getById(id_anio_legal);
            if (!anioLegal) {
                return res.status(404).json({
                    success: false,
                    message: 'Año legal no encontrado'
                });
            }

            // Obtener resumen por cargo
            const rows = await ComparativoModel.getResumenAnioActual(
                id_anio_legal,
                anioLegal.auxilio_transporte
            );

            // Obtener totales generales
            const totales = await ComparativoModel.getTotalesAnioActual(
                id_anio_legal,
                anioLegal.auxilio_transporte
            );

            // Procesar los resultados
            const cargos = rows.map(row => ({
                id_cargo: row.id_cargo_base,
                cargo: row.nombre_cargo,
                codigo: row.codigo_cargo,
                es_director: row.es_director_agencia === 1,

                // Posiciones
                total_posiciones: row.total_posiciones || 0,
                ocupadas: row.ocupadas || 0,
                disponibles: row.disponibles || 0,

                // Valores individuales
                salario_base: row.salario_base || 0,
                bonificacion: row.bonificacion || 0,
                auxilio_transporte: row.auxilio_valor || 0,
                total_salario_individual: row.total_salario_individual || 0,

                // Total planta (salario total * posiciones)
                total_planta: row.total_planta || 0,

                // Porcentaje de ocupación
                porcentaje_ocupacion: row.total_posiciones > 0
                    ? ((row.ocupadas / row.total_posiciones) * 100).toFixed(2)
                    : '0.00'
            }));

            // Calcular totales adicionales
            const totalesCargos = cargos.reduce((acc, cargo) => ({
                total_posiciones: acc.total_posiciones + cargo.total_posiciones,
                total_ocupadas: acc.total_ocupadas + cargo.ocupadas,
                total_disponibles: acc.total_disponibles + cargo.disponibles,
                total_planta: acc.total_planta + cargo.total_planta
            }), {
                total_posiciones: 0,
                total_ocupadas: 0,
                total_disponibles: 0,
                total_planta: 0
            });

            res.json({
                success: true,
                message: 'Resumen del año actual obtenido exitosamente',
                data: {
                    anio: anioLegal.anio,
                    id_anio_legal: anioLegal.id_anio_legal,
                    salario_minimo: anioLegal.salario_minimo_legal,
                    auxilio_transporte: anioLegal.auxilio_transporte,
                    totales: {
                        total_posiciones: totales?.total_posiciones || 0,
                        total_ocupadas: totales?.total_ocupadas || 0,
                        total_disponibles: totales?.total_disponibles || 0,
                        funcionarios_asignados: totales?.funcionarios_asignados || 0,
                        total_planta_mensual: totales?.total_planta_mensual || 0,
                        // Totales calculados desde los cargos (verificación)
                        verificado: {
                            total_posiciones: totalesCargos.total_posiciones,
                            total_ocupadas: totalesCargos.total_ocupadas,
                            total_disponibles: totalesCargos.total_disponibles,
                            total_planta: totalesCargos.total_planta
                        }
                    },
                    cargos
                }
            });

        } catch (error) {
            console.error('Error en getResumenAnioActual:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener resumen del año actual'
            });
        }
    }

};

module.exports = comparativoController;