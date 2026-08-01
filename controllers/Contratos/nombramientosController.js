// controllers/NombramientoController.js
const NombramientoModel = require('../../models/Contratos/NombramientosModel');
const ContratoModel = require('../../models/Contratos/ContratoModel');

const NombramientoController = {
    create: async (req, res) => {
        try {
            const {
                id_contrato_anterior,
                id_contrato_nuevo,
                id_posicion_nueva,
                id_posicion_anterior,
                id_funcionario,
                fecha_nombramiento,
                fecha_efectiva,
                estado,
                usuario_creacion
            } = req.body;

            // Validar campos obligatorios
            if (!id_contrato_anterior || !id_contrato_nuevo || !id_posicion_nueva) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: id_contrato_anterior, id_contrato_nuevo, id_posicion_nueva'
                });
            }

            // Verificar que los contratos existan
            const contratoAnterior = await ContratoModel.getById(id_contrato_anterior);
            if (!contratoAnterior) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato anterior no encontrado'
                });
            }

            const contratoNuevo = await ContratoModel.getById(id_contrato_nuevo);
            if (!contratoNuevo) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato nuevo no encontrado'
                });
            }

            const codigoNombramiento = await NombramientoModel.generarCodigoNombramiento();

            const result = await NombramientoModel.create({
                codigo_nombramiento: codigoNombramiento,
                id_contrato_anterior,
                id_contrato_nuevo,
                id_posicion_nueva,
                id_posicion_anterior: id_posicion_anterior || null,
                id_funcionario: id_funcionario || null,
                fecha_nombramiento: fecha_nombramiento || new Date().toISOString().split('T')[0],
                fecha_efectiva: fecha_efectiva || fecha_nombramiento || new Date().toISOString().split('T')[0],
                estado: estado || 'PENDIENTE',
                usuario_creacion: usuario_creacion || req.user?.email || 'SISTEMA'
            });

            res.status(201).json({
                success: true,
                message: 'Nombramiento registrado exitosamente',
                data: {
                    id_nombramiento: result.id_nombramiento,
                    codigo_nombramiento: codigoNombramiento
                }
            });

        } catch (error) {
            console.error('Error en create nombramiento:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const nombramiento = await NombramientoModel.getById(id);

            if (!nombramiento) {
                return res.status(404).json({
                    success: false,
                    message: 'Nombramiento no encontrado'
                });
            }

            res.json({
                success: true,
                data: nombramiento
            });
        } catch (error) {
            console.error('Error en getById nombramiento:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getByFuncionario: async (req, res) => {
        try {
            const { idFuncionario } = req.params;
            const nombramientos = await NombramientoModel.getByFuncionario(idFuncionario);

            res.json({
                success: true,
                data: nombramientos
            });
        } catch (error) {
            console.error('Error en getByFuncionario nombramientos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getPendientes: async (req, res) => {
        try {
            const pendientes = await NombramientoModel.getPendientes();
            res.json({
                success: true,
                data: pendientes
            });
        } catch (error) {
            console.error('Error en getPendientes nombramientos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    marcarEjecutado: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await NombramientoModel.marcarEjecutado(id);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Nombramiento no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Nombramiento marcado como ejecutado'
            });
        } catch (error) {
            console.error('Error en marcarEjecutado nombramiento:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const filtros = req.query;

            // Validar y convertir parámetros
            if (filtros.limite) filtros.limite = parseInt(filtros.limite);
            if (filtros.pagina) filtros.pagina = parseInt(filtros.pagina);

            // Obtener datos
            const [nombramientos, total] = await Promise.all([
                NombramientoModel.getAll(filtros),
                NombramientoModel.getCount(filtros)
            ]);

            // Construir respuesta con paginación
            const respuesta = {
                success: true,
                data: nombramientos,
                paginacion: {
                    total: total,
                    pagina: filtros.pagina || 1,
                    limite: filtros.limite || total,
                    total_paginas: filtros.limite ? Math.ceil(total / filtros.limite) : 1
                }
            };

            res.json(respuesta);
        } catch (error) {
            console.error('Error en getAll nombramientos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
};

module.exports = NombramientoController;