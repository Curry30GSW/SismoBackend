const PensionesModel = require('../../models/Contratos/PensionesModel');

const pensionesController = {
    create: async (req, res) => {
        try {
            const { codigo_pension, nit_pension, nombre_pension, nombre_aporte, activo } = req.body;

            if (!codigo_pension) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de la pensión es requerido'
                });
            }

            if (!nombre_pension) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la pensión es requerido'
                });
            }

            // Verificar si ya existe el código
            const existente = await PensionesModel.getByCodigo(codigo_pension);
            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe un fondo con el código ${codigo_pension}`
                });
            }

            const result = await PensionesModel.create({
                codigo_pension,
                nit_pension,
                nombre_pension,
                nombre_aporte,
                activo
            });

            res.status(201).json({
                success: true,
                message: 'Fondo de pensiones creado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create Pensiones:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const { activo } = req.query;
            const filterActivo = activo !== undefined ? activo === 'true' : true;

            const pensiones = await PensionesModel.getAll(filterActivo);

            res.json({
                success: true,
                data: pensiones,
                total: pensiones.length
            });

        } catch (error) {
            console.error('Error en getAll Pensiones:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const pension = await PensionesModel.getById(id);

            if (!pension) {
                return res.status(404).json({
                    success: false,
                    message: 'Fondo de pensiones no encontrado'
                });
            }

            res.json({
                success: true,
                data: pension
            });

        } catch (error) {
            console.error('Error en getById Pensiones:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getByCodigo: async (req, res) => {
        try {
            const { codigo } = req.params;

            const pension = await PensionesModel.getByCodigo(codigo);

            if (!pension) {
                return res.status(404).json({
                    success: false,
                    message: `Fondo con código ${codigo} no encontrado`
                });
            }

            res.json({
                success: true,
                data: pension
            });

        } catch (error) {
            console.error('Error en getByCodigo Pensiones:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { codigo_pension, nit_pension, nombre_pension, nombre_aporte, activo } = req.body;

            const pensionExistente = await PensionesModel.getById(id);
            if (!pensionExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Fondo de pensiones no encontrado'
                });
            }

            // Verificar si el código nuevo ya existe (y no es el mismo)
            if (codigo_pension && codigo_pension !== pensionExistente.codigo_pension) {
                const existeCodigo = await PensionesModel.getByCodigo(codigo_pension);
                if (existeCodigo) {
                    return res.status(400).json({
                        success: false,
                        message: `Ya existe un fondo con el código ${codigo_pension}`
                    });
                }
            }

            await PensionesModel.update(id, {
                codigo_pension,
                nit_pension,
                nombre_pension,
                nombre_aporte,
                activo
            });

            res.json({
                success: true,
                message: 'Fondo de pensiones actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error en update Pensiones:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const pensionExistente = await PensionesModel.getById(id);
            if (!pensionExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Fondo de pensiones no encontrado'
                });
            }

            await PensionesModel.delete(id);

            res.json({
                success: true,
                message: 'Fondo de pensiones desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error en delete Pensiones:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = pensionesController;