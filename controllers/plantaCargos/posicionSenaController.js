const PosicionSenaModel = require('../../models/plantaCargos/PosicionCargoSenaModel');
const AnioLegalModel = require('../../models/plantaCargos/AnioLegalModel');
const CargoBaseModel = require('../../models/plantaCargos/CargoBaseModel');
const DepartamentoModel = require('../../models/plantaCargos/DepartamentosModel');
const HistoricoSalarioModel = require('../../models/plantaCargos/HistoricoSalarioModel');
const FuncionarioModel = require('../../models/plantaCargos/FuncionarioModel');
const pool = require('../../config/ConectDb');

// Función auxiliar para generar códigos secuenciales (adaptada para SENA)
async function generarCodigosPosicionSecuenciales(idCargoBase, idDepartamento, idAnioLegal, cantidad) {
    const cargoBase = await CargoBaseModel.getById(idCargoBase);
    const anioLegal = await AnioLegalModel.getById(idAnioLegal);
    const departamento = await DepartamentoModel.findById(idDepartamento);

    const prefijoCargo = cargoBase.codigo_cargo;
    const codDepto = departamento.codigo_ext.toString().padStart(4, '0');

    // Obtener posiciones existentes (activas e inactivas) para evitar duplicados
    const [todasLasPosiciones] = await pool.query(`
        SELECT codigo_posicion 
        FROM posiciones_cargo_sena 
        WHERE id_anio_legal = ? 
          AND id_cargo_base = ? 
          AND id_departamento = ?
    `, [idAnioLegal, idCargoBase, idDepartamento]);

    const codigosExistentes = new Set(todasLasPosiciones.map(p => p.codigo_posicion));

    // Obtener solo activas para el máximo número
    const posicionesActivas = await PosicionSenaModel.getAllByAnio(idAnioLegal, {
        id_cargo_base: idCargoBase,
        id_departamento: idDepartamento
    });

    let maxNumeroActivo = 0;
    if (posicionesActivas.length > 0) {
        const numeros = posicionesActivas.map(p => {
            const partes = p.codigo_posicion.split('-');
            for (let i = 0; i < partes.length; i++) {
                if (partes[i] === anioLegal.anio.toString()) {
                    const numeroAnterior = partes[i - 1];
                    if (/^\d{3}$/.test(numeroAnterior)) return parseInt(numeroAnterior);
                }
            }
            return 0;
        }).filter(n => n > 0);
        maxNumeroActivo = numeros.length > 0 ? Math.max(...numeros) : 0;
    }

    const codigos = [];
    let numeroActual = maxNumeroActivo;

    for (let i = 0; i < cantidad; i++) {
        numeroActual++;
        const nuevoNumero = numeroActual.toString().padStart(3, '0');
        const posibleCodigo = `${prefijoCargo}-${codDepto}-${nuevoNumero}-${anioLegal.anio}`.toUpperCase();

        // Si ya existe, seguimos buscando
        while (codigosExistentes.has(posibleCodigo)) {
            numeroActual++;
            const nuevoNumero = numeroActual.toString().padStart(3, '0');
            const posibleCodigo = `${prefijoCargo}-${codDepto}-${nuevoNumero}-${anioLegal.anio}`.toUpperCase();
        }

        codigos.push(posibleCodigo);
        codigosExistentes.add(posibleCodigo);
    }

    return codigos;
}

const posicionSenaController = {
    // =============================================
    // CREATE
    // =============================================
    create: async (req, res) => {
        try {
            const { posiciones } = req.body;

            if (!posiciones || !Array.isArray(posiciones) || posiciones.length === 0) {
                return res.status(400).json({ message: 'Debe enviar un array de posiciones' });
            }

            if (posiciones.length > 50) {
                return res.status(400).json({ message: 'No se pueden crear más de 50 posiciones a la vez' });
            }

            const resultados = [];
            const errores = [];

            const primerItem = posiciones[0];
            const mismoCargo = posiciones.every(p => p.id_cargo_base === primerItem.id_cargo_base);
            const mismoDepartamento = posiciones.every(p => p.id_departamento === primerItem.id_departamento);
            const mismoAnio = posiciones.every(p => p.id_anio_legal === primerItem.id_anio_legal);

            if (!mismoCargo || !mismoDepartamento || !mismoAnio) {
                return res.status(400).json({
                    message: 'Todas las posiciones deben tener el mismo cargo, departamento y año'
                });
            }

            const anioLegal = await AnioLegalModel.getById(primerItem.id_anio_legal);
            if (!anioLegal) return res.status(404).json({ message: 'Año legal no encontrado' });

            const cargoBase = await CargoBaseModel.getById(primerItem.id_cargo_base);
            if (!cargoBase) return res.status(404).json({ message: 'Cargo base no encontrado' });

            const departamento = await DepartamentoModel.findById(primerItem.id_departamento);
            if (!departamento) return res.status(404).json({ message: 'Departamento no encontrado' });

            const sede_ubicacion = departamento.nombre_departamento;

            // ✅ Usar el salario que viene del frontend
            const salarioBase = primerItem.salario_base;
            if (!salarioBase || salarioBase <= 0) {
                return res.status(400).json({ message: 'El salario base es requerido y debe ser mayor a 0' });
            }

            const aplicaAuxilioTransporte = primerItem.aplica_auxilio_transporte;
            const contratoHasta = primerItem.contrato_hasta || null;
            const idFuncionario = primerItem.id_funcionario || null;  // ✅ Capturar id_funcionario

            const codigosPosicion = await generarCodigosPosicionSecuenciales(
                primerItem.id_cargo_base,
                primerItem.id_departamento,
                primerItem.id_anio_legal,
                posiciones.length
            );

            for (let i = 0; i < posiciones.length; i++) {
                try {
                    const result = await PosicionSenaModel.create({
                        id_cargo_base: primerItem.id_cargo_base,
                        id_anio_legal: primerItem.id_anio_legal,
                        codigo_posicion: codigosPosicion[i],
                        id_departamento: primerItem.id_departamento,
                        sede_ubicacion,
                        salario_base: salarioBase,  // ✅ Usar salario recibido
                        aplica_auxilio_transporte: aplicaAuxilioTransporte,
                        bonificacion: 0,
                        fecha_creacion_posicion: new Date(),
                        fecha_eliminacion: null,
                        contrato_hasta: contratoHasta,
                        activo: true,
                        id_funcionario: idFuncionario  // ✅ Pasar id_funcionario al modelo
                    });

                    resultados.push({
                        id_posicion: result.id_posicion_sena,
                        codigo_posicion: codigosPosicion[i],
                        success: true
                    });

                } catch (error) {
                    errores.push({ index: i, error: error.message });
                }
            }

            res.status(201).json({
                message: `Procesadas ${resultados.length} posiciones${errores.length > 0 ? `, ${errores.length} errores` : ''}`,
                data: { exitosas: resultados, errores }
            });

        } catch (error) {
            console.error('Error en create posiciones SENA:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // READ
    // =============================================
    getAllByAnio: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;
            const { id_cargo_base, id_departamento, estado } = req.query;

            const filtros = {
                id_cargo_base: id_cargo_base ? parseInt(id_cargo_base) : undefined,
                id_departamento: id_departamento ? parseInt(id_departamento) : undefined,
                estado: estado || undefined
            };

            const posiciones = await PosicionSenaModel.getAllByAnio(id_anio_legal, filtros);

            res.json({
                data: posiciones,
                total: posiciones.length
            });

        } catch (error) {
            console.error('Error en getAllByAnio:', error);
            res.status(500).json({ message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const posicion = await PosicionSenaModel.getById(id);

            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            res.json({ data: posicion });

        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({ message: error.message });
        }
    },

    getDisponibilidad: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;
            const disponibilidad = await PosicionSenaModel.getDisponibilidad(id_anio_legal);

            res.json({
                data: disponibilidad,
                total: disponibilidad.length
            });

        } catch (error) {
            console.error('Error en getDisponibilidad:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // MÉTODOS ESPECÍFICOS DE SENA
    // =============================================
    getProximosAVencer: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;
            const { dias = 30 } = req.query;

            const resultados = await PosicionSenaModel.getProximosAVencer(id_anio_legal, dias);

            res.json({
                data: resultados,
                total: resultados.length
            });

        } catch (error) {
            console.error('Error en getProximosAVencer:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // UPDATE
    // =============================================
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const posicion = await PosicionSenaModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            await PosicionSenaModel.update(id, data);

            res.json({ message: 'Posición actualizada exitosamente' });

        } catch (error) {
            console.error('Error en update:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // DELETE
    // =============================================
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const posicion = await PosicionSenaModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            if (posicion.id_funcionario) {
                return res.status(400).json({
                    message: 'No se puede eliminar una posición ocupada. Primero debe desasignar el aprendiz.'
                });
            }

            await PosicionSenaModel.delete(id, new Date());

            res.json({ message: 'Posición eliminada exitosamente' });

        } catch (error) {
            console.error('Error en delete:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // ASIGNACIÓN DE APRENDICES
    // =============================================
    asignarAprendiz: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_funcionario, contrato_hasta } = req.body;

            if (!id_funcionario) {
                return res.status(400).json({ message: 'El ID del funcionario es requerido' });
            }

            if (!contrato_hasta) {
                return res.status(400).json({ message: 'La fecha de finalización del contrato es requerida' });
            }

            const posicion = await PosicionSenaModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            if (posicion.id_funcionario) {
                return res.status(400).json({ message: 'La posición ya tiene un aprendiz asignado' });
            }

            const funcionario = await FuncionarioModel.getById(id_funcionario);
            if (!funcionario) {
                return res.status(404).json({ message: 'Funcionario no encontrado' });
            }

            const result = await PosicionSenaModel.asignarAprendiz(id, id_funcionario, contrato_hasta);

            res.json({
                message: 'Aprendiz asignado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en asignarAprendiz:', error);
            res.status(500).json({ message: error.message });
        }
    },

    desasignarAprendiz: async (req, res) => {
        try {
            const { id } = req.params;

            const posicion = await PosicionSenaModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            if (!posicion.id_funcionario) {
                return res.status(400).json({ message: 'La posición no tiene aprendiz asignado' });
            }

            const result = await PosicionSenaModel.desasignarAprendiz(id);

            res.json({
                message: 'Aprendiz desasignado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en desasignarAprendiz:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // COPIA DE AÑO
    // =============================================
    copyFromYear: async (req, res) => {
        try {
            const { id_anio_origen, id_anio_destino } = req.params;

            const anioOrigen = await AnioLegalModel.getById(id_anio_origen);
            const anioDestino = await AnioLegalModel.getById(id_anio_destino);

            if (!anioOrigen || !anioDestino) {
                return res.status(404).json({ message: 'Año de origen o destino no encontrado' });
            }

            const cantidad = await PosicionSenaModel.copyFromYear(
                id_anio_origen,
                id_anio_destino,
                new Date()
            );

            res.json({
                message: 'Posiciones SENA copiadas exitosamente',
                data: {
                    posiciones_copiadas: cantidad.posiciones,
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

module.exports = posicionSenaController;