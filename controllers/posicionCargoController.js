const PosicionCargoModel = require('../models/PosicionCargoModel');
const MovimientoCargoModel = require('../models/MovimientoCargoModel');
const AnioLegalModel = require('../models/AnioLegalModel');
const CargoBaseModel = require('../models/CargoBaseModel');
const HistoricoSalarioModel = require('../models/HistoricoSalarioModel');
const DepartamentoModel = require('../models/DepartamentosModel');

const posicionCargoController = {
    // 1. CREAR NUEVA POSICIÓN
    create: async (req, res) => {
        try {
            const {
                id_cargo_base,
                id_anio_legal,
                id_departamento,
                observaciones
            } = req.body;

            // Validaciones obligatorias
            if (!id_cargo_base || !id_anio_legal || !id_departamento) {
                return res.status(400).json({
                    message: 'Cargo base, año legal y departamento son requeridos'
                });
            }

            // Validar que el año legal exista y esté activo
            const anioLegal = await AnioLegalModel.getById(id_anio_legal);
            if (!anioLegal) {
                return res.status(404).json({
                    message: 'Año legal no encontrado'
                });
            }

            // Validar que el cargo base exista
            const cargoBase = await CargoBaseModel.getById(id_cargo_base);
            if (!cargoBase) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            // Validar que el departamento exista
            const departamento = await DepartamentoModel.findById(id_departamento);
            if (!departamento) {
                return res.status(404).json({
                    message: 'Departamento no encontrado'
                });
            }

            // Obtener el salario configurado para este cargo en el año
            const salarioConfigurado = await HistoricoSalarioModel.getByCargoAndAnio(id_cargo_base, id_anio_legal);

            if (!salarioConfigurado) {
                return res.status(400).json({
                    message: 'El cargo seleccionado no tiene salario configurado para el año actual. Debe configurarlo primero en Salarios por Año.'
                });
            }

            // Calcular si aplica auxilio de transporte según 2 SMLV
            const dosSMLV = anioLegal.salario_minimo_legal * 2;
            const aplicaAuxilioCalculado = salarioConfigurado.salario_base <= dosSMLV;

            // Usar el nombre del departamento como sede_ubicacion
            const sede_ubicacion = departamento.nombre_departamento;

            // Generar código de posición automáticamente
            const codigoPosicion = await generarCodigoPosicion(id_cargo_base, id_departamento, id_anio_legal);

            // Crear la posición con los valores obtenidos automáticamente
            const result = await PosicionCargoModel.create({
                id_cargo_base,
                id_anio_legal,
                codigo_posicion: codigoPosicion,
                id_departamento,
                sede_ubicacion, // Usamos el nombre del departamento
                salario_base: salarioConfigurado.salario_base, // Del histórico
                aplica_auxilio_transporte: aplicaAuxilioCalculado, // Calculado según 2 SMLV
                bonificacion: salarioConfigurado.bonificacion || 0, // Del histórico
                fecha_creacion_posicion: new Date(),
                activo: true,
                observaciones: observaciones || null
            });

            // Registrar movimiento de creación
            await MovimientoCargoModel.registrarCreacion(
                result.id_posicion,
                id_anio_legal,
                observaciones || 'Creación manual de posición',
                req.user?.email || 'SISTEMA'
            );

            res.status(201).json({
                message: 'Posición creada exitosamente',
                data: {
                    id_posicion: result.id_posicion,
                    codigo_posicion: codigoPosicion,
                    id_cargo_base,
                    id_departamento,
                    sede_ubicacion,
                    salario_base: salarioConfigurado.salario_base,
                    bonificacion: salarioConfigurado.bonificacion || 0,
                    aplica_auxilio_transporte: aplicaAuxilioCalculado,
                    observaciones: observaciones || null
                }
            });

        } catch (error) {
            console.error('Error en create posicion:', error);
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

            const cantidad = await PosicionCargoModel.copyFromYear(
                id_anio_origen,
                id_anio_destino,
                new Date()
            );

            res.json({
                message: 'Posiciones copiadas exitosamente',
                data: {
                    posiciones_copiadas: cantidad,
                    año_origen: anioOrigen.anio,
                    año_destino: anioDestino.anio
                }
            });

        } catch (error) {
            console.error('Error en copyFromYear:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

// Función auxiliar para generar código de posición
async function generarCodigoPosicion(idCargoBase, idDepartamento, idAnioLegal) {
    // Obtener información necesaria
    const cargoBase = await CargoBaseModel.getById(idCargoBase);
    const anioLegal = await AnioLegalModel.getById(idAnioLegal);

    // Obtener el prefijo del cargo (primeros 4 caracteres del código)
    const prefijoCargo = cargoBase.codigo_cargo.split('-')[0] || cargoBase.codigo_cargo.substring(0, 4);

    // Obtener el último número usado para este cargo y año
    const posicionesExistentes = await PosicionCargoModel.getAllByAnio(idAnioLegal, {
        id_cargo_base: idCargoBase
    });

    const ultimoNumero = posicionesExistentes.length > 0
        ? Math.max(...posicionesExistentes.map(p => {
            const partes = p.codigo_posicion.split('-');
            const ultimoParte = partes[partes.length - 2]; // Asumiendo formato: PREFIJO-XXX-ANO
            return parseInt(ultimoParte) || 0;
        }))
        : 0;

    const nuevoNumero = (ultimoNumero + 1).toString().padStart(3, '0');

    // Formato: PREFIJO-CARGO-NUMERO-ANO
    // Ejemplo: PROG-001-2025
    return `${prefijoCargo}-${nuevoNumero}-${anioLegal.anio}`;
}

module.exports = posicionCargoController;