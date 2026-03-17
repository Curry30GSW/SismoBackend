const ContratoModel = require('../../models/Contratos/ContratoModel');
const FuncionarioModel = require('../../models/Contratos/FuncionarioModel');
const ArlModel = require('../../models/Contratos/ArlModel');
const BancoModel = require('../../models/Contratos/BancoModel');
const EpsModel = require('../../models/Contratos/EpsModel');
const CesantiasModel = require('../../models/Contratos/CesantiasModel');
const PensionesModel = require('../../models/Contratos/PensionesModel');
const CajaCompensacionModel = require('../../models/Contratos/CajaCompensacionModel');

const contratoController = {
    // =============================================
    // DATOS PARA FORMULARIOS
    // =============================================
    getFormData: async (req, res) => {
        try {
            const [arl, bancos, eps, cesantias, pensiones, cajas] = await Promise.all([
                ArlModel.getAll(),
                BancoModel.getAll(),
                EpsModel.getAll(),
                CesantiasModel.getAll(),
                PensionesModel.getAll(),
                CajaCompensacionModel.getAll()
            ]);

            res.json({
                success: true,
                data: {
                    arl,
                    bancos,
                    eps,
                    cesantias,
                    pensiones,
                    cajas_compensacion: cajas
                }
            });

        } catch (error) {
            console.error('Error en getFormData:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getNivelesRiesgo: async (req, res) => {
        try {
            const { id_arl } = req.params;
            const niveles = await ArlModel.getNivelesByArl(id_arl);

            res.json({
                success: true,
                data: niveles
            });

        } catch (error) {
            console.error('Error en getNivelesRiesgo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =============================================
    // BUSCAR FUNCIONARIO (para autocompletar)
    // =============================================
    buscarFuncionario: async (req, res) => {
        try {
            const { documento } = req.params;

            // Buscar funcionario con todos sus datos relacionados
            const funcionario = await FuncionarioModel.getByDocumentoCompleto('CC', documento);

            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            // Obtener posiciones activas del funcionario
            const posiciones = await FuncionarioModel.getPosicionesActivas(funcionario.id_funcionario);

            res.json({
                success: true,
                data: {
                    // Datos personales
                    id_funcionario: funcionario.id_funcionario,
                    nombre_completo: `${funcionario.nombres} ${funcionario.apellidos}`,
                    numero_documento: funcionario.numero_documento,
                    tipo_documento: funcionario.tipo_documento,
                    direccion: funcionario.direccion,
                    telefono: funcionario.telefono,
                    sexo: funcionario.sexo,
                    fecha_nacimiento: funcionario.fecha_nacimiento,
                    lugar_nacimiento: funcionario.lugar_nacimiento,

                    // Datos bancarios
                    id_banco: funcionario.id_banco,
                    nombre_banco: funcionario.nombre_banco,
                    tipo_cuenta: funcionario.tipo_cuenta,
                    numero_cuenta: funcionario.numero_cuenta_bancaria,

                    // Datos EPS
                    id_eps: funcionario.id_eps,
                    nombre_eps: funcionario.nombre_eps,
                    codigo_eps: funcionario.codigo_eps,

                    // Datos Cesantías
                    id_cesantias: funcionario.id_cesantias,
                    nombre_cesantias: funcionario.nombre_cesantia,
                    codigo_cesantias: funcionario.codigo_cesantia,

                    // Datos Pensión
                    id_pension: funcionario.id_pension,
                    nombre_pension: funcionario.nombre_pension,
                    codigo_pension: funcionario.codigo_pension,

                    // Datos Caja Compensación
                    id_caja_compensacion: funcionario.id_caja_compensacion,
                    nombre_caja: funcionario.nombre_caja,
                    codigo_caja: funcionario.codigo_caja,

                    // Posiciones activas
                    posiciones_activas: posiciones.map(p => ({
                        id_posicion: p.id_posicion,
                        codigo_posicion: p.codigo_posicion,
                        nombre_cargo: p.nombre_cargo,
                        departamento: p.nombre_departamento,
                        anio: p.anio
                    }))
                }
            });

        } catch (error) {
            console.error('Error en buscarFuncionario:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =============================================
    // CRUD CONTRATOS
    // =============================================
    create: async (req, res) => {
        try {
            const data = req.body;

            // Validaciones básicas
            if (!data.id_funcionario) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del funcionario es requerido'
                });
            }
            if (!data.id_posicion) {
                return res.status(400).json({
                    success: false,
                    message: 'La posición es requerida'
                });
            }
            if (!data.tipo_contrato) {
                return res.status(400).json({
                    success: false,
                    message: 'El tipo de contrato es requerido'
                });
            }
            if (!data.fecha_inicio) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de inicio es requerida'
                });
            }
            if (!data.cargo) {
                return res.status(400).json({
                    success: false,
                    message: 'El cargo es requerido'
                });
            }
            if (!data.salario || data.salario <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El salario debe ser mayor a 0'
                });
            }
            if (!data.lugar_labores) {
                return res.status(400).json({
                    success: false,
                    message: 'El lugar de labores es requerido'
                });
            }

            const idContrato = await ContratoModel.create(data);

            res.status(201).json({
                success: true,
                message: 'Contrato creado exitosamente',
                data: { id_contrato: idContrato }
            });

        } catch (error) {
            console.error('Error en create contrato:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear el contrato'
            });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const contrato = await ContratoModel.getById(id);

            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            res.json({
                success: true,
                data: contrato
            });

        } catch (error) {
            console.error('Error en getById contrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const {
                estado,
                tipo_contrato,
                id_funcionario,
                fecha_desde,
                fecha_hasta,
                page = 1,
                limit = 20
            } = req.query;

            const filtros = {
                estado,
                tipo_contrato,
                id_funcionario: id_funcionario ? parseInt(id_funcionario) : undefined,
                fecha_desde,
                fecha_hasta
            };

            const contratos = await ContratoModel.getAll(filtros, page, limit);

            res.json({
                success: true,
                data: contratos,
                total: contratos.length,
                page: parseInt(page),
                limit: parseInt(limit)
            });

        } catch (error) {
            console.error('Error en getAll contratos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getByFuncionario: async (req, res) => {
        try {
            const { id_funcionario } = req.params;

            const contratos = await ContratoModel.getByFuncionario(id_funcionario);

            res.json({
                success: true,
                data: contratos,
                total: contratos.length
            });

        } catch (error) {
            console.error('Error en getByFuncionario:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const contratoExistente = await ContratoModel.getById(id);
            if (!contratoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            await ContratoModel.update(id, data);

            res.json({
                success: true,
                message: 'Contrato actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error en update contrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // =============================================
    // GESTIÓN DE CLÁUSULAS
    // =============================================
    updateClausula: async (req, res) => {
        try {
            const { id } = req.params; // id_clausula
            const { contenido } = req.body;

            if (!contenido) {
                return res.status(400).json({
                    success: false,
                    message: 'El contenido de la cláusula es requerido'
                });
            }

            await ContratoModel.updateClausula(id, contenido);

            res.json({
                success: true,
                message: 'Cláusula actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error en updateClausula:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // =============================================
    // ACCIONES SOBRE EL CONTRATO
    // =============================================
    finalizar: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_fin, motivo } = req.body;

            const contratoExistente = await ContratoModel.getById(id);
            if (!contratoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            await ContratoModel.finalizar(id, fecha_fin, motivo);

            res.json({
                success: true,
                message: 'Contrato finalizado exitosamente'
            });

        } catch (error) {
            console.error('Error en finalizar contrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    prorrogar: async (req, res) => {
        try {
            const { id } = req.params;
            const { nueva_fecha_fin } = req.body;

            if (!nueva_fecha_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva fecha de fin es requerida'
                });
            }

            const contratoExistente = await ContratoModel.getById(id);
            if (!contratoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            if (contratoExistente.tipo_contrato !== 'TERMINO_FIJO') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden prorrogar contratos a término fijo'
                });
            }

            await ContratoModel.prorrogar(id, nueva_fecha_fin);

            res.json({
                success: true,
                message: 'Contrato prorrogado exitosamente'
            });

        } catch (error) {
            console.error('Error en prorrogar contrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const contratoExistente = await ContratoModel.getById(id);
            if (!contratoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            await ContratoModel.delete(id);

            res.json({
                success: true,
                message: 'Contrato eliminado (finalizado) exitosamente'
            });

        } catch (error) {
            console.error('Error en delete contrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = contratoController;