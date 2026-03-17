const EpsModel = require('../../models/Contratos/EpsModel');

const epsController = {
    create: async (req, res) => {
        try {
            const { codigo_eps, nit, nombre_eps, nombre_aporte, activo } = req.body;

            if (!codigo_eps) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de la EPS es requerido'
                });
            }

            if (!nombre_eps) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la EPS es requerido'
                });
            }

            // Verificar si ya existe el código
            const existente = await EpsModel.getByCodigo(codigo_eps);
            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una EPS con el código ${codigo_eps}`
                });
            }

            const result = await EpsModel.create({
                codigo_eps,
                nit,
                nombre_eps,
                nombre_aporte,
                activo
            });

            res.status(201).json({
                success: true,
                message: 'EPS creada exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create EPS:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {

            const epsList = await EpsModel.getAll();

            res.json({
                success: true,
                data: epsList,
                total: epsList.length
            });

        } catch (error) {
            console.error('Error en getAll EPS:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const eps = await EpsModel.getById(id);

            if (!eps) {
                return res.status(404).json({
                    success: false,
                    message: 'EPS no encontrada'
                });
            }

            res.json({
                success: true,
                data: eps
            });

        } catch (error) {
            console.error('Error en getById EPS:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getByCodigo: async (req, res) => {
        try {
            const { codigo } = req.params;

            const eps = await EpsModel.getByCodigo(codigo);

            if (!eps) {
                return res.status(404).json({
                    success: false,
                    message: `EPS con código ${codigo} no encontrada`
                });
            }

            res.json({
                success: true,
                data: eps
            });

        } catch (error) {
            console.error('Error en getByCodigo EPS:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { codigo_eps, nit, nombre_eps, nombre_aporte, activo } = req.body;

            const epsExistente = await EpsModel.getById(id);
            if (!epsExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'EPS no encontrada'
                });
            }

            // Verificar si el código nuevo ya existe (y no es el mismo)
            if (codigo_eps && codigo_eps !== epsExistente.codigo_eps) {
                const existeCodigo = await EpsModel.getByCodigo(codigo_eps);
                if (existeCodigo) {
                    return res.status(400).json({
                        success: false,
                        message: `Ya existe una EPS con el código ${codigo_eps}`
                    });
                }
            }

            await EpsModel.update(id, {
                codigo_eps,
                nit,
                nombre_eps,
                nombre_aporte,
                activo
            });

            res.json({
                success: true,
                message: 'EPS actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error en update EPS:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const epsExistente = await EpsModel.getById(id);
            if (!epsExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'EPS no encontrada'
                });
            }

            await EpsModel.delete(id);

            res.json({
                success: true,
                message: 'EPS desactivada exitosamente'
            });

        } catch (error) {
            console.error('Error en delete EPS:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = epsController;