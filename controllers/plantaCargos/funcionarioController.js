const FuncionarioModel = require('../../models/plantaCargos/FuncionarioModel');
const MovimientoCargoModel = require('../../models/plantaCargos/MovimientoCargoModel');
const PosicionCargoModel = require('../../models/plantaCargos/PosicionCargoModel');

const funcionarioController = {
    // Contratar funcionario
    hire: async (req, res) => {
        try {
            const data = req.body;

            // Crear funcionario y asignar a posición
            const funcionario = await FuncionarioModel.create(data);

            // Obtener información de la posición para el año legal
            const posicion = await PosicionCargoModel.getById(data.id_posicion);

            // Registrar movimiento
            await MovimientoCargoModel.registrarAsignacion(
                data.id_posicion,
                funcionario.id_funcionario,
                posicion.id_anio_legal,
                data.motivo || 'Contratación',
                req.user?.email || 'SISTEMA'
            );

            res.status(201).json({
                message: 'Funcionario contratado exitosamente',
                data: funcionario
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error al contratar funcionario',
                error: error.message
            });
        }
    },

    // Retirar funcionario
    retire: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_retiro, motivo } = req.body;

            // Retirar funcionario
            const result = await FuncionarioModel.retire(id, fecha_retiro);

            // Obtener posición para el año legal
            const posicion = await PosicionCargoModel.getById(result.id_posicion_liberada);

            // Registrar movimiento
            await MovimientoCargoModel.registrarDesasignacion(
                result.id_posicion_liberada,
                id,
                posicion.id_anio_legal,
                motivo || 'Retiro voluntario',
                req.user?.email || 'SISTEMA'
            );

            res.json({
                message: 'Funcionario retirado exitosamente',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error al retirar funcionario',
                error: error.message
            });
        }
    },

    // Trasladar funcionario
    transfer: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_nueva_posicion, fecha_traslado, motivo } = req.body;

            // Trasladar funcionario
            const result = await FuncionarioModel.transfer(
                id,
                id_nueva_posicion,
                fecha_traslado
            );

            // Obtener año legal de la nueva posición
            const posicionDestino = await PosicionCargoModel.getById(id_nueva_posicion);

            // Registrar movimientos de traslado
            await MovimientoCargoModel.registrarTraslado(
                result.id_posicion_origen,
                result.id_posicion_destino,
                id,
                posicionDestino.id_anio_legal,
                motivo || 'Traslado',
                req.user?.email || 'SISTEMA'
            );

            res.json({
                message: 'Funcionario trasladado exitosamente',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error al trasladar funcionario',
                error: error.message
            });
        }
    },

    getByDocumento: async (req, res) => {
        try {
            const { tipo, numero } = req.params;

            if (!tipo || !numero) {
                return res.status(400).json({
                    success: false,
                    message: 'El tipo y número de documento son requeridos'
                });
            }

            const funcionario = await FuncionarioModel.getByDocumento(tipo, numero);

            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Funcionario encontrado',
                data: funcionario
            });

        } catch (error) {
            console.error('Error en getByDocumento:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // OBTENER FUNCIONARIO POR ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const funcionario = await FuncionarioModel.getById(id);

            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            res.json({
                success: true,
                data: funcionario
            });

        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // OBTENER TODOS LOS FUNCIONARIOS
    getAll: async (req, res) => {
        try {
            const { activo, con_cargo, id_cargo_base, id_departamento, id_anio_legal } = req.query;

            // Validar que el año sea obligatorio
            if (!id_anio_legal) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del año legal es requerido'
                });
            }

            const filtros = {
                id_anio_legal: parseInt(id_anio_legal),
                activo: activo !== undefined ? activo === 'true' : undefined,
                con_cargo: con_cargo !== undefined ? con_cargo === 'true' : undefined,
                id_cargo_base: id_cargo_base ? parseInt(id_cargo_base) : undefined,
                id_departamento: id_departamento ? parseInt(id_departamento) : undefined
            };

            const funcionarios = await FuncionarioModel.getAll(filtros);

            res.json({
                success: true,
                data: funcionarios,
                total: funcionarios.length
            });

        } catch (error) {
            console.error('Error en getAll:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // DESACTIVAR FUNCIONARIO
    deactivate: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_retiro } = req.body;

            const existente = await FuncionarioModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            await FuncionarioModel.deactivate(id, fecha_retiro);

            res.json({
                success: true,
                message: 'Funcionario desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error en deactivate:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    create: async (req, res) => {
        try {
            const data = req.body;

            // Validaciones básicas
            if (!data.tipo_documento || !data.numero_documento || !data.nombres || !data.apellidos) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo documento, número documento, nombres y apellidos son requeridos'
                });
            }

            // Validar formato del documento según tipo
            if (!data.numero_documento.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El número de documento es requerido'
                });
            }

            // Crear funcionario
            const result = await FuncionarioModel.create(data);

            res.status(201).json({
                success: true,
                message: 'Funcionario creado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create:', error);

            // Manejar error específico de documento duplicado
            if (error.message.includes('Ya existe un funcionario')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear funcionario'
            });
        }
    },

    getHistorialPosiciones: async (req, res) => {
        try {
            const { id } = req.params;

            // Validar que el ID sea válido
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de funcionario inválido'
                });
            }

            // Verificar que el funcionario existe
            const funcionario = await FuncionarioModel.getById(id);
            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            // Obtener historial de posiciones
            const historial = await FuncionarioModel.getHistorialPosiciones(id);

            res.json({
                success: true,
                message: 'Historial obtenido exitosamente',
                data: historial,
                total: historial.length
            });

        } catch (error) {
            console.error('Error en getHistorialPosiciones:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener historial de posiciones'
            });
        }
    },

    getAllActivosOnlyFuncionarios: async (req, res) => {
        try {
            const funcionarios = await FuncionarioModel.getAllActivosOnlyFuncionarios();

            res.status(200).json({
                ok: true,
                data: funcionarios
            });

        } catch (error) {
            console.error('Error al obtener funcionarios activos:', error);

            res.status(500).json({
                ok: false,
                message: 'Error al obtener funcionarios activos',
                error: error.message
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            // Validar que el ID sea válido
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de funcionario inválido'
                });
            }

            // Verificar que el funcionario existe
            const existente = await FuncionarioModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            // Validaciones básicas
            if (!data.tipo_documento || !data.numero_documento || !data.nombres || !data.apellidos) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo documento, número documento, nombres y apellidos son requeridos'
                });
            }

            if (!data.numero_documento.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El número de documento es requerido'
                });
            }

            // Actualizar funcionario
            const result = await FuncionarioModel.update(id, data);

            res.json({
                success: true,
                message: 'Funcionario actualizado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en update:', error);

            if (error.message.includes('Ya existe otro funcionario')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar funcionario'
            });
        }
    },

};

module.exports = funcionarioController;