const FirmanteModel = require('../../models/contratos/FirmanteModel');

const firmanteController = {
    listar: async (req, res) => {
        try {
            const firmantes = await FirmanteModel.listar();
            res.json({ success: true, data: firmantes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    obtenerActivo: async (req, res) => {
        try {
            const { tipo } = req.params;
            const firmante = await FirmanteModel.obtenerActivo(tipo);
            if (!firmante) return res.status(404).json({ success: false, message: 'No hay firmante activo para este tipo' });
            res.json({ success: true, data: firmante });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    crear: async (req, res) => {
        try {
            const { tipo_firma, nombre_firma, cargo_firma, activo_desde_creacion } = req.body;
            if (!tipo_firma || !nombre_firma || !cargo_firma) {
                return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
            }
            const nuevo = await FirmanteModel.crear({ tipo_firma, nombre_firma, cargo_firma, activo_desde_creacion, usuario_creacion: req.body.usuario_creacion });
            res.json({ success: true, data: nuevo, message: 'Firmante creado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre_firma, cargo_firma } = req.body;
            await FirmanteModel.actualizar(id, { nombre_firma, cargo_firma });
            res.json({ success: true, message: 'Firmante actualizado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    activar: async (req, res) => {
        try {
            const { id } = req.params;
            await FirmanteModel.activar(id);
            res.json({ success: true, message: 'Firmante activado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            await FirmanteModel.eliminar(id);
            res.json({ success: true, message: 'Firmante desactivado exitosamente' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
module.exports = firmanteController;