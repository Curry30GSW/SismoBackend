const ContratoModel = require('../../models/Contratos/ContratoModel');
const FuncionarioModel = require('../../models/plantaCargos/FuncionarioModel');
const BancoModel = require('../../models/Contratos/BancoModel');
const EpsModel = require('../../models/Contratos/EpsModel');
const CesantiasModel = require('../../models/Contratos/CesantiasModel');
const PensionesModel = require('../../models/Contratos/PensionesModel');
const CajaCompensacionModel = require('../../models/Contratos/CajaCompensacionModel');
const NivelRiesgoModel = require('../../models/Contratos/NivelRiesgoModel');
const PosicionCargoModel = require('../../models/plantaCargos/PosicionCargoModel');
const PosicionFijoModel = require('../../models/plantaCargos/PosicionCargoFijoModel');
const PosicionSenaModel = require('../../models/plantaCargos/PosicionCargoSenaModel');
const CargoBaseModel = require('../../models/plantaCargos/CargoBaseModel');
const MovimientoCargoModel = require('../../models/plantaCargos/MovimientoCargoModel');
const pool = require('../../config/ConectDb');


async function generarNumeroContrato(tipoContrato) {
    let prefijo;
    switch (tipoContrato) {
        case 'TERMINO_FIJO':
            prefijo = 'CTF';
            break;
        case 'INDEFINIDO':
            prefijo = 'CTI';
            break;
        case 'APRENDIZ':
            prefijo = 'CMA';
            break;
        case 'MEDIO_TIEMPO':
            prefijo = 'CMT';
            break;
        default:
            prefijo = 'CSC';
    }

    const [result] = await pool.query(`
        SELECT numero_contrato 
        FROM contratos 
        WHERE numero_contrato LIKE ?
        ORDER BY id_contrato DESC 
        LIMIT 1
    `, [`${prefijo}-%`]);

    let ultimoNumero = 0;

    if (result.length > 0 && result[0].numero_contrato) {
        const partes = result[0].numero_contrato.split('-');
        if (partes.length >= 2) {
            ultimoNumero = parseInt(partes[1]) || 0;
        }
    }

    // 🔥 Sin padding, solo el número natural
    const nuevoNumero = ultimoNumero + 1;

    return `${prefijo}-${nuevoNumero}`;
}

const contratoController = {
    // DATOS PARA FORMULARIOS
    getFormData: async (req, res) => {
        try {
            // Obtener datos de todas las tablas necesarias
            const [bancos, eps, cesantias, pensiones, cajasCompensacion, nivelesRiesgo] = await Promise.all([
                BancoModel.getAll(),
                EpsModel.getAll(),
                CesantiasModel.getAll(),
                PensionesModel.getAll(),
                CajaCompensacionModel.getAll(),
                NivelRiesgoModel.getAll()
            ]);

            // Tipos de cuenta es un ENUM fijo, no viene de BD
            const tiposCuenta = [
                { valor: 'AHORROS', etiqueta: 'Ahorros' },
                { valor: 'CORRIENTE', etiqueta: 'Corriente' }
            ];

            res.json({
                success: true,
                data: {
                    bancos: bancos,
                    tipos_cuenta: tiposCuenta,
                    eps: eps,
                    cesantias: cesantias,
                    pensiones: pensiones,
                    cajas_compensacion: cajasCompensacion,
                    niveles_riesgo: nivelesRiesgo
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
            const niveles = await NivelRiesgoModel.getByArl(id_arl);

            res.json({
                success: true,
                data: niveles
            });

        } catch (error) {
            console.error('Error en getNivelesRiesgo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // BUSCAR FUNCIONARIO (para autocompletar)
    buscarFuncionario: async (req, res) => {
        try {
            const { documento } = req.params;
            const { tipo } = req.query;
            const { id_anio_legal } = req.query;

            const tipoDocumento = tipo || 'CC';

            // 1. Buscar funcionario
            const funcionario = await FuncionarioModel.getByDocumentoCompleto(tipoDocumento, documento);

            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            // 2. Verificar si tiene algún contrato ACTIVO o PRORROGADO (sin importar el año)
            const contratoActivo = await ContratoModel.getContratoActivoPorFuncionario(
                funcionario.id_funcionario
            );

            if (contratoActivo) {
                return res.status(400).json({
                    success: false,
                    message: `El funcionario ya tiene un contrato ACTIVO (${contratoActivo.tipo_contrato}) en el año ${contratoActivo.anio}. Debe finalizarlo antes de crear uno nuevo.`,
                    data: {
                        contrato_existente: {
                            id_contrato: contratoActivo.id_contrato,
                            numero_contrato: contratoActivo.numero_contrato,
                            tipo_contrato: contratoActivo.tipo_contrato,
                            anio: contratoActivo.anio,
                            estado: contratoActivo.estado,
                            fecha_inicio: contratoActivo.fecha_inicio,
                            fecha_fin: contratoActivo.fecha_fin
                        }
                    }
                });
            }

            // 3. Obtener posiciones disponibles para el año legal actual (SOLO para INDEFINIDO)
            const posicionesDisponibles = await PosicionCargoModel.getAllByAnio(id_anio_legal, {
                estado: 'disponible'
            });

            // 4. Obtener cargos base (para TERMINO_FIJO y APRENDIZ) - no dependen del año
            const cargosBase = await CargoBaseModel.getAll({ activo: true });

            res.json({
                success: true,
                data: {
                    // Datos del funcionario
                    id_funcionario: funcionario.id_funcionario,
                    nombre_completo: `${funcionario.nombres} ${funcionario.apellidos}`,
                    numero_documento: funcionario.numero_documento,
                    tipo_documento: funcionario.tipo_documento,
                    direccion: funcionario.direccion,
                    telefono: funcionario.telefono,
                    sexo: funcionario.sexo,
                    fecha_nacimiento: funcionario.fecha_nacimiento,
                    lugar_nacimiento: funcionario.lugar_nacimiento,
                    correo_electronico: funcionario.correo_electronico,

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
                    id_cesantias: funcionario.id_cesantia,
                    nombre_cesantias: funcionario.nombre_cesantia,
                    codigo_cesantias: funcionario.codigo_cesantia,

                    // Datos Pensión
                    id_pension: funcionario.id_pension,
                    nombre_pension: funcionario.nombre_pension,
                    codigo_pension: funcionario.codigo_pension,

                    // Datos Caja Compensación
                    id_caja_compensacion: funcionario.id_caja,
                    nombre_caja: funcionario.nombre_caja,
                    codigo_caja: funcionario.codigo_caja,

                    // 🔥 PARA INDEFINIDO: posiciones disponibles (filtradas por año)
                    posiciones_disponibles: posicionesDisponibles.map(p => ({
                        id_posicion: p.id_posicion,
                        codigo_posicion: p.codigo_posicion,
                        nombre_cargo: p.nombre_cargo,
                        id_departamento: p.id_departamento,
                        nombre_departamento: p.nombre_departamento,
                        numero_posicion: p.numero_posicion,
                        salario_base: p.salario_base,
                        bonificacion: p.bonificacion,
                        aplica_auxilio_transporte: p.aplica_auxilio_transporte
                    })),

                    // 🔥 PARA TERMINO_FIJO Y APRENDIZ: cargos base
                    cargos_base: cargosBase.map(c => ({
                        id_cargo_base: c.id_cargo_base,
                        codigo_cargo: c.codigo_cargo,
                        nombre_cargo: c.nombre_cargo,
                        nivel_cargo: c.nivel_cargo,
                        requiere_bonificacion: c.requiere_bonificacion
                    }))
                }
            });

        } catch (error) {
            console.error('Error en buscarFuncionario:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al buscar funcionario'
            });
        }
    },

    getPosicionesDisponibles: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            const posiciones = await PosicionCargoModel.getAllByAnio(id_anio_legal, {
                estado: 'disponible'
            });

            res.json({
                success: true,
                data: posiciones.map(p => ({
                    id_posicion: p.id_posicion,
                    codigo_posicion: p.codigo_posicion,
                    nombre_cargo: p.nombre_cargo,
                    nombre_departamento: p.nombre_departamento,
                    salario_base: p.salario_base,
                    aplica_auxilio_transporte: p.aplica_auxilio_transporte
                }))
            });

        } catch (error) {
            console.error('Error en getPosicionesDisponibles:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // CRUD CONTRATOS
    create: async (req, res) => {
        try {
            const data = req.body;

            // Validaciones básicas
            if (!data.id_funcionario) {
                return res.status(400).json({ success: false, message: 'El funcionario es requerido' });
            }
            if (!data.id_posicion) {
                return res.status(400).json({ success: false, message: 'La posición es requerida' });
            }
            if (!data.tipo_contrato) {
                return res.status(400).json({ success: false, message: 'El tipo de contrato es requerido' });
            }
            if (!data.fecha_inicio) {
                return res.status(400).json({ success: false, message: 'La fecha de inicio es requerida' });
            }
            if (!data.salario || data.salario <= 0) {
                return res.status(400).json({ success: false, message: 'El salario debe ser mayor a 0' });
            }

            const numeroContrato = await generarNumeroContrato(data.tipo_contrato);

            const datosConNumero = {
                ...data,
                numero_contrato: numeroContrato
            };

            const idContrato = await ContratoModel.create(datosConNumero);

            res.status(201).json({
                success: true,
                message: 'Contrato creado exitosamente',
                data: {
                    id_contrato: idContrato,
                    numero_contrato: numeroContrato
                }
            });

        } catch (error) {
            console.error('Error en create contrato:', error);
            res.status(500).json({ success: false, message: error.message });
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
                id_anio_legal,
                fecha_desde,
                fecha_hasta,
                busqueda,
                orden = 'ASC',
                ordenar_por = 'c.fecha_creacion'
            } = req.query;

            const filtros = {
                estado,
                tipo_contrato,
                id_funcionario: id_funcionario ? parseInt(id_funcionario) : undefined,
                id_anio_legal: id_anio_legal ? parseInt(id_anio_legal) : undefined,
                fecha_desde,
                fecha_hasta,
                busqueda,
                orden,
                ordenar_por
            };

            const contratos = await ContratoModel.getAll(filtros);

            res.json({
                success: true,
                data: contratos,
                total: contratos.length
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

    // GESTIÓN DE CLÁUSULAS
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

    // ACCIONES SOBRE EL CONTRATO
    finalizarContrato: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_finalizacion } = req.body;

            // 1. Obtener el contrato con todos sus datos
            const contrato = await ContratoModel.getById(id);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // 2. Validar que el contrato esté activo
            if (contrato.estado !== 'ACTIVO' && contrato.estado !== 'PRORROGADO') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden finalizar contratos activos o prorrogados'
                });
            }

            const fechaFin = fecha_finalizacion || new Date().toISOString().split('T')[0];

            // 3. Actualizar el estado del contrato
            await ContratoModel.update(id, {
                estado: 'TERMINADO',
                fecha_fin: fechaFin,
                fecha_modificacion: new Date()
            });

            // 4. 🔥 MANEJAR LA POSICIÓN SEGÚN EL TIPO DE CONTRATO
            const idPosicion = contrato.id_posicion;
            const tipoContrato = contrato.tipo_contrato;

            if (idPosicion) {
                // 🔥 CASO APRENDIZ: Eliminar posición SENA completamente
                if (tipoContrato === 'APRENDIZ') {

                    // Verificar si la posición existe en la tabla SENA
                    const posicionSena = await PosicionSenaModel.getById(idPosicion);

                    if (posicionSena) {
                        if (posicionSena.id_funcionario) {
                            await PosicionSenaModel.desasignarAprendiz(idPosicion);
                        }

                        // Eliminar la posición SENA (soft delete)
                        await PosicionSenaModel.delete(idPosicion, fechaFin);

                        // Registrar el movimiento
                        await MovimientoCargoModel.create({
                            id_posicion: idPosicion,
                            id_funcionario: contrato.id_funcionario,
                            tipo_movimiento: 'ELIMINACION',
                            fecha_movimiento: fechaFin,
                            id_anio_legal: contrato.id_anio_legal,
                            motivo: `Finalización de contrato APRENDIZ - ${fechaFin}`,
                            usuario_sistema: req.user?.email || 'SISTEMA'
                        });
                    }
                }
                // 🔥 CASO TÉRMINO FIJO: Eliminar posición fija
                else if (tipoContrato === 'TERMINO_FIJO') {
                    const posicionFijo = await PosicionFijoModel.getById(idPosicion);

                    if (posicionFijo) {
                        await PosicionFijoModel.delete(idPosicion, fechaFin);

                        await MovimientoCargoModel.create({
                            id_posicion: idPosicion,
                            id_funcionario: contrato.id_funcionario,
                            tipo_movimiento: 'ELIMINACION',
                            fecha_movimiento: fechaFin,
                            id_anio_legal: contrato.id_anio_legal,
                            motivo: `Finalización de contrato TÉRMINO FIJO - ${fechaFin}`,
                            usuario_sistema: req.user?.email || 'SISTEMA'
                        });
                    }
                }
                // 🔥 CASO INDEFINIDO: Solo desasignar funcionario
                else if (tipoContrato === 'INDEFINIDO') {
                    await PosicionCargoModel.desasignarFuncionario(idPosicion);

                    await MovimientoCargoModel.create({
                        id_posicion: idPosicion,
                        id_funcionario: contrato.id_funcionario,
                        tipo_movimiento: 'DESASIGNACION',
                        fecha_movimiento: fechaFin,
                        id_anio_legal: contrato.id_anio_legal,
                        motivo: `Finalización de contrato INDEFINIDO - ${fechaFin}`,
                        usuario_sistema: req.user?.email || 'SISTEMA'
                    });
                }
                // 🔥 CASO MEDIO_TIEMPO: Similar a término fijo
                else if (tipoContrato === 'MEDIO_TIEMPO') {
                    const posicionFijo = await PosicionFijoModel.getById(idPosicion);

                    if (posicionFijo) {
                        // Paso 1: Desasignar funcionario de la posición de medio tiempo
                        if (posicionFijo.id_funcionario) {
                            await PosicionFijoModel.desasignarFuncionario(idPosicion);
                        }
                        await PosicionFijoModel.delete(idPosicion, fechaFin);

                        await MovimientoCargoModel.create({
                            id_posicion: idPosicion,
                            id_funcionario: contrato.id_funcionario,
                            tipo_movimiento: 'ELIMINACION',
                            fecha_movimiento: fechaFin,
                            id_anio_legal: contrato.id_anio_legal,
                            motivo: `Finalización de contrato MEDIO TIEMPO - ${fechaFin}`,
                            usuario_sistema: req.user?.email || 'SISTEMA'
                        });
                    }
                }
            }

            // 5. Obtener el contrato actualizado
            const contratoActualizado = await ContratoModel.getById(id);

            res.json({
                success: true,
                message: 'Contrato finalizado exitosamente',
                data: contratoActualizado
            });

        } catch (error) {
            console.error('Error en finalizarContrato:', error);
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
    },

    cambiarAIndefinido: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_posicion, usuario_creacion } = req.body;

            // Validaciones
            if (!id_posicion) {
                return res.status(400).json({
                    success: false,
                    message: 'La posición es requerida para el contrato indefinido'
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
                    message: 'Solo se pueden cambiar contratos a término fijo'
                });
            }

            if (contratoExistente.estado !== 'ACTIVO' && contratoExistente.estado !== 'PRORROGADO') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden cambiar contratos activos o prorrogados'
                });
            }

            // Generar el número en el controlador
            const nuevoNumeroContrato = await generarNumeroContrato('INDEFINIDO');

            // Pasar el número generado al modelo
            const resultado = await ContratoModel.cambiarModalidadAIndefinido(
                id,
                id_posicion,
                usuario_creacion || 'SISTEMA',
                nuevoNumeroContrato
            );

            res.json({
                success: true,
                message: 'Contrato cambiado a indefinido exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error en cambiarAIndefinido:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    anular: async (req, res) => {
        try {
            const { id } = req.params;
            const { motivo, usuario_anulacion } = req.body;

            // Validar que el contrato existe
            const contrato = await ContratoModel.getById(id);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // Validar que el contrato esté ACTIVO o PENDIENTE
            if (contrato.estado !== 'ACTIVO' && contrato.estado !== 'PENDIENTE') {
                return res.status(400).json({
                    success: false,
                    message: `No se puede anular un contrato en estado "${contrato.estado}". Solo se pueden anular contratos ACTIVOS o PENDIENTES.`
                });
            }

            const fechaAnulacion = new Date().toISOString().split('T')[0];
            const idPosicion = contrato.id_posicion;
            const tipoContrato = contrato.tipo_contrato;
            const usuario = usuario_anulacion || req.user?.email || 'SISTEMA';

            // 🔥 MANEJAR LA POSICIÓN SEGÚN EL TIPO DE CONTRATO
            if (idPosicion && contrato.estado === 'ACTIVO') {
                // 🔥 CASO APRENDIZ: Desasignar y eliminar posición SENA
                if (tipoContrato === 'APRENDIZ') {
                    try {
                        const posicionSena = await PosicionSenaModel.getById(idPosicion);
                        if (posicionSena) {
                            if (posicionSena.id_funcionario) {
                                await PosicionSenaModel.desasignarAprendiz(idPosicion);
                            }
                            await PosicionSenaModel.delete(idPosicion, fechaAnulacion);

                            await MovimientoCargoModel.create({
                                id_posicion: idPosicion,
                                id_funcionario: contrato.id_funcionario,
                                tipo_movimiento: 'ANULACION',
                                fecha_movimiento: fechaAnulacion,
                                id_anio_legal: contrato.id_anio_legal,
                                motivo: motivo || `Anulación de contrato APRENDIZ - ${fechaAnulacion}`,
                                usuario_sistema: usuario
                            });
                        }
                    } catch (error) {
                        console.warn('⚠️ Error al manejar posición SENA:', error.message);
                    }
                }
                // 🔥 CASO TÉRMINO FIJO: Desasignar y eliminar posición fija
                else if (tipoContrato === 'TERMINO_FIJO' || tipoContrato === 'MEDIO_TIEMPO') {
                    try {
                        const posicionFijo = await PosicionFijoModel.getById(idPosicion);
                        if (posicionFijo) {
                            if (posicionFijo.id_funcionario) {
                                await PosicionFijoModel.desasignarFuncionario(idPosicion);
                            }
                            await PosicionFijoModel.delete(idPosicion, fechaAnulacion);

                            await MovimientoCargoModel.create({
                                id_posicion: idPosicion,
                                id_funcionario: contrato.id_funcionario,
                                tipo_movimiento: 'ANULACION',
                                fecha_movimiento: fechaAnulacion,
                                id_anio_legal: contrato.id_anio_legal,
                                motivo: motivo || `Anulación de contrato ${tipoContrato} - ${fechaAnulacion}`,
                                usuario_sistema: usuario
                            });
                        }
                    } catch (error) {
                        console.warn('⚠️ Error al manejar posición fija:', error.message);
                    }
                }
                // 🔥 CASO INDEFINIDO: Solo desasignar funcionario
                else if (tipoContrato === 'INDEFINIDO') {
                    try {
                        await PosicionCargoModel.desasignarFuncionario(idPosicion);

                        await MovimientoCargoModel.create({
                            id_posicion: idPosicion,
                            id_funcionario: contrato.id_funcionario,
                            tipo_movimiento: 'ANULACION',
                            fecha_movimiento: fechaAnulacion,
                            id_anio_legal: contrato.id_anio_legal,
                            motivo: motivo || `Anulación de contrato INDEFINIDO - ${fechaAnulacion}`,
                            usuario_sistema: usuario
                        });
                    } catch (error) {
                        console.warn('⚠️ Error al desasignar posición indefinida:', error.message);
                    }
                }
            }

            // Anular el contrato (solo pasa motivo y usuario)
            const resultado = await ContratoModel.anular(id, {
                motivo: motivo || 'Anulado por el usuario',
                usuario_anulacion: usuario
            });

            res.json({
                success: true,
                message: 'Contrato anulado exitosamente',
                data: {
                    id_contrato: id,
                    estado: 'ANULADO',
                    motivo: motivo || 'Anulado por el usuario'
                }
            });

        } catch (error) {
            console.error('Error en anular contrato:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
};


module.exports = contratoController;