const ProrrogaModel = require('../../models/Contratos/ProrrogaModel');
const ContratoModel = require('../../models/Contratos/ContratoModel');

const pool = require('../../config/ConectDb');


const prorrogaController = {

    //FUNCION PARA GENERAR CODIGO DE PRORROGA UNICO Y SECUENCIAL
    generarCodigoProrroga: async () => {
        try {
            const anioActual = new Date().getFullYear();

            // Buscar el último código del año actual
            const [result] = await pool.query(`
            SELECT codigo_prorroga 
            FROM prorrogas_contrato 
            WHERE codigo_prorroga LIKE ? 
            ORDER BY id_prorroga DESC 
            LIMIT 1
        `, [`PR-${anioActual}-%`]);

            let nuevoNumero = 1;

            if (result.length > 0 && result[0].codigo_prorroga) {
                const match = result[0].codigo_prorroga.match(/PR-\d+-(\d+)/);
                if (match) {
                    nuevoNumero = parseInt(match[1]) + 1;
                }
            }

            // Sin padding, solo el número
            return `PR-${anioActual}-${nuevoNumero}`;
        } catch (error) {
            console.error('Error generando código de prórroga:', error);
            const timestamp = Date.now().toString().slice(-6);
            return `PR-${timestamp}`;
        }
    },


    // Crear nueva prórroga
    create: async (req, res) => {
        try {
            const { id } = req.params;
            const { dias_prorrogados } = req.body;

            // Verificar si el contrato existe
            const contrato = await ContratoModel.getById(id);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // Verificar si puede ser prorrogado
            const puedeProrrogar = await ProrrogaModel.puedeProrrogar(id);
            if (!puedeProrrogar) {
                return res.status(400).json({
                    success: false,
                    message: 'El contrato no puede ser prorrogado. Solo contratos a término fijo activos.'
                });
            }

            // Validar días a prorrogar
            if (!dias_prorrogados || dias_prorrogados <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar un número válido de días a prorrogar'
                });
            }

            // 🔥 Generar el código de prórroga
            const codigoProrroga = await prorrogaController.generarCodigoProrroga();

            // Calcular nueva fecha de fin
            const fechaFinAnterior = new Date(contrato.fecha_fin);
            const fechaFinNueva = new Date(fechaFinAnterior);
            fechaFinNueva.setDate(fechaFinNueva.getDate() + dias_prorrogados);

            // Crear la prórroga
            const result = await ProrrogaModel.create({
                id_contrato: id,
                codigo_prorroga: codigoProrroga,
                fecha_inicio: new Date(),
                fecha_fin_anterior: contrato.fecha_fin,
                fecha_fin_nueva: fechaFinNueva,
                dias_prorrogados: dias_prorrogados,
                usuario_creacion: req.user?.email || 'SISTEMA'
            });

            // Obtener el contrato actualizado
            const contratoActualizado = await ContratoModel.getById(id);

            res.json({
                success: true,
                message: `Prórroga ${codigoProrroga} creada exitosamente. Nueva fecha de fin: ${fechaFinNueva.toISOString().split('T')[0]}`,
                data: {
                    prorroga: result,
                    contrato: contratoActualizado
                }
            });

        } catch (error) {
            console.error('Error en create prorroga:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const { estado, busqueda } = req.query;
            const prorrogas = await ProrrogaModel.getAll({ estado, busqueda });

            res.json({
                success: true,
                data: prorrogas,
                total: prorrogas.length
            });

        } catch (error) {
            console.error('Error en getAll prórrogas:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const prorroga = await ProrrogaModel.getById(id);

            if (!prorroga) {
                return res.status(404).json({ success: false, message: 'Prórroga no encontrada' });
            }

            res.json({ success: true, data: prorroga });

        } catch (error) {
            console.error('Error en getById prórroga:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Obtener todas las prórrogas de un contrato
    getByContrato: async (req, res) => {
        try {
            const { id } = req.params;

            const prorrogas = await ProrrogaModel.getByContrato(id);

            res.json({
                success: true,
                data: prorrogas,
                total: prorrogas.length
            });

        } catch (error) {
            console.error('Error en getByContrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Verificar si un contrato puede ser prorrogado
    verificarProrroga: async (req, res) => {
        try {
            const { id } = req.params;

            const puede = await ProrrogaModel.puedeProrrogar(id);
            const contrato = await ContratoModel.getById(id);

            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            const fechaFin = new Date(contrato.fecha_fin);
            const hoy = new Date();
            const diasRestantes = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));

            res.json({
                success: true,
                data: {
                    puede_prorrogar: puede,
                    dias_restantes: diasRestantes,
                    fecha_fin_actual: contrato.fecha_fin,
                    tipo_contrato: contrato.tipo_contrato,
                    estado: contrato.estado
                }
            });

        } catch (error) {
            console.error('Error en verificarProrroga:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getCantidadByContrato: async (req, res) => {
        try {
            const { id } = req.params;

            const cantidad = await ProrrogaModel.getCantidadByContrato(id);

            res.json({
                success: true,
                data: { cantidad }
            });

        } catch (error) {
            console.error('Error en getCantidadByContrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

};

module.exports = prorrogaController;