const NivelRiesgoModel = require('../../models/Contratos/NivelRiesgoModel');

const nivelRiesgoController = {
    // Crear nivel de riesgo
    create: async (req, res) => {
        try {
            const data = req.body;

            if (!data.clase_riesgo || !data.tarifa || !data.actividades) {
                return res.status(400).json({
                    success: false,
                    message: 'clase_riesgo, tarifa y actividades son requeridos'
                });
            }

            const result = await NivelRiesgoModel.create(data);

            res.status(201).json({
                success: true,
                message: 'Nivel de riesgo creado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create nivel riesgo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Obtener todos los niveles de riesgo
    getAll: async (req, res) => {
        try {
            const { activo } = req.query;
            const niveles = await NivelRiesgoModel.getAll(activo !== 'false');

            res.json({
                success: true,
                data: niveles,
                total: niveles.length
            });

        } catch (error) {
            console.error('Error en getAll nivel riesgo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Obtener nivel de riesgo por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const nivel = await NivelRiesgoModel.getById(id);

            if (!nivel) {
                return res.status(404).json({
                    success: false,
                    message: 'Nivel de riesgo no encontrado'
                });
            }

            res.json({ success: true, data: nivel });

        } catch (error) {
            console.error('Error en getById nivel riesgo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Actualizar nivel de riesgo
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const existente = await NivelRiesgoModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: 'Nivel de riesgo no encontrado'
                });
            }

            await NivelRiesgoModel.update(id, data);

            res.json({
                success: true,
                message: 'Nivel de riesgo actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error en update nivel riesgo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Eliminar nivel de riesgo
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const existente = await NivelRiesgoModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    success: false,
                    message: 'Nivel de riesgo no encontrado'
                });
            }

            await NivelRiesgoModel.delete(id);

            res.json({
                success: true,
                message: 'Nivel de riesgo eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error en delete nivel riesgo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = nivelRiesgoController;