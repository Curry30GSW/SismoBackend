const CambioFechasAprendizModel = require('../../models/Contratos/CambioFechasAprendizModel');
const ContratoModel = require('../../models/Contratos/ContratoModel');
const pool = require('../../config/ConectDb');

const cambioFechasAprendizController = {
    // Cambiar fechas de un contrato aprendiz
    cambiarFechas: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const {
                electiva_inicio_nueva,
                electiva_fin_nueva,
                practica_inicio_nueva,
                practica_fin_nueva,  // Esta será la nueva fecha_fin del contrato
                usuario_modificacion
            } = req.body;

            // Verificar que el contrato existe y es de tipo APRENDIZ
            const contrato = await ContratoModel.getById(id);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            if (contrato.tipo_contrato !== 'APRENDIZ') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden cambiar fechas de contratos de aprendizaje'
                });
            }

            // Validar que al menos una fecha esté presente
            if (!electiva_inicio_nueva && !electiva_fin_nueva && !practica_inicio_nueva && !practica_fin_nueva) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar al menos una fecha nueva para modificar'
                });
            }

            // Validar que las fechas sean coherentes
            if (electiva_inicio_nueva && electiva_fin_nueva) {
                if (new Date(electiva_inicio_nueva) > new Date(electiva_fin_nueva)) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de inicio de fase electiva debe ser anterior a la fecha de fin'
                    });
                }
            }

            if (practica_inicio_nueva && practica_fin_nueva) {
                if (new Date(practica_inicio_nueva) > new Date(practica_fin_nueva)) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de inicio de fase práctica debe ser anterior a la fecha de fin'
                    });
                }
            }

            // Guardar histórico de fechas anteriores (para auditoría)
            await CambioFechasAprendizModel.create({
                id_contrato: id,
                electiva_inicio_anterior: contrato.electiva_inicio,
                electiva_fin_anterior: contrato.electiva_fin,
                practica_inicio_anterior: contrato.practica_inicio,
                practica_fin_anterior: contrato.practica_fin,
                electiva_inicio_nueva: electiva_inicio_nueva || contrato.electiva_inicio,
                electiva_fin_nueva: electiva_fin_nueva || contrato.electiva_fin,
                practica_inicio_nueva: practica_inicio_nueva || contrato.practica_inicio,
                practica_fin_nueva: practica_fin_nueva || contrato.practica_fin,
                usuario_modificacion: usuario_modificacion || req.user?.email || 'SISTEMA'
            });

            // Construir updates dinámicamente
            const updates = [];
            const values = [];

            if (electiva_inicio_nueva) {
                updates.push('electiva_inicio = ?');
                values.push(electiva_inicio_nueva);
            }
            if (electiva_fin_nueva) {
                updates.push('electiva_fin = ?');
                values.push(electiva_fin_nueva);
            }
            if (practica_inicio_nueva) {
                updates.push('practica_inicio = ?');
                values.push(practica_inicio_nueva);
            }
            if (practica_fin_nueva) {
                updates.push('practica_fin = ?');
                values.push(practica_fin_nueva);
                updates.push('fecha_fin = ?');
                values.push(practica_fin_nueva);
            }

            values.push(id);

            const query = `
                UPDATE contratos 
                SET ${updates.join(', ')}, fecha_modificacion = NOW()
                WHERE id_contrato = ?
            `;

            await connection.query(query, values);
            await connection.commit();

            // Obtener el contrato actualizado
            const contratoActualizado = await ContratoModel.getById(id);

            res.json({
                success: true,
                message: 'Fechas del contrato de aprendizaje actualizadas exitosamente',
                data: {
                    contrato: contratoActualizado,
                    fechas_anteriores: {
                        electiva_inicio: contrato.electiva_inicio,
                        electiva_fin: contrato.electiva_fin,
                        practica_inicio: contrato.practica_inicio,
                        practica_fin: contrato.practica_fin,
                        fecha_fin_contrato: contrato.fecha_fin
                    },
                    fechas_nuevas: {
                        electiva_inicio: electiva_inicio_nueva || contrato.electiva_inicio,
                        electiva_fin: electiva_fin_nueva || contrato.electiva_fin,
                        practica_inicio: practica_inicio_nueva || contrato.practica_inicio,
                        practica_fin: practica_fin_nueva || contrato.practica_fin,
                        fecha_fin_contrato: practica_fin_nueva || contrato.fecha_fin
                    }
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error en cambiarFechas:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        } finally {
            connection.release();
        }
    },

    // Obtener historial de cambios de fechas de un contrato
    getHistorial: async (req, res) => {
        try {
            const { id } = req.params;

            const contrato = await ContratoModel.getById(id);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            const historial = await CambioFechasAprendizModel.getByContrato(id);

            res.json({
                success: true,
                data: historial,
                total: historial.length,
                contrato: {
                    numero_contrato: contrato.numero_contrato,
                    nombres: contrato.nombres,
                    apellidos: contrato.apellidos
                }
            });

        } catch (error) {
            console.error('Error en getHistorial:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};


module.exports = cambioFechasAprendizController;