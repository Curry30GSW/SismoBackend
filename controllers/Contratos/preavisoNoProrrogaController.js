const PreavisoNoProrrogaModel = require('../../models/Contratos/PreavisoNoProrrogaModel');
const ContratoModel = require('../../models/Contratos/ContratoModel');

const preavisoNoProrrogaController = {

    generarCodigoPreaviso: async () => {
        try {
            // Obtener el último código generado
            const ultimoCodigo = await PreavisoNoProrrogaModel.obtenerUltimoCodigo();

            let nuevoNumero = 1;

            if (ultimoCodigo) {
                // Extraer el número del código (ejemplo: NAP-001 -> 1)
                const match = ultimoCodigo.match(/NAP-(\d+)/);
                if (match) {
                    nuevoNumero = parseInt(match[1]) + 1;
                }
            }

            // Formatear el número con ceros a la izquierda (3 dígitos)
            const numeroFormateado = nuevoNumero.toString().padStart(3, '0');
            const codigo = `NAP-${numeroFormateado}`;

            return codigo;
        } catch (error) {
            console.error('Error generando código de preaviso:', error);
            // Si hay error, generar un código con timestamp como fallback
            const timestamp = Date.now().toString().slice(-6);
            return `NAP-${timestamp}`;
        }
    },


    // Crear preaviso de no prórroga
    create: async (req, res) => {
        try {
            const { id } = req.params;
            const { dias_antelacion } = req.body;

            // Verificar que el contrato existe
            const contrato = await ContratoModel.getById(id);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // Verificar que sea término fijo y activo
            if (contrato.tipo_contrato !== 'TERMINO_FIJO') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo los contratos a término fijo pueden tener preaviso de no prórroga'
                });
            }

            if (contrato.estado !== 'ACTIVO') {
                return res.status(400).json({
                    success: false,
                    message: 'El contrato debe estar activo para generar un preaviso'
                });
            }

            // Verificar si ya existe un preaviso activo
            const existeActivo = await PreavisoNoProrrogaModel.existePreavisoActivo(id);
            if (existeActivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un preaviso activo para este contrato'
                });
            }

            // Generar el código del preaviso
            const codigoPreaviso = await preavisoNoProrrogaController.generarCodigoPreaviso();

            // Calcular fecha de preaviso (hoy)
            const fechaPreaviso = new Date().toISOString().split('T')[0];

            // Calcular fecha de notificación (fecha_fin - dias_antelacion)
            const fechaFin = new Date(contrato.fecha_fin);
            const fechaNotificacion = new Date(fechaFin);
            fechaNotificacion.setDate(fechaFin.getDate() - dias_antelacion);

            const result = await PreavisoNoProrrogaModel.create({
                id_contrato: id,
                codigo_preaviso: codigoPreaviso,
                fecha_preaviso: fechaPreaviso,
                fecha_notificacion: fechaNotificacion.toISOString().split('T')[0],
                dias_antelacion,
                usuario_creacion: req.user?.email || 'SISTEMA'
            });

            // Obtener el contrato con todos los datos para el PDF
            const contratoCompleto = await ContratoModel.getById(id);

            res.json({
                success: true,
                message: 'Preaviso de no prórroga creado exitosamente',
                data: {
                    preaviso: {
                        id_preaviso: result.id_preaviso,
                        codigo_preaviso: codigoPreaviso,
                        ...result
                    },
                    contrato: contratoCompleto
                }
            });

        } catch (error) {
            console.error('Error en create preaviso:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },


    // Verificar si un contrato tiene preaviso activo
    verificarPreaviso: async (req, res) => {
        try {
            const { id } = req.params;

            const existe = await PreavisoNoProrrogaModel.existePreavisoActivo(id);
            const preaviso = await PreavisoNoProrrogaModel.getByContrato(id);

            res.json({
                success: true,
                data: {
                    tiene_preaviso: existe,
                    preaviso: preaviso || null
                }
            });

        } catch (error) {
            console.error('Error en verificarPreaviso:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Cancelar preaviso
    cancelar: async (req, res) => {
        try {
            const { id } = req.params;

            const preaviso = await PreavisoNoProrrogaModel.getByContrato(id);
            if (!preaviso) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró un preaviso activo para este contrato'
                });
            }

            await PreavisoNoProrrogaModel.cancelar(preaviso.id_preaviso);

            res.json({
                success: true,
                message: 'Preaviso cancelado exitosamente'
            });

        } catch (error) {
            console.error('Error en cancelar preaviso:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = preavisoNoProrrogaController;