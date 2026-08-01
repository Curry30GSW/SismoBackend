const DocumentoVerificacionModel = require('../../models/main/DocumentoVerificacionModel');

const documentoVerificacionController = {
    // Generar y guardar código para un documento
    generarCodigo: async (req, res) => {
        try {
            const { tipo_documento, id_documento, id_funcionario, nombre_firma, cargo_firma } = req.body;

            if (!tipo_documento || !id_documento || !id_funcionario) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos: tipo_documento, id_documento, id_funcionario'
                });
            }

            // Verificar si ya existe
            let existente = await DocumentoVerificacionModel.obtenerPorReferencia(tipo_documento, id_documento);

            if (existente) {
                // Si existe, actualizar la firma si se proporciona una nueva
                if (nombre_firma || cargo_firma) {
                    await DocumentoVerificacionModel.actualizarFirma(
                        existente.id_verificacion,
                        nombre_firma || existente.nombre_firma,
                        cargo_firma || existente.cargo_firma
                    );
                    existente = await DocumentoVerificacionModel.obtenerPorReferencia(tipo_documento, id_documento);
                }
                return res.json({
                    success: true,
                    data: existente,
                    message: 'Código ya existente'
                });
            }

            // Crear nuevo código con la firma
            const nuevoCodigo = await DocumentoVerificacionModel.crear({
                tipo_documento,
                id_documento,
                id_funcionario,
                nombre_firma: nombre_firma || null,
                cargo_firma: cargo_firma || null
            });

            res.json({
                success: true,
                data: nuevoCodigo,
                message: 'Código de verificación generado exitosamente'
            });

        } catch (error) {
            console.error('Error en generarCodigo:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Verificar documento por código
    verificar: async (req, res) => {
        try {
            const { codigo } = req.params;
            const infoVerificacion = await DocumentoVerificacionModel.verificar(codigo);
            if (!infoVerificacion) {
                return res.status(404).json({
                    success: false,
                    message: '❌ Documento no válido o código inexistente'
                });
            }
            const documentoCompleto = await DocumentoVerificacionModel.obtenerDocumentoCompleto(
                infoVerificacion.tipo_documento,
                infoVerificacion.id_documento
            );

            res.json({
                success: true,
                data: {
                    codigo: infoVerificacion.codigo,
                    tipo_documento: infoVerificacion.tipo_documento,
                    fecha_emision: infoVerificacion.fecha_emision,
                    documento: {
                        ...documentoCompleto,
                        nombre_firma: infoVerificacion.nombre_firma,
                        cargo_firma: infoVerificacion.cargo_firma
                    },
                    es_valido: true
                },
                message: '✅ Documento auténtico'
            });
        } catch (error) {
            console.error('Error en verificar:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Obtener código por referencia
    obtenerPorReferencia: async (req, res) => {
        try {
            const { tipo, id } = req.params;

            const codigo = await DocumentoVerificacionModel.obtenerPorReferencia(tipo, id);

            res.json({
                success: true,
                data: codigo || null
            });

        } catch (error) {
            console.error('Error en obtenerPorReferencia:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    verificarPublico: async (req, res) => {
        try {
            const { codigo } = req.params;

            const infoVerificacion = await DocumentoVerificacionModel.verificar(codigo);

            if (!infoVerificacion) {
                return res.status(404).json({
                    success: false,
                    message: '❌ Documento no válido o código inexistente'
                });
            }

            // Obtener datos completos del documento
            const documentoCompleto = await DocumentoVerificacionModel.obtenerDocumentoCompleto(
                infoVerificacion.tipo_documento,
                infoVerificacion.id_documento
            );

            res.json({
                success: true,
                data: {
                    codigo: infoVerificacion.codigo,
                    tipo_documento: infoVerificacion.tipo_documento,
                    fecha_emision: infoVerificacion.fecha_emision,
                    documento: documentoCompleto,
                    es_valido: true
                },
                message: '✅ Documento auténtico'
            });

        } catch (error) {
            console.error('Error en verificarPublico:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = documentoVerificacionController;