const MovimientoCargoModel = require('../models/MovimientoCargoModel');
const PosicionCargoModel = require('../models/PosicionCargoModel');
const FuncionarioModel = require('../models/FuncionarioModel');

const movimientoCargoController = {
    // 1. REGISTRAR MOVIMIENTO (uso interno, no expuesto directamente)
    create: async (req, res) => {
        try {
            const {
                id_posicion,
                id_funcionario,
                tipo_movimiento,
                fecha_movimiento,
                id_anio_legal,
                motivo
            } = req.body;

            // Validaciones obligatorias
            if (!id_posicion || !tipo_movimiento || !id_anio_legal) {
                return res.status(400).json({
                    message: 'id_posicion, tipo_movimiento e id_anio_legal son requeridos'
                });
            }

            // Validar tipo de movimiento
            const tiposValidos = ['CREACION', 'ELIMINACION', 'ASIGNACION', 'DESASIGNACION', 'TRASLADO'];
            if (!tiposValidos.includes(tipo_movimiento)) {
                return res.status(400).json({
                    message: `Tipo de movimiento inválido. Válidos: ${tiposValidos.join(', ')}`
                });
            }

            // Si es ASIGNACION o DESASIGNACION, requiere id_funcionario
            if (['ASIGNACION', 'DESASIGNACION'].includes(tipo_movimiento) && !id_funcionario) {
                return res.status(400).json({
                    message: 'Para movimientos de asignación/desasignación, el id_funcionario es requerido'
                });
            }

            const usuario = req.user?.email || req.body.usuario_sistema || 'SISTEMA';

            const result = await MovimientoCargoModel.create({
                id_posicion,
                id_funcionario,
                tipo_movimiento,
                fecha_movimiento,
                id_anio_legal,
                motivo,
                usuario_sistema: usuario
            });

            res.status(201).json({
                message: 'Movimiento registrado exitosamente',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. OBTENER MOVIMIENTOS POR POSICIÓN
    getByPosicion: async (req, res) => {
        try {
            const { id_posicion } = req.params;

            const posicion = await PosicionCargoModel.getById(id_posicion);
            if (!posicion) {
                return res.status(404).json({
                    message: 'Posición no encontrada'
                });
            }

            const data = await MovimientoCargoModel.getByPosicion(id_posicion);

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. OBTENER MOVIMIENTOS POR FUNCIONARIO
    getByFuncionario: async (req, res) => {
        try {
            const { id_funcionario } = req.params;

            const funcionario = await FuncionarioModel.getById(id_funcionario);
            if (!funcionario) {
                return res.status(404).json({
                    message: 'Funcionario no encontrado'
                });
            }

            const data = await MovimientoCargoModel.getByFuncionario(id_funcionario);

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. OBTENER MOVIMIENTOS POR AÑO
    getByAnio: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;
            const { tipo } = req.query;

            const data = await MovimientoCargoModel.getByAnio(id_anio_legal, tipo || null);

            res.json({
                data,
                total: data.length,
                año: id_anio_legal,
                filtro_tipo: tipo || 'todos'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. OBTENER RESUMEN DE MOVIMIENTOS POR AÑO
    getResumenByAnio: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            const data = await MovimientoCargoModel.getResumenByAnio(id_anio_legal);

            // Calcular totales
            const totalMovimientos = data.reduce((acc, item) => acc + item.cantidad, 0);

            res.json({
                data,
                total_movimientos: totalMovimientos,
                año: id_anio_legal
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. OBTENER MOVIMIENTOS POR TIPO
    getByTipo: async (req, res) => {
        try {
            const { tipo } = req.params;
            const { id_anio_legal } = req.query;

            const tiposValidos = ['CREACION', 'ELIMINACION', 'ASIGNACION', 'DESASIGNACION', 'TRASLADO'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    message: `Tipo de movimiento inválido. Válidos: ${tiposValidos.join(', ')}`
                });
            }

            if (!id_anio_legal) {
                return res.status(400).json({
                    message: 'El parámetro id_anio_legal es requerido'
                });
            }

            const data = await MovimientoCargoModel.getByAnio(id_anio_legal, tipo);

            res.json({
                data,
                total: data.length,
                tipo_movimiento: tipo,
                año: id_anio_legal
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 7. REGISTRAR CREACIÓN DE POSICIÓN (helper expuesto)
    registrarCreacion: async (req, res) => {
        try {
            const { id_posicion, id_anio_legal, motivo } = req.body;

            if (!id_posicion || !id_anio_legal) {
                return res.status(400).json({
                    message: 'id_posicion e id_anio_legal son requeridos'
                });
            }

            const usuario = req.user?.email || 'SISTEMA';

            const result = await MovimientoCargoModel.registrarCreacion(
                id_posicion,
                id_anio_legal,
                motivo,
                usuario
            );

            res.status(201).json({
                message: 'Movimiento de creación registrado exitosamente',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 8. REGISTRAR ASIGNACIÓN (helper expuesto)
    registrarAsignacion: async (req, res) => {
        try {
            const { id_posicion, id_funcionario, id_anio_legal, motivo } = req.body;

            if (!id_posicion || !id_funcionario || !id_anio_legal) {
                return res.status(400).json({
                    message: 'id_posicion, id_funcionario e id_anio_legal son requeridos'
                });
            }

            const usuario = req.user?.email || 'SISTEMA';

            const result = await MovimientoCargoModel.registrarAsignacion(
                id_posicion,
                id_funcionario,
                id_anio_legal,
                motivo,
                usuario
            );

            res.status(201).json({
                message: 'Movimiento de asignación registrado exitosamente',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 9. REGISTRAR DESASIGNACIÓN (helper expuesto)
    registrarDesasignacion: async (req, res) => {
        try {
            const { id_posicion, id_funcionario, id_anio_legal, motivo } = req.body;

            if (!id_posicion || !id_funcionario || !id_anio_legal) {
                return res.status(400).json({
                    message: 'id_posicion, id_funcionario e id_anio_legal son requeridos'
                });
            }

            const usuario = req.user?.email || 'SISTEMA';

            const result = await MovimientoCargoModel.registrarDesasignacion(
                id_posicion,
                id_funcionario,
                id_anio_legal,
                motivo,
                usuario
            );

            res.status(201).json({
                message: 'Movimiento de desasignación registrado exitosamente',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 10. REGISTRAR TRASLADO (helper expuesto)
    registrarTraslado: async (req, res) => {
        try {
            const {
                id_posicion_origen,
                id_posicion_destino,
                id_funcionario,
                id_anio_legal,
                motivo
            } = req.body;

            if (!id_posicion_origen || !id_posicion_destino || !id_funcionario || !id_anio_legal) {
                return res.status(400).json({
                    message: 'id_posicion_origen, id_posicion_destino, id_funcionario e id_anio_legal son requeridos'
                });
            }

            const usuario = req.user?.email || 'SISTEMA';

            await MovimientoCargoModel.registrarTraslado(
                id_posicion_origen,
                id_posicion_destino,
                id_funcionario,
                id_anio_legal,
                motivo,
                usuario
            );

            res.status(201).json({
                message: 'Movimiento de traslado registrado exitosamente',
                data: {
                    id_posicion_origen,
                    id_posicion_destino,
                    id_funcionario,
                    id_anio_legal,
                    motivo,
                    usuario
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 11. REGISTRAR ELIMINACIÓN (helper expuesto)
    registrarEliminacion: async (req, res) => {
        try {
            const { id_posicion, id_anio_legal, motivo } = req.body;

            if (!id_posicion || !id_anio_legal) {
                return res.status(400).json({
                    message: 'id_posicion e id_anio_legal son requeridos'
                });
            }

            const usuario = req.user?.email || 'SISTEMA';

            const result = await MovimientoCargoModel.registrarEliminacion(
                id_posicion,
                id_anio_legal,
                motivo,
                usuario
            );

            res.status(201).json({
                message: 'Movimiento de eliminación registrado exitosamente',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 12. OBTENER HISTORIAL COMPLETO DE UNA POSICIÓN
    getHistorialPosicion: async (req, res) => {
        try {
            const { id_posicion } = req.params;

            const posicion = await PosicionCargoModel.getById(id_posicion);
            if (!posicion) {
                return res.status(404).json({
                    message: 'Posición no encontrada'
                });
            }

            const movimientos = await MovimientoCargoModel.getByPosicion(id_posicion);

            // Enriquecer con información adicional
            const historial = {
                posicion: {
                    id: posicion.id_posicion,
                    codigo: posicion.codigo_posicion,
                    cargo: posicion.nombre_cargo,
                    departamento: posicion.nombre_departamento
                },
                total_movimientos: movimientos.length,
                movimientos: movimientos,
                linea_tiempo: movimientos.map(m => ({
                    fecha: m.fecha_movimiento,
                    tipo: m.tipo_movimiento,
                    funcionario: m.nombre_funcionario,
                    motivo: m.motivo
                }))
            };

            res.json({ data: historial });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 13. OBTENER HISTORIAL COMPLETO DE UN FUNCIONARIO
    getHistorialFuncionario: async (req, res) => {
        try {
            const { id_funcionario } = req.params;

            const funcionario = await FuncionarioModel.getById(id_funcionario);
            if (!funcionario) {
                return res.status(404).json({
                    message: 'Funcionario no encontrado'
                });
            }

            const movimientos = await MovimientoCargoModel.getByFuncionario(id_funcionario);

            // Enriquecer con información adicional
            const historial = {
                funcionario: {
                    id: funcionario.id_funcionario,
                    nombres: funcionario.nombres,
                    apellidos: funcionario.apellidos,
                    documento: `${funcionario.tipo_documento} ${funcionario.numero_documento}`
                },
                total_movimientos: movimientos.length,
                movimientos: movimientos,
                linea_tiempo: movimientos.map(m => ({
                    fecha: m.fecha_movimiento,
                    tipo: m.tipo_movimiento,
                    posicion: m.codigo_posicion,
                    cargo: m.nombre_cargo,
                    motivo: m.motivo
                }))
            };

            res.json({ data: historial });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 14. OBTENER ESTADÍSTICAS GLOBALES
    getEstadisticasGlobales: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            const resumen = await MovimientoCargoModel.getResumenByAnio(id_anio_legal);

            // Obtener movimientos por mes
            const [movimientosPorMes] = await pool.query(`
                SELECT 
                    MONTH(fecha_movimiento) as mes,
                    tipo_movimiento,
                    COUNT(*) as cantidad
                FROM movimientos_cargo
                WHERE id_anio_legal = ?
                GROUP BY MONTH(fecha_movimiento), tipo_movimiento
                ORDER BY mes ASC
            `, [id_anio_legal]);

            // Obtener top de posiciones con más movimientos
            const [topPosiciones] = await pool.query(`
                SELECT 
                    pc.codigo_posicion,
                    cb.nombre_cargo,
                    COUNT(*) as total_movimientos
                FROM movimientos_cargo mc
                INNER JOIN posiciones_cargo pc ON mc.id_posicion = pc.id_posicion
                INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
                WHERE mc.id_anio_legal = ?
                GROUP BY mc.id_posicion
                ORDER BY total_movimientos DESC
                LIMIT 10
            `, [id_anio_legal]);

            res.json({
                data: {
                    resumen_por_tipo: resumen,
                    movimientos_por_mes: movimientosPorMes,
                    top_posiciones_mas_movidas: topPosiciones,
                    total_movimientos: resumen.reduce((acc, item) => acc + item.cantidad, 0)
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = movimientoCargoController;