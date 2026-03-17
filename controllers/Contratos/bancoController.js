const BancoModel = require('../../models/Contratos/BancoModel');

const bancoController = {
    create: async (req, res) => {
        try {
            const { nombre_banco, activo } = req.body;

            if (!nombre_banco) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del banco es requerido'
                });
            }

            const result = await BancoModel.create({ nombre_banco, activo });

            res.status(201).json({
                success: true,
                message: 'Banco creado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create Banco:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const bancos = await BancoModel.getAll();

            res.json({
                success: true,
                data: bancos,
                total: bancos.length
            });

        } catch (error) {
            console.error('Error en getAll Bancos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const banco = await BancoModel.getById(id);

            if (!banco) {
                return res.status(404).json({
                    success: false,
                    message: 'Banco no encontrado'
                });
            }

            res.json({
                success: true,
                data: banco
            });

        } catch (error) {
            console.error('Error en getById Banco:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre_banco, activo } = req.body;

            const bancoExistente = await BancoModel.getById(id);
            if (!bancoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Banco no encontrado'
                });
            }

            await BancoModel.update(id, { nombre_banco, activo });

            res.json({
                success: true,
                message: 'Banco actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error en update Banco:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const bancoExistente = await BancoModel.getById(id);
            if (!bancoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Banco no encontrado'
                });
            }

            await BancoModel.delete(id);

            res.json({
                success: true,
                message: 'Banco desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error en delete Banco:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = bancoController;