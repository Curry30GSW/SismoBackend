const DepartamentoModel = require('../models/DepartamentosModel');

const DepartamentoController = {

    getAll: async (req, res) => {
        try {
            const departamentos = await DepartamentoModel.findAll();
            res.json({ success: true, data: departamentos });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getActivos: async (req, res) => {
        try {
            const departamentos = await DepartamentoModel.findActivos();
            res.json({ success: true, data: departamentos });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const departamento = await DepartamentoModel.findById(req.params.id);

            if (!departamento) {
                return res.status(404).json({
                    success: false,
                    message: 'Departamento no encontrado'
                });
            }

            res.json({ success: true, data: departamento });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const { ext, departamento } = req.body;

            if (!ext || !departamento) {
                return res.status(400).json({
                    success: false,
                    message: 'EXT y Departamento son obligatorios'
                });
            }

            // Validar EXT única
            const existente = await DepartamentoModel.findByExt(ext);
            if (existente) {
                return res.status(409).json({
                    success: false,
                    message: 'La EXT ya está registrada'
                });
            }

            const result = await DepartamentoModel.create({ ext, departamento });

            res.status(201).json({
                success: true,
                message: 'Departamento creado correctamente',
                id_departamento: result.insertId
            });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const { codigo_ext, nombre_departamento, activo } = req.body;
            const id = req.params.id;

            if (!codigo_ext || !nombre_departamento) {
                return res.status(400).json({
                    success: false,
                    message: 'Ext y Departamento son obligatorios'
                });
            }

            const result = await DepartamentoModel.update(id, { codigo_ext, nombre_departamento, activo: activo !== undefined ? activo : true });

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Departamento no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Departamento actualizado correctamente'
            });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const result = await DepartamentoModel.delete(req.params.id);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Departamento no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Departamento eliminado correctamente'
            });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = DepartamentoController;
