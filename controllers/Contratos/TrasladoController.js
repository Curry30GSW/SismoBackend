const TrasladoModel = require('../../models/Contratos/TrasladoModel');
const FuncionarioModel = require('../../models/plantaCargos/FuncionarioModel');

// Función para generar código de traslado
generarCodigoTraslado = async () => {
    const ultimoCodigo = await TrasladoModel.obtenerUltimoCodigo();
    if (!ultimoCodigo) {
        return 'ADT-001';
    }
    const numero = parseInt(ultimoCodigo.split('-')[1]) + 1;
    return `ADT-${numero.toString().padStart(3, '0')}`;
};

const trasladoController = {
    // =============================================
    // CREATE
    // =============================================
    create: async (req, res) => {
        try {
            const data = req.body;

            // Validaciones
            if (!data.id_funcionario) {
                return res.status(400).json({ success: false, message: 'El funcionario es requerido' });
            }
            if (!data.id_departamento_destino) {
                return res.status(400).json({ success: false, message: 'El departamento destino es requerido' });
            }
            if (!data.fecha_traslado) {
                return res.status(400).json({ success: false, message: 'La fecha de traslado es requerida' });
            }

            // Validar que no sea el mismo departamento
            const funcionario = await FuncionarioModel.getById(data.id_funcionario);
            if (!funcionario) {
                return res.status(404).json({ success: false, message: 'Funcionario no encontrado' });
            }

            if (funcionario.id_departamento === data.id_departamento_destino) {
                return res.status(400).json({
                    success: false,
                    message: 'El departamento destino no puede ser el mismo que el departamento actual del funcionario'
                });
            }

            // Validar si ya tiene un traslado activo
            const tieneActivo = await TrasladoModel.tieneTrasladoActivo(data.id_funcionario);
            if (tieneActivo) {
                return res.status(400).json({
                    success: false,
                    message: 'El funcionario ya tiene un traslado activo'
                });
            }

            // Generar código
            const codigoTraslado = await generarCodigoTraslado();

            const result = await TrasladoModel.create({
                codigo_traslado: codigoTraslado,
                id_funcionario: data.id_funcionario,
                departamento_origen: data.departamento_origen || 'No especificado',
                departamento_destino: data.departamento_destino,
                fecha_traslado: data.fecha_traslado,
                fecha_fin: data.hasta_nuevo_aviso ? null : data.fecha_fin,
                hasta_nuevo_aviso: data.hasta_nuevo_aviso || false,
                motivo: data.motivo || null,
                usuario_creacion: req.user?.email || 'SISTEMA'
            });

            res.status(201).json({
                success: true,
                message: 'Traslado creado exitosamente',
                data: { id_traslado: result.id_traslado, codigo_traslado: codigoTraslado }
            });

        } catch (error) {
            console.error('Error en create traslado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =============================================
    // READ
    // =============================================
    getAll: async (req, res) => {
        try {
            const { busqueda } = req.query;
            const traslados = await TrasladoModel.getAll({ busqueda });

            res.json({
                success: true,
                data: traslados,
                total: traslados.length
            });

        } catch (error) {
            console.error('Error en getAll traslados:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const traslado = await TrasladoModel.getById(id);

            if (!traslado) {
                return res.status(404).json({ success: false, message: 'Traslado no encontrado' });
            }

            res.json({ success: true, data: traslado });

        } catch (error) {
            console.error('Error en getById traslado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getByFuncionario: async (req, res) => {
        try {
            const { id_funcionario } = req.params;
            const traslados = await TrasladoModel.getByFuncionario(id_funcionario);

            res.json({
                success: true,
                data: traslados,
                total: traslados.length
            });

        } catch (error) {
            console.error('Error en getByFuncionario traslado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    finalizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_fin } = req.body;

            if (!fecha_fin) {
                return res.status(400).json({ success: false, message: 'La fecha de finalización es requerida' });
            }

            // Verificar si el traslado existe
            const traslado = await TrasladoModel.getById(id);
            if (!traslado) {
                return res.status(404).json({ success: false, message: 'Traslado no encontrado' });
            }

            // Verificar si está en "hasta nuevo aviso"
            if (traslado.hasta_nuevo_aviso !== 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden finalizar traslados que están en "hasta nuevo aviso"'
                });
            }

            // Finalizar el traslado
            const result = await TrasladoModel.finalizar(id, fecha_fin);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Traslado no encontrado' });
            }

            res.json({
                success: true,
                message: 'Traslado finalizado exitosamente'
            });

        } catch (error) {
            console.error('Error en finalizar traslado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = trasladoController;