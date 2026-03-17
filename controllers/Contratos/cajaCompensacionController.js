const CajaCompensacionModel = require('../../models/Contratos/CajaCompensacionModel');

const cajaCompensacionController = {
    create: async (req, res) => {
        try {
            const { codigo_caja, nombre_caja, activo } = req.body;

            if (!codigo_caja) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de la caja es requerido'
                });
            }

            if (!nombre_caja) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la caja es requerido'
                });
            }

            const existente = await CajaCompensacionModel.getByCodigo(codigo_caja);
            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una caja con el código ${codigo_caja}`
                });
            }

            const result = await CajaCompensacionModel.create({ codigo_caja, nombre_caja, activo });

            res.status(201).json({
                success: true,
                message: 'Caja de compensación creada exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create CajaCompensacion:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const cajas = await CajaCompensacionModel.getAll();

            res.json({
                success: true,
                data: cajas,
                total: cajas.length
            });

        } catch (error) {
            console.error('Error en getAll CajaCompensacion:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const caja = await CajaCompensacionModel.getById(id);

            if (!caja) {
                return res.status(404).json({
                    success: false,
                    message: 'Caja de compensación no encontrada'
                });
            }

            res.json({
                success: true,
                data: caja
            });

        } catch (error) {
            console.error('Error en getById CajaCompensacion:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getByCodigo: async (req, res) => {
        try {
            const { codigo } = req.params;

            const caja = await CajaCompensacionModel.getByCodigo(codigo);

            if (!caja) {
                return res.status(404).json({
                    success: false,
                    message: `Caja con código ${codigo} no encontrada`
                });
            }

            res.json({
                success: true,
                data: caja
            });

        } catch (error) {
            console.error('Error en getByCodigo CajaCompensacion:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { codigo_caja, nombre_caja, activo } = req.body;

            const cajaExistente = await CajaCompensacionModel.getById(id);
            if (!cajaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Caja de compensación no encontrada'
                });
            }

            // Verificar si el código nuevo ya existe (y no es el mismo)
            if (codigo_caja && codigo_caja !== cajaExistente.codigo_caja) {
                const existeCodigo = await CajaCompensacionModel.getByCodigo(codigo_caja);
                if (existeCodigo) {
                    return res.status(400).json({
                        success: false,
                        message: `Ya existe una caja con el código ${codigo_caja}`
                    });
                }
            }

            await CajaCompensacionModel.update(id, { codigo_caja, nombre_caja, activo });

            res.json({
                success: true,
                message: 'Caja de compensación actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error en update CajaCompensacion:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const cajaExistente = await CajaCompensacionModel.getById(id);
            if (!cajaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Caja de compensación no encontrada'
                });
            }

            await CajaCompensacionModel.delete(id);

            res.json({
                success: true,
                message: 'Caja de compensación desactivada exitosamente'
            });

        } catch (error) {
            console.error('Error en delete CajaCompensacion:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = cajaCompensacionController;