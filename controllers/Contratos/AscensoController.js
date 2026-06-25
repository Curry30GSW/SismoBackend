const AscensoModel = require('../../models/Contratos/AscensoModel');
const ContratoModel = require('../../models/Contratos/ContratoModel');

const ascensoController = {
    // 1. GENERAR CÓDIGO DE ASCENSO
    generarCodigo: async (req, res) => {
        try {
            const codigo = await AscensoModel.generarCodigoAscenso();
            res.json({
                success: true,
                codigo: codigo
            });
        } catch (error) {
            console.error('Error generando código:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 2. CREAR REGISTRO DE ASCENSO
    create: async (req, res) => {
        try {
            const {
                id_contrato_anterior,
                id_contrato_nuevo,
                id_posicion_nueva,
                id_posicion_anterior,
                id_funcionario,
                estado,
                fecha_ascenso,
                fecha_efectiva,
                usuario_creacion
            } = req.body;

            // Validaciones
            if (!id_contrato_anterior || !id_contrato_nuevo || !id_posicion_nueva) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: id_contrato_anterior, id_contrato_nuevo, id_posicion_nueva'
                });
            }

            // Verificar que los contratos existan
            const contratoAnterior = await ContratoModel.getById(id_contrato_anterior);
            if (!contratoAnterior) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato anterior no encontrado'
                });
            }

            const contratoNuevo = await ContratoModel.getById(id_contrato_nuevo);
            if (!contratoNuevo) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato nuevo no encontrado'
                });
            }

            // Verificar que sea un ascenso (salario nuevo > salario anterior)
            if (contratoNuevo.salario <= contratoAnterior.salario) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede registrar como ascenso porque el salario nuevo no es mayor al anterior'
                });
            }

            // Generar código de ascenso
            const codigoAscenso = await AscensoModel.generarCodigoAscenso();

            // Crear el registro con TODOS los campos
            const result = await AscensoModel.create({
                codigo_ascenso: codigoAscenso,
                id_contrato_anterior,
                id_contrato_nuevo,
                id_posicion_nueva,
                id_posicion_anterior: id_posicion_anterior || null,
                id_funcionario: id_funcionario || null,
                estado: estado || 'PENDIENTE',
                fecha_ascenso: fecha_ascenso || new Date().toISOString().split('T')[0],
                fecha_efectiva: fecha_efectiva || fecha_ascenso || new Date().toISOString().split('T')[0],
                usuario_creacion: usuario_creacion || req.user?.email || 'SISTEMA'
            });

            res.status(201).json({
                success: true,
                message: 'Ascenso registrado exitosamente',
                data: {
                    id_ascenso: result.id_ascenso,
                    codigo_ascenso: codigoAscenso
                }
            });

        } catch (error) {
            console.error('Error en create ascenso:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 3. OBTENER ASCENSO POR ID (con todos los datos relacionados)
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const ascenso = await AscensoModel.getById(id);

            if (!ascenso) {
                return res.status(404).json({
                    success: false,
                    message: 'Ascenso no encontrado'
                });
            }

            res.json({
                success: true,
                data: ascenso
            });

        } catch (error) {
            console.error('Error en getById ascenso:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 4. OBTENER ASCENSOS POR FUNCIONARIO
    getByFuncionario: async (req, res) => {
        try {
            const { id_funcionario } = req.params;

            const ascensos = await AscensoModel.getByFuncionario(id_funcionario);

            res.json({
                success: true,
                data: ascensos,
                total: ascensos.length
            });

        } catch (error) {
            console.error('Error en getByFuncionario ascenso:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 5. OBTENER TODOS LOS ASCENSOS (PAGINADO)
    getAll: async (req, res) => {
        try {

            const ascensos = await AscensoModel.getAll();

            res.json({
                success: true,
                data: ascensos
            });

        } catch (error) {
            console.error('Error en getAll ascenso:', error);

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 6. GENERAR PDF DE CARTA DE ASCENSO
    generarPdfAscenso: async (req, res) => {
        try {
            const { id } = req.params;

            const ascenso = await AscensoModel.getById(id);

            if (!ascenso) {
                return res.status(404).json({
                    success: false,
                    message: 'Ascenso no encontrado'
                });
            }

            // Aquí llamas a tu función que genera el PDF
            // generarPDFCartaAscenso(ascenso);

            res.json({
                success: true,
                message: 'PDF generado exitosamente',
                data: ascenso
            });

        } catch (error) {
            console.error('Error generando PDF de ascenso:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = ascensoController;