const PosicionFijoModel = require('../../models/plantaCargos/PosicionCargoFijoModel');
const AnioLegalModel = require('../../models/plantaCargos/AnioLegalModel');
const CargoBaseModel = require('../../models/plantaCargos/CargoBaseModel');
const DepartamentoModel = require('../../models/plantaCargos/DepartamentosModel');
const HistoricoSalarioModel = require('../../models/plantaCargos/HistoricoSalarioModel');
const MovimientoCargoModel = require('../../models/plantaCargos/MovimientoCargoModel');
const FuncionarioModel = require('../../models/plantaCargos/FuncionarioModel');
const pool = require('../../config/ConectDb');

// Función auxiliar para generar códigos secuenciales
async function generarCodigosPosicionSecuenciales(idCargoBase, idDepartamento, idAnioLegal, cantidad) {
    const cargoBase = await CargoBaseModel.getById(idCargoBase);
    const anioLegal = await AnioLegalModel.getById(idAnioLegal);
    const departamento = await DepartamentoModel.findById(idDepartamento);

    const prefijoCargo = cargoBase.codigo_cargo;
    const codDepto = departamento.codigo_ext.toString().padStart(4, '0');

    // Obtener posiciones existentes (activas e inactivas) para evitar duplicados
    const [todasLasPosiciones] = await pool.query(`
        SELECT codigo_posicion 
        FROM posiciones_cargo_fijo 
        WHERE id_anio_legal = ? 
          AND id_cargo_base = ? 
          AND id_departamento = ?
    `, [idAnioLegal, idCargoBase, idDepartamento]);

    const codigosExistentes = new Set(todasLasPosiciones.map(p => p.codigo_posicion));

    // Obtener solo activas para el máximo número
    const posicionesActivas = await PosicionFijoModel.getAllByAnio(idAnioLegal, {
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

const posicionFijoController = {
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

            const salarioConfigurado = await HistoricoSalarioModel.getByCargoAndAnio(
                primerItem.id_cargo_base,
                primerItem.id_anio_legal
            );

            if (!salarioConfigurado) {
                return res.status(400).json({
                    message: 'El cargo seleccionado no tiene salario configurado para el año actual'
                });
            }

            const dosSMLV = anioLegal.salario_minimo_legal * 2;
            const aplicaAuxilioCalculado = salarioConfigurado.salario_base <= dosSMLV;
            const sede_ubicacion = departamento.nombre_departamento;

            const codigosPosicion = await generarCodigosPosicionSecuenciales(
                primerItem.id_cargo_base,
                primerItem.id_departamento,
                primerItem.id_anio_legal,
                posiciones.length
            );

            for (let i = 0; i < posiciones.length; i++) {
                try {
                    const result = await PosicionFijoModel.create({
                        id_cargo_base: primerItem.id_cargo_base,
                        id_anio_legal: primerItem.id_anio_legal,
                        codigo_posicion: codigosPosicion[i],
                        id_departamento: primerItem.id_departamento,
                        sede_ubicacion,
                        salario_base: salarioConfigurado.salario_base,
                        aplica_auxilio_transporte: aplicaAuxilioCalculado,
                        bonificacion: salarioConfigurado.bonificacion || 0,
                        fecha_creacion_posicion: new Date(),
                        activo: true,
                        id_funcionario: null,
                        encargado: 0
                    });

                    resultados.push({
                        id_posicion: result.id_posicion_fijo,
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
            console.error('Error en create posiciones fijas:', error);
            res.status(500).json({ message: error.message });
        }
    },


//     create: async (req, res) => {
//     try {
//         const { posiciones } = req.body;

//         if (!posiciones || !Array.isArray(posiciones) || posiciones.length === 0) {
//             return res.status(400).json({ message: 'Debe enviar un array de posiciones' });
//         }

//         if (posiciones.length > 50) {
//             return res.status(400).json({ message: 'No se pueden crear más de 50 posiciones a la vez' });
//         }

//         const resultados = [];
//         const errores = [];

//         // Validar que todos tengan el mismo cargo, departamento y año
//         const primerItem = posiciones[0];
//         const mismoCargo = posiciones.every(p => p.id_cargo_base === primerItem.id_cargo_base);
//         const mismoDepartamento = posiciones.every(p => p.id_departamento === primerItem.id_departamento);
//         const mismoAnio = posiciones.every(p => p.id_anio_legal === primerItem.id_anio_legal);

//         if (!mismoCargo || !mismoDepartamento || !mismoAnio) {
//             return res.status(400).json({
//                 message: 'Todas las posiciones deben tener el mismo cargo, departamento y año'
//             });
//         }

//         // Validar existencia
//         const anioLegal = await AnioLegalModel.getById(primerItem.id_anio_legal);
//         if (!anioLegal) return res.status(404).json({ message: 'Año legal no encontrado' });

//         const cargoBase = await CargoBaseModel.getById(primerItem.id_cargo_base);
//         if (!cargoBase) return res.status(404).json({ message: 'Cargo base no encontrado' });

//         const departamento = await DepartamentoModel.findById(primerItem.id_departamento);
//         if (!departamento) return res.status(404).json({ message: 'Departamento no encontrado' });

//         // Validar que el salario no sea menor al mínimo legal
//         const salarioMinimoLegal = anioLegal.salario_minimo_legal;
//         if (primerItem.salario_base < salarioMinimoLegal) {
//             return res.status(400).json({
//                 message: `El salario (${primerItem.salario_base}) no puede ser menor al mínimo legal (${salarioMinimoLegal})`
//             });
//         }

//         const sede_ubicacion = departamento.nombre_departamento;

//         const codigosPosicion = await generarCodigosPosicionSecuenciales(
//             primerItem.id_cargo_base,
//             primerItem.id_departamento,
//             primerItem.id_anio_legal,
//             posiciones.length
//         );

//         for (let i = 0; i < posiciones.length; i++) {
//             try {
//                 const posicionActual = posiciones[i];
                
//                 const result = await PosicionFijoModel.create({
//                     id_cargo_base: posicionActual.id_cargo_base,
//                     id_anio_legal: posicionActual.id_anio_legal,
//                     codigo_posicion: codigosPosicion[i],
//                     id_departamento: posicionActual.id_departamento,
//                     sede_ubicacion,
//                     salario_base: posicionActual.salario_base, // ✅ USAR el enviado
//                     aplica_auxilio_transporte: posicionActual.aplica_auxilio_transporte, // ✅ USAR el enviado
//                     bonificacion: posicionActual.bonificacion || 0, // ✅ USAR el enviado
//                     fecha_creacion_posicion: posicionActual.fecha_desde ? new Date(posicionActual.fecha_desde) : new Date(), // ✅ USAR fecha enviada
//                     activo: posicionActual.activo !== undefined ? posicionActual.activo : true,
//                     id_funcionario: posicionActual.id_funcionario || null, // ✅ USAR el enviado
//                     encargado: posicionActual.encargado || 0
//                 });

//                 resultados.push({
//                     id_posicion: result.id_posicion_fijo,
//                     codigo_posicion: codigosPosicion[i],
//                     success: true
//                 });

//             } catch (error) {
//                 errores.push({ index: i, error: error.message });
//             }
//         }

//         res.status(201).json({
//             message: `Procesadas ${resultados.length} posiciones${errores.length > 0 ? `, ${errores.length} errores` : ''}`,
//             data: { exitosas: resultados, errores }
//         });

//     } catch (error) {
//         console.error('Error en create posiciones fijas:', error);
//         res.status(500).json({ message: error.message });
//     }
// },

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

            const posiciones = await PosicionFijoModel.getAllByAnio(id_anio_legal, filtros);

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
            const posicion = await PosicionFijoModel.getById(id);

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
            const disponibilidad = await PosicionFijoModel.getDisponibilidad(id_anio_legal);

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
    // UPDATE
    // =============================================
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const posicion = await PosicionFijoModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            await PosicionFijoModel.update(id, data);

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
            const { motivo } = req.body;

            const posicion = await PosicionFijoModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            if (posicion.id_funcionario) {
                return res.status(400).json({
                    message: 'No se puede eliminar una posición ocupada. Primero debe desasignar el funcionario.'
                });
            }

            await PosicionFijoModel.delete(id, new Date());

            res.json({ message: 'Posición eliminada exitosamente' });

        } catch (error) {
            console.error('Error en delete:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // ASIGNACIÓN DE FUNCIONARIOS
    // =============================================
    asignarFuncionario: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_funcionario, es_encargado } = req.body;

            if (!id_funcionario) {
                return res.status(400).json({ message: 'El ID del funcionario es requerido' });
            }

            const posicion = await PosicionFijoModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            if (posicion.id_funcionario) {
                return res.status(400).json({ message: 'La posición ya tiene un funcionario asignado' });
            }

            const funcionario = await FuncionarioModel.getById(id_funcionario);
            if (!funcionario) {
                return res.status(404).json({ message: 'Funcionario no encontrado' });
            }

            const result = await PosicionFijoModel.asignarFuncionario(id, id_funcionario, es_encargado || false);

            res.json({
                message: result.tieneOtraPosicion ? 'Funcionario asignado como ENCARGADO' : 'Funcionario asignado',
                data: result
            });

        } catch (error) {
            console.error('Error en asignarFuncionario:', error);
            res.status(500).json({ message: error.message });
        }
    },

    desasignarFuncionario: async (req, res) => {
        try {
            const { id } = req.params;

            const posicion = await PosicionFijoModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            if (!posicion.id_funcionario) {
                return res.status(400).json({ message: 'La posición no tiene funcionario asignado' });
            }

            const result = await PosicionFijoModel.desasignarFuncionario(id);

            res.json({
                message: 'Funcionario desasignado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en desasignarFuncionario:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // =============================================
    // TRASLADOS
    // =============================================
    trasladarCargo: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_nuevo_departamento } = req.body;

            if (!id_nuevo_departamento) {
                return res.status(400).json({ message: 'El ID del nuevo departamento es requerido' });
            }

            const posicion = await PosicionFijoModel.getById(id);
            if (!posicion) {
                return res.status(404).json({ message: 'Posición no encontrada' });
            }

            const result = await PosicionFijoModel.trasladarCargo(id, id_nuevo_departamento);

            res.json({
                message: 'Cargo trasladado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en trasladarCargo:', error);
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

            const cantidad = await PosicionFijoModel.copyFromYear(
                id_anio_origen,
                id_anio_destino,
                new Date()
            );

            res.json({
                message: 'Posiciones copiadas exitosamente',
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

module.exports = posicionFijoController;