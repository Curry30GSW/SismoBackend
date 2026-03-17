const NivelRiesgoModel = require('../../models/Contratos/NivelRiesgoModel');

const nivelRiesgoController = {
    // =============================================
    // CREATE
    // =============================================
    create: async (req, res) => {
        try {
            const { id_arl, clase_riesgo, tarifa, actividades, activo } = req.body;

            if (!id_arl) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID de la ARL es requerido'
                });
            }

            if (!clase_riesgo) {
                return res.status(400).json({
                    success: false,
                    message: 'La clase de riesgo es requerida'
                });
            }

            if (!tarifa) {
                return res.status(400).json({
                    success: false,
                    message: 'La tarifa es requerida'
                });
            }

            const result = await NivelRiesgoModel.create({
                id_arl,
                clase_riesgo,
                tarifa,
                actividades,
                activo
            });

            res.status(201).json({
                success: true,
                message: 'Nivel de riesgo creado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create NivelRiesgo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // =============================================
    // READ
    // =============================================
    getAll: async (req, res) => {
        try {
            const { activo } = req.query;
            const filterActivo = activo !== undefined ? activo === 'true' : true;

            const niveles = await NivelRiesgoModel.getAll(filterActivo);

            res.json({
                success: true,
                data: niveles,
                total: niveles.length
            });

        } catch (error) {
            console.error('Error en getAll NivelRiesgo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

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

            res.json({
                success: true,
                data: nivel
            });

        } catch (error) {
            console.error('Error en getById NivelRiesgo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getByArl: async (req, res) => {
        try {
            const { id_arl } = req.params;

            const niveles = await NivelRiesgoModel.getByArl(id_arl);

            res.json({
                success: true,
                data: niveles,
                total: niveles.length
            });

        } catch (error) {
            console.error('Error en getByArl NivelRiesgo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // =============================================
    // UPDATE
    // =============================================
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_arl, clase_riesgo, tarifa, actividades, activo } = req.body;

            const nivelExistente = await NivelRiesgoModel.getById(id);
            if (!nivelExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Nivel de riesgo no encontrado'
                });
            }

            await NivelRiesgoModel.update(id, {
                id_arl,
                clase_riesgo,
                tarifa,
                actividades,
                activo
            });

            res.json({
                success: true,
                message: 'Nivel de riesgo actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error en update NivelRiesgo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // =============================================
    // DELETE (SOFT DELETE)
    // =============================================
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const nivelExistente = await NivelRiesgoModel.getById(id);
            if (!nivelExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Nivel de riesgo no encontrado'
                });
            }

            await NivelRiesgoModel.delete(id);

            res.json({
                success: true,
                message: 'Nivel de riesgo desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error en delete NivelRiesgo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = nivelRiesgoController;