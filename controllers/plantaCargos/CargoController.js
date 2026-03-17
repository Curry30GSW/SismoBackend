const CargoModel = require('../../models/plantaCargos/CargoModel');

const CargoController = {

    create: async (req, res) => {
        try {
            const result = await CargoModel.create(req.body);
            res.status(201).json({
                message: 'Cargo creado correctamente',
                id: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const cargos = await CargoModel.findAll();
            res.json(cargos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const cargo = await CargoModel.findById(req.params.id);
            if (!cargo) {
                return res.status(404).json({ message: 'Cargo no encontrado' });
            }
            res.json(cargo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            await CargoModel.update(req.params.id, req.body);
            res.json({ message: 'Cargo actualizado correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await CargoModel.delete(req.params.id);
            res.json({ message: 'Cargo eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = CargoController;
