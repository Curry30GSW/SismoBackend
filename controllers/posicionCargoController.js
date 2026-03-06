const PosicionCargoModel = require('../models/PosicionCargoModel');
const MovimientoCargoModel = require('../models/MovimientoCargoModel');
const AnioLegalModel = require('../models/AnioLegalModel');
const CargoBaseModel = require('../models/CargoBaseModel');
const HistoricoSalarioModel = require('../models/HistoricoSalarioModel');
const DepartamentoModel = require('../models/DepartamentosModel');
const FuncionarioModel = require('../models/FuncionarioModel');
const pool = require('../config/ConectDb');

const posicionCargoController = {
    // 1. CREAR NUEVA POSICIÓN
    create: async (req, res) => {
        try {
            const { posiciones } = req.body;

            if (!posiciones || !Array.isArray(posiciones) || posiciones.length === 0) {
                return res.status(400).json({
                    message: 'Debe enviar un array de posiciones'
                });
            }

            if (posiciones.length > 50) {
                return res.status(400).json({
                    message: 'No se pueden crear más de 50 posiciones a la vez'
                });
            }

            const resultados = [];
            const errores = [];

            // Validar que todas las posiciones tengan los mismos datos básicos
            const primerItem = posiciones[0];
            const mismoCargo = posiciones.every(p => p.id_cargo_base === primerItem.id_cargo_base);
            const mismoDepartamento = posiciones.every(p => p.id_departamento === primerItem.id_departamento);
            const mismoAnio = posiciones.every(p => p.id_anio_legal === primerItem.id_anio_legal);

            if (!mismoCargo || !mismoDepartamento || !mismoAnio) {
                return res.status(400).json({
                    message: 'Todas las posiciones deben tener el mismo cargo, departamento y año'
                });
            }

            // Validar año legal
            const anioLegal = await AnioLegalModel.getById(primerItem.id_anio_legal);
            if (!anioLegal) {
                return res.status(404).json({
                    message: 'Año legal no encontrado'
                });
            }

            // Validar cargo base
            const cargoBase = await CargoBaseModel.getById(primerItem.id_cargo_base);
            if (!cargoBase) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            // Validar departamento
            const departamento = await DepartamentoModel.findById(primerItem.id_departamento);
            if (!departamento) {
                return res.status(404).json({
                    message: 'Departamento no encontrado'
                });
            }

            // Obtener salario configurado
            const salarioConfigurado = await HistoricoSalarioModel.getByCargoAndAnio(
                primerItem.id_cargo_base,
                primerItem.id_anio_legal
            );

            if (!salarioConfigurado) {
                return res.status(400).json({
                    message: 'El cargo seleccionado no tiene salario configurado para el año actual'
                });
            }

            // Calcular datos comunes
            const dosSMLV = anioLegal.salario_minimo_legal * 2;
            const aplicaAuxilioCalculado = salarioConfigurado.salario_base <= dosSMLV;
            const sede_ubicacion = departamento.nombre_departamento;

            // 🔥 PASO 1: Generar TODOS los códigos primero (secuenciales)
            const codigosPosicion = await generarCodigosPosicionSecuenciales(
                primerItem.id_cargo_base,
                primerItem.id_departamento,
                primerItem.id_anio_legal,
                posiciones.length
            );

            // 🔥 PASO 2: Crear las posiciones con los códigos pre-generados
            for (let i = 0; i < posiciones.length; i++) {
                try {
                    const result = await PosicionCargoModel.create({
                        id_cargo_base: primerItem.id_cargo_base,
                        id_anio_legal: primerItem.id_anio_legal,
                        codigo_posicion: codigosPosicion[i], // Usar código pre-generado
                        id_departamento: primerItem.id_departamento,
                        sede_ubicacion,
                        salario_base: salarioConfigurado.salario_base,
                        aplica_auxilio_transporte: aplicaAuxilioCalculado,
                        bonificacion: salarioConfigurado.bonificacion || 0,
                        fecha_creacion_posicion: new Date(),
                        activo: true,
                        observaciones: posiciones[i].observaciones || null
                    });

                    // Registrar movimiento
                    await MovimientoCargoModel.registrarCreacion(
                        result.id_posicion,
                        primerItem.id_anio_legal,
                        posiciones[i].observaciones || 'Creación masiva de posiciones',
                        req.user?.email || 'SISTEMA'
                    );

                    resultados.push({
                        id_posicion: result.id_posicion,
                        codigo_posicion: codigosPosicion[i],
                        success: true
                    });

                } catch (error) {
                    console.error(`Error creando posición ${i + 1}:`, error);
                    errores.push({
                        index: i,
                        error: error.message
                    });
                }
            }

            res.status(201).json({
                message: `Procesadas ${resultados.length} posiciones${errores.length > 0 ? `, ${errores.length} errores` : ''}`,
                data: {
                    exitosas: resultados,
                    errores: errores
                }
            });

        } catch (error) {
            console.error('Error en create posiciones:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 2. OBTENER TODAS LAS POSICIONES POR AÑO (CON FILTROS)
    getAllByAnio: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;
            const { id_cargo_base, id_departamento, estado } = req.query;

            // Validar que el año exista
            const anioLegal = await AnioLegalModel.getById(id_anio_legal);
            if (!anioLegal) {
                return res.status(404).json({
                    message: 'Año legal no encontrado'
                });
            }

            const filtros = {
                id_cargo_base: id_cargo_base ? parseInt(id_cargo_base) : undefined,
                id_departamento: id_departamento ? parseInt(id_departamento) : undefined,
                estado: estado || undefined
            };

            const posiciones = await PosicionCargoModel.getAllByAnio(id_anio_legal, filtros);

            // Calcular resumen
            const total = posiciones.length;
            const ocupadas = posiciones.filter(p => p.id_funcionario).length;
            const disponibles = total - ocupadas;

            res.json({
                data: posiciones,
                resumen: {
                    total,
                    ocupadas,
                    disponibles,
                    porcentaje_ocupacion: total > 0 ? ((ocupadas / total) * 100).toFixed(2) : 0
                }
            });

        } catch (error) {
            console.error('Error en getAllByAnio:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 3. OBTENER POSICIÓN POR ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const posicion = await PosicionCargoModel.getById(id);

            if (!posicion) {
                return res.status(404).json({
                    message: 'Posición no encontrada'
                });
            }

            res.json({ data: posicion });

        } catch (error) {
            console.error('Error en getById posicion:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 4. ACTUALIZAR POSICIÓN
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                id_departamento,
                sede_ubicacion,
                salario_base,
                aplica_auxilio_transporte,
                bonificacion,
                observaciones,
                activo
            } = req.body;

            // Validar que la posición existe
            const posicionExistente = await PosicionCargoModel.getById(id);
            if (!posicionExistente) {
                return res.status(404).json({
                    message: 'Posición no encontrada'
                });
            }

            // No permitir actualizar si tiene funcionario asignado (a menos que sea para desactivar)
            if (posicionExistente.id_funcionario && activo === false) {
                // Si se quiere desactivar, primero debe desasignarse el funcionario
                return res.status(400).json({
                    message: 'No se puede desactivar una posición ocupada. Primero debe desasignar el funcionario.'
                });
            }

            await PosicionCargoModel.update(id, {
                id_departamento: id_departamento || posicionExistente.id_departamento,
                sede_ubicacion: sede_ubicacion !== undefined ? sede_ubicacion : posicionExistente.sede_ubicacion,
                salario_base: salario_base || posicionExistente.salario_base,
                aplica_auxilio_transporte: aplica_auxilio_transporte !== undefined ? aplica_auxilio_transporte : posicionExistente.aplica_auxilio_transporte,
                bonificacion: bonificacion !== undefined ? bonificacion : posicionExistente.bonificacion,
                observaciones: observaciones !== undefined ? observaciones : posicionExistente.observaciones,
                activo: activo !== undefined ? activo : posicionExistente.activo
            });

            res.json({
                message: 'Posición actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error en update posicion:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 5. ELIMINAR (DESACTIVAR) POSICIÓN
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const { motivo } = req.body;

            // Validar que la posición existe
            const posicionExistente = await PosicionCargoModel.getById(id);
            if (!posicionExistente) {
                return res.status(404).json({
                    message: 'Posición no encontrada'
                });
            }

            // Validar que no tenga funcionario asignado
            if (posicionExistente.id_funcionario) {
                return res.status(400).json({
                    message: 'No se puede eliminar una posición ocupada. Primero debe desasignar el funcionario.'
                });
            }

            await PosicionCargoModel.delete(id, new Date(), motivo);

            // Registrar movimiento de eliminación
            await MovimientoCargoModel.registrarEliminacion(
                id,
                posicionExistente.id_anio_legal,
                motivo || 'Eliminación manual',
                req.user?.email || 'SISTEMA'
            );

            res.json({
                message: 'Posición eliminada exitosamente'
            });

        } catch (error) {
            console.error('Error en delete posicion:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 6. OBTENER DISPONIBILIDAD DE CARGOS (para tu componente)
    getDisponibilidad: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            // Validar que el año exista
            const anioLegal = await AnioLegalModel.getById(id_anio_legal);
            if (!anioLegal) {
                return res.status(404).json({
                    message: 'Año legal no encontrado'
                });
            }

            // Obtener todas las posiciones del año
            const posiciones = await PosicionCargoModel.getAllByAnio(id_anio_legal);

            // Agrupar por cargo para disponibilidad general
            const disponibilidadPorCargo = await PosicionCargoModel.getDisponibilidad(id_anio_legal);

            res.json({
                data: posiciones,
                disponibilidad_por_cargo: disponibilidadPorCargo,
                resumen: {
                    total: posiciones.length,
                    ocupadas: posiciones.filter(p => p.id_funcionario).length,
                    disponibles: posiciones.filter(p => !p.id_funcionario).length
                }
            });

        } catch (error) {
            console.error('Error en getDisponibilidad:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 7. OBTENER POSICIONES POR DEPARTAMENTO
    getByDepartamento: async (req, res) => {
        try {
            const { id_anio_legal, id_departamento } = req.params;

            const posiciones = await PosicionCargoModel.getAllByAnio(id_anio_legal, {
                id_departamento: parseInt(id_departamento)
            });

            res.json({
                data: posiciones,
                total: posiciones.length
            });

        } catch (error) {
            console.error('Error en getByDepartamento:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 8. OBTENER POSICIONES POR CARGO
    getByCargo: async (req, res) => {
        try {
            const { id_anio_legal, id_cargo_base } = req.params;

            const posiciones = await PosicionCargoModel.getAllByAnio(id_anio_legal, {
                id_cargo_base: parseInt(id_cargo_base)
            });

            res.json({
                data: posiciones,
                total: posiciones.length
            });

        } catch (error) {
            console.error('Error en getByCargo:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 9. OBTENER POSICIONES POR ESTADO (ocupadas/disponibles)
    getByEstado: async (req, res) => {
        try {
            const { id_anio_legal, estado } = req.params;

            if (!['ocupado', 'disponible'].includes(estado)) {
                return res.status(400).json({
                    message: 'Estado inválido. Use "ocupado" o "disponible"'
                });
            }

            const posiciones = await PosicionCargoModel.getAllByAnio(id_anio_legal, {
                estado
            });

            res.json({
                data: posiciones,
                total: posiciones.length
            });

        } catch (error) {
            console.error('Error en getByEstado:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 10. COPIAR POSICIONES DE UN AÑO A OTRO
    copyFromYear: async (req, res) => {
        try {
            const { id_anio_origen, id_anio_destino } = req.params;

            // Validar que ambos años existan
            const anioOrigen = await AnioLegalModel.getById(id_anio_origen);
            const anioDestino = await AnioLegalModel.getById(id_anio_destino);

            if (!anioOrigen || !anioDestino) {
                return res.status(404).json({
                    message: 'Año de origen o destino no encontrado'
                });
            }

            const resultado = await PosicionCargoModel.copyFromYear(
                id_anio_origen,
                id_anio_destino,
                new Date()
            );

            res.json({
                message: 'Posiciones y funcionarios copiados exitosamente',
                data: {
                    posiciones_copiadas: resultado.posiciones,
                    funcionarios_copiados: resultado.funcionarios,
                    año_origen: anioOrigen.anio,
                    año_destino: anioDestino.anio
                }
            });

        } catch (error) {
            console.error('Error en copyFromYear:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 11. DESASIGNAR FUNCIONARIO DE UNA POSICIÓN
    desasignarFuncionario: async (req, res) => {
        try {
            const { id } = req.params;
            const { motivo } = req.body;

            // Validar que la posición existe
            const posicionExistente = await PosicionCargoModel.getById(id);
            if (!posicionExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Posición no encontrada'
                });
            }

            // Validar que tenga funcionario asignado
            if (!posicionExistente.id_funcionario) {
                return res.status(400).json({
                    success: false,
                    message: 'La posición no tiene funcionario asignado'
                });
            }

            // Desasignar funcionario
            const result = await PosicionCargoModel.desasignarFuncionario(id);

            // Registrar movimiento de desasignación
            await MovimientoCargoModel.registrarDesasignacion(
                id,
                result.id_funcionario,
                posicionExistente.id_anio_legal,
                motivo || 'Desasignación manual de funcionario',
                req.user?.email || 'SISTEMA'
            );

            res.json({
                success: true,
                message: 'Funcionario desasignado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en desasignarFuncionario:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al desasignar funcionario'
            });
        }
    },



    // OBTENER FUNCIONARIO POR DOCUMENTO
    getByDocumento: async (req, res) => {
        try {
            const { tipo, numero } = req.params;

            if (!tipo || !numero) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo y número de documento son requeridos'
                });
            }

            const funcionario = await FuncionarioModel.getByDocumento(tipo, numero);

            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            res.json({
                success: true,
                data: funcionario
            });

        } catch (error) {
            console.error('Error en getByDocumento:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // ASIGNAR FUNCIONARIO A POSICIÓN (NUEVO O EXISTENTE)
    asignarFuncionario: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_funcionario, motivo, es_encargado } = req.body;

            // Validaciones
            if (!id_funcionario) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del funcionario es requerido'
                });
            }

            // Verificar que la posición existe
            const posicionExistente = await PosicionCargoModel.getById(id);
            if (!posicionExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Posición no encontrada'
                });
            }

            // Verificar que la posición no tenga funcionario
            if (posicionExistente.id_funcionario) {
                return res.status(400).json({
                    success: false,
                    message: 'La posición ya tiene un funcionario asignado'
                });
            }

            // Verificar que el funcionario existe
            const funcionario = await FuncionarioModel.getById(id_funcionario);
            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    message: 'Funcionario no encontrado'
                });
            }

            // 🔥 Asignar funcionario con validación de encargado
            const result = await PosicionCargoModel.asignarFuncionario(
                id,
                id_funcionario,
                es_encargado || false
            );

            // Registrar movimiento de asignación
            await MovimientoCargoModel.registrarAsignacion(
                id,
                id_funcionario,
                posicionExistente.id_anio_legal,
                motivo || (result.tieneOtraPosicion ? 'Asignación como encargado' : 'Asignación manual de funcionario'),
                req.user?.email || 'SISTEMA'
            );

            res.json({
                success: true,
                message: result.tieneOtraPosicion
                    ? 'Funcionario asignado como ENCARGADO exitosamente'
                    : 'Funcionario asignado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en asignarFuncionario:', error);

            // Manejar error específico de validación
            if (error.message.includes('ya está asignado')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    requiereEncargado: true
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Error al asignar funcionario'
            });
        }
    },

    trasladarCargo: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_nuevo_departamento, motivo } = req.body;

            if (!id_nuevo_departamento) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del nuevo departamento es requerido'
                });
            }

            // Verificar que la posición existe
            const posicion = await PosicionCargoModel.getById(id);
            if (!posicion) {
                return res.status(404).json({
                    success: false,
                    message: 'Posición no encontrada'
                });
            }

            // Realizar el traslado
            const result = await PosicionCargoModel.trasladarCargo(id, id_nuevo_departamento);

            // ✅ CORREGIDO: Crear objeto con los datos del movimiento
            await MovimientoCargoModel.create({
                id_posicion: id,
                id_funcionario: posicion.id_funcionario, // Puede ser null
                tipo_movimiento: 'TRASLADO',
                id_anio_legal: posicion.id_anio_legal, // ¡Faltaba este campo!
                motivo: motivo || `Traslado de cargo desde departamento ${posicion.id_departamento} a ${id_nuevo_departamento}`,
                usuario_sistema: req.user?.email || 'SISTEMA'
            });

            res.json({
                success: true,
                message: 'Cargo trasladado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en trasladarCargo:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al trasladar cargo'
            });
        }
    },

    // Trasladar funcionario a otra posición
    trasladarFuncionario: async (req, res) => {
        try {
            const { id } = req.params; // ID de la posición origen
            const { id_posicion_destino, motivo } = req.body;

            if (!id_posicion_destino) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID de la posición destino es requerido'
                });
            }

            // Verificar que la posición origen existe
            const posicionOrigen = await PosicionCargoModel.getById(id);
            if (!posicionOrigen) {
                return res.status(404).json({
                    success: false,
                    message: 'Posición origen no encontrada'
                });
            }

            // Verificar que la posición origen tenga funcionario
            if (!posicionOrigen.id_funcionario) {
                return res.status(400).json({
                    success: false,
                    message: 'La posición origen no tiene funcionario asignado'
                });
            }

            // Verificar que la posición destino existe
            const posicionDestino = await PosicionCargoModel.getById(id_posicion_destino);
            if (!posicionDestino) {
                return res.status(404).json({
                    success: false,
                    message: 'Posición destino no encontrada'
                });
            }

            // Realizar el traslado
            const result = await PosicionCargoModel.trasladarFuncionario(id, id_posicion_destino);

            // Registrar movimiento de desasignación en origen
            await MovimientoCargoModel.registrarDesasignacion(
                id,
                posicionOrigen.id_funcionario,
                posicionOrigen.id_anio_legal,
                motivo || 'Traslado a otra posición',
                req.user?.email || 'SISTEMA'
            );

            // Registrar movimiento de asignación en destino
            await MovimientoCargoModel.registrarAsignacion(
                id_posicion_destino,
                posicionOrigen.id_funcionario,
                posicionDestino.id_anio_legal,
                motivo || 'Traslado desde otra posición',
                req.user?.email || 'SISTEMA'
            );

            res.json({
                success: true,
                message: 'Funcionario trasladado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en trasladarFuncionario:', error);

            // Manejar errores específicos
            if (error.message.includes('ya tiene un funcionario')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    tipo: 'POSICION_OCUPADA'
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Error al trasladar funcionario'
            });
        }
    },

};

// Función auxiliar para generar códigos de posición SECUENCIALES (CORREGIDA)
async function generarCodigosPosicionSecuenciales(idCargoBase, idDepartamento, idAnioLegal, cantidad) {
    // Obtener información necesaria
    const cargoBase = await CargoBaseModel.getById(idCargoBase);
    const anioLegal = await AnioLegalModel.getById(idAnioLegal);
    const departamento = await DepartamentoModel.findById(idDepartamento);

    const prefijoCargo = cargoBase.codigo_cargo;
    const codDepto = departamento.codigo_ext.toString().padStart(4, '0');

    // 🔥 OBTENER TODAS LAS POSICIONES (activas E inactivas) para evitar duplicados
    // Necesitamos una consulta que no filtre por activo
    const [todasLasPosiciones] = await pool.query(`
        SELECT codigo_posicion 
        FROM posiciones_cargo 
        WHERE id_anio_legal = ? 
          AND id_cargo_base = ? 
          AND id_departamento = ?
    `, [idAnioLegal, idCargoBase, idDepartamento]);

    // 🔥 Crear un Set con todos los códigos existentes (activos e inactivos)
    const codigosExistentes = new Set(todasLasPosiciones.map(p => p.codigo_posicion));

    // 🔥 Obtener SOLO POSICIONES ACTIVAS para calcular el último número secuencial
    const posicionesActivas = await PosicionCargoModel.getAllByAnio(idAnioLegal, {
        id_cargo_base: idCargoBase,
        id_departamento: idDepartamento
    });

    // Calcular el máximo número de las posiciones ACTIVAS
    let maxNumeroActivo = 0;
    if (posicionesActivas.length > 0) {
        const numeros = posicionesActivas.map(p => {
            const partes = p.codigo_posicion.split('-');
            for (let i = 0; i < partes.length; i++) {
                if (partes[i] === anioLegal.anio.toString()) {
                    const numeroAnterior = partes[i - 1];
                    if (/^\d{3}$/.test(numeroAnterior)) {
                        return parseInt(numeroAnterior);
                    }
                }
            }
            return 0;
        }).filter(n => n > 0);
        maxNumeroActivo = numeros.length > 0 ? Math.max(...numeros) : 0;
    }

    // 🔥 Generar códigos asegurando que sean ÚNICOS (considerando activos e inactivos)
    const codigos = [];
    let numeroIntentos = 0;
    let numeroActual = maxNumeroActivo;

    for (let i = 0; i < cantidad; i++) {
        let codigoGenerado = null;
        let encontrado = false;

        // Buscar el próximo número disponible
        while (!encontrado && numeroIntentos < 1000) { // Límite de seguridad
            numeroIntentos++;
            numeroActual++;
            const nuevoNumero = numeroActual.toString().padStart(3, '0');
            const posibleCodigo = `${prefijoCargo}-${codDepto}-${nuevoNumero}-${anioLegal.anio}`.toUpperCase();

            // Verificar si el código NO existe en la base de datos (activo o inactivo)
            if (!codigosExistentes.has(posibleCodigo)) {
                codigoGenerado = posibleCodigo;
                encontrado = true;
                // Agregar a existentes para evitar duplicados en el mismo lote
                codigosExistentes.add(posibleCodigo);
                break;
            }
        }

        if (!codigoGenerado) {
            throw new Error(`No se pudo generar un código único después de ${numeroIntentos} intentos`);
        }

        codigos.push(codigoGenerado);
    }

    return codigos;
}

module.exports = posicionCargoController;