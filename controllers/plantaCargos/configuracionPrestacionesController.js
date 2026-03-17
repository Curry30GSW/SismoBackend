const ConfiguracionPrestacionesModel = require('../../models/plantaCargos/ConfiguracionPrestacionesModel');

const configuracionPrestacionesController = {
    // Obtener todas las prestaciones
    getAll: async (req, res) => {
        try {
            const prestaciones = await ConfiguracionPrestacionesModel.getAll();
            res.json({
                success: true,
                data: prestaciones
            });
        } catch (error) {
            console.error('Error al obtener prestaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener configuración de prestaciones',
                error: error.message
            });
        }
    },

    // Obtener una prestación por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const prestacion = await ConfiguracionPrestacionesModel.getById(id);

            if (!prestacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Prestación no encontrada'
                });
            }

            res.json({
                success: true,
                data: prestacion
            });
        } catch (error) {
            console.error('Error al obtener prestación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener prestación',
                error: error.message
            });
        }
    },

    // Crear nueva prestación
    create: async (req, res) => {
        try {
            const { nombre_prestacion, porcentaje, descripcion } = req.body;

            if (!nombre_prestacion || !porcentaje) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y porcentaje son obligatorios'
                });
            }

            const result = await ConfiguracionPrestacionesModel.create({
                nombre_prestacion,
                porcentaje,
                descripcion
            });

            res.status(201).json({
                success: true,
                message: 'Prestación creada exitosamente',
                data: result
            });
        } catch (error) {
            console.error('Error al crear prestación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear prestación',
                error: error.message
            });
        }
    },

    // Actualizar prestación
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre_prestacion, porcentaje, descripcion, activo } = req.body;

            const prestacion = await ConfiguracionPrestacionesModel.getById(id);
            if (!prestacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Prestación no encontrada'
                });
            }

            await ConfiguracionPrestacionesModel.update(id, {
                nombre_prestacion,
                porcentaje,
                descripcion,
                activo
            });

            res.json({
                success: true,
                message: 'Prestación actualizada exitosamente'
            });
        } catch (error) {
            console.error('Error al actualizar prestación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar prestación',
                error: error.message
            });
        }
    },

    // Eliminar prestación
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const prestacion = await ConfiguracionPrestacionesModel.getById(id);
            if (!prestacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Prestación no encontrada'
                });
            }

            await ConfiguracionPrestacionesModel.delete(id);

            res.json({
                success: true,
                message: 'Prestación eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar prestación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar prestación',
                error: error.message
            });
        }
    }
};

module.exports = configuracionPrestacionesController;