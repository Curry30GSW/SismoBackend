const TipoPlantaModel = require('../models/TipoPlantaModel');

const tipoPlantaController = {
    // Obtener todos los tipos
    getAll: async (req, res) => {
        try {
            const { activo } = req.query;
            const filtroActivo = activo !== undefined ? activo === 'true' : true;

            const tipos = await TipoPlantaModel.getAll(filtroActivo);

            res.json({
                success: true,
                data: tipos,
                total: tipos.length
            });
        } catch (error) {
            console.error('Error en getAll tipos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Obtener tipo por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const tipo = await TipoPlantaModel.getById(id);

            if (!tipo) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de planta no encontrado'
                });
            }

            res.json({
                success: true,
                data: tipo
            });
        } catch (error) {
            console.error('Error en getById tipo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Crear tipo
    create: async (req, res) => {
        try {
            const { codigo_tipo, nombre_tipo, descripcion, color_representacion, activo } = req.body;

            if (!codigo_tipo || !nombre_tipo) {
                return res.status(400).json({
                    success: false,
                    message: 'Código y nombre del tipo son requeridos'
                });
            }

            const existente = await TipoPlantaModel.getByCodigo(codigo_tipo);
            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un tipo con este código'
                });
            }

            const result = await TipoPlantaModel.create({
                codigo_tipo,
                nombre_tipo,
                descripcion,
                color_representacion,
                activo
            });

            res.status(201).json({
                success: true,
                message: 'Tipo de planta creado exitosamente',
                data: result
            });
        } catch (error) {
            console.error('Error en create tipo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Actualizar tipo
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const existente = await TipoPlantaModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de planta no encontrado'
                });
            }

            const result = await TipoPlantaModel.update(id, data);

            res.json({
                success: true,
                message: 'Tipo de planta actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error en update tipo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Eliminar (soft delete)
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const existente = await TipoPlantaModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: 'Tipo de planta no encontrado'
                });
            }

            await TipoPlantaModel.delete(id);

            res.json({
                success: true,
                message: 'Tipo de planta desactivado exitosamente'
            });
        } catch (error) {
            console.error('Error en delete tipo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Obtener con estadísticas
    getWithStats: async (req, res) => {
        try {
            const tipos = await TipoPlantaModel.getWithStats();

            res.json({
                success: true,
                data: tipos
            });
        } catch (error) {
            console.error('Error en getWithStats:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = tipoPlantaController;