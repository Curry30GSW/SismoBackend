const CesantiasModel = require('../../models/Contratos/CesantiasModel');

const cesantiasController = {
    create: async (req, res) => {
        try {
            const { codigo_cesantia, nit, nombre_cesantia, nombre_aporte, activo } = req.body;

            if (!codigo_cesantia) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de cesantías es requerido'
                });
            }

            if (!nombre_cesantia) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la cesantía es requerido'
                });
            }

            // Verificar si ya existe el código
            const existente = await CesantiasModel.getByCodigo(codigo_cesantia);
            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe un fondo con el código ${codigo_cesantia}`
                });
            }

            const result = await CesantiasModel.create({
                codigo_cesantia,
                nit,
                nombre_cesantia,
                nombre_aporte,
                activo
            });

            res.status(201).json({
                success: true,
                message: 'Fondo de cesantías creado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create Cesantias:', error);
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

            const cesantias = await CesantiasModel.getAll(filterActivo);

            res.json({
                success: true,
                data: cesantias,
                total: cesantias.length
            });

        } catch (error) {
            console.error('Error en getAll Cesantias:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const cesantia = await CesantiasModel.getById(id);

            if (!cesantia) {
                return res.status(404).json({
                    success: false,
                    message: 'Fondo de cesantías no encontrado'
                });
            }

            res.json({
                success: true,
                data: cesantia
            });

        } catch (error) {
            console.error('Error en getById Cesantias:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getByCodigo: async (req, res) => {
        try {
            const { codigo } = req.params;

            const cesantia = await CesantiasModel.getByCodigo(codigo);

            if (!cesantia) {
                return res.status(404).json({
                    success: false,
                    message: `Fondo con código ${codigo} no encontrado`
                });
            }

            res.json({
                success: true,
                data: cesantia
            });

        } catch (error) {
            console.error('Error en getByCodigo Cesantias:', error);
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
            const { codigo_cesantia, nit, nombre_cesantia, nombre_aporte, activo } = req.body;

            const cesantiaExistente = await CesantiasModel.getById(id);
            if (!cesantiaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Fondo de cesantías no encontrado'
                });
            }

            // Verificar si el código nuevo ya existe (y no es el mismo)
            if (codigo_cesantia && codigo_cesantia !== cesantiaExistente.codigo_cesantia) {
                const existeCodigo = await CesantiasModel.getByCodigo(codigo_cesantia);
                if (existeCodigo) {
                    return res.status(400).json({
                        success: false,
                        message: `Ya existe un fondo con el código ${codigo_cesantia}`
                    });
                }
            }

            await CesantiasModel.update(id, {
                codigo_cesantia,
                nit,
                nombre_cesantia,
                nombre_aporte,
                activo
            });

            res.json({
                success: true,
                message: 'Fondo de cesantías actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error en update Cesantias:', error);
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

            const cesantiaExistente = await CesantiasModel.getById(id);
            if (!cesantiaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Fondo de cesantías no encontrado'
                });
            }

            await CesantiasModel.delete(id);

            res.json({
                success: true,
                message: 'Fondo de cesantías desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error en delete Cesantias:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = cesantiasController;