const AnioLegalModel = require('../models/AnioLegalModel');
const HistoricoSalarioModel = require('../models/HistoricoSalarioModel');
const PosicionCargoModel = require('../models/PosicionCargoModel');

const anioLegalController = {
    // 1. CREAR NUEVO AÑO LEGAL
    create: async (req, res) => {
        try {
            const data = req.body;

            // Validar campos obligatorios
            if (!data.anio || !data.salario_minimo_legal || !data.auxilio_transporte) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos año, salario_minimo_legal y auxilio_transporte son obligatorios'
                });
            }

            // Validar que el año no exista ya
            const existeAnio = await AnioLegalModel.exists(data.anio);
            if (existeAnio) {
                return res.status(400).json({
                    success: false,
                    message: `El año ${data.anio} ya está registrado en el sistema`
                });
            }

            // Validar que el año sea válido (no futuro lejano, no pasado muy antiguo)
            const añoActual = new Date().getFullYear();
            if (data.anio < 2000 || data.anio > añoActual + 2) {
                return res.status(400).json({
                    success: false,
                    message: `El año debe estar entre 2000 y ${añoActual + 2}`
                });
            }

            // Crear el año legal
            const result = await AnioLegalModel.create(data);

            // 🔥 Si se creó con activo = true, desactivar los demás años
            if (data.activo === true) {
                await AnioLegalModel.setActivo(result.id, true);
            }

            res.status(201).json({
                success: true,
                message: 'Año legal creado exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error en create anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el año legal',
                error: error.message
            });
        }
    },

    // 2. OBTENER TODOS LOS AÑOS LEGALES
    getAll: async (req, res) => {
        try {
            const { activo } = req.query;

            // Convertir string a boolean si viene como parámetro
            const filtroActivo = activo !== undefined ? activo === 'true' : null;

            const anios = await AnioLegalModel.getAll(filtroActivo);

            res.status(200).json({
                success: true,
                message: 'Años legales obtenidos exitosamente',
                data: anios,
                total: anios.length
            });

        } catch (error) {
            console.error('Error en getAll anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los años legales',
                error: error.message
            });
        }
    },

    // 3. OBTENER AÑO ACTUAL (ACTIVO)
    getCurrentYear: async (req, res) => {
        try {
            const anioActual = await AnioLegalModel.getCurrentYear();

            if (!anioActual) {
                return res.status(404).json({
                    success: false,
                    message: 'No hay un año legal activo configurado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Año legal actual obtenido exitosamente',
                data: anioActual
            });

        } catch (error) {
            console.error('Error en getCurrentYear anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el año legal actual',
                error: error.message
            });
        }
    },

    // 4. OBTENER AÑO LEGAL POR ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const anio = await AnioLegalModel.getById(id);

            if (!anio) {
                return res.status(404).json({
                    success: false,
                    message: `Año legal con ID ${id} no encontrado`
                });
            }

            res.status(200).json({
                success: true,
                message: 'Año legal obtenido exitosamente',
                data: anio
            });

        } catch (error) {
            console.error('Error en getById anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el año legal',
                error: error.message
            });
        }
    },

    // 5. OBTENER AÑO LEGAL POR NÚMERO DE AÑO
    getByAnio: async (req, res) => {
        try {
            const { anio } = req.params;

            const anioLegal = await AnioLegalModel.getByAnio(anio);

            if (!anioLegal) {
                return res.status(404).json({
                    success: false,
                    message: `Año legal ${anio} no encontrado`
                });
            }

            res.status(200).json({
                success: true,
                message: 'Año legal obtenido exitosamente',
                data: anioLegal
            });

        } catch (error) {
            console.error('Error en getByAnio anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el año legal',
                error: error.message
            });
        }
    },

    // 6. ACTUALIZAR AÑO LEGAL
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            // Verificar que el año existe
            const anioExistente = await AnioLegalModel.getById(id);
            if (!anioExistente) {
                return res.status(404).json({
                    success: false,
                    message: `Año legal con ID ${id} no encontrado`
                });
            }

            // Validar que no haya duplicados si se cambia el año
            if (data.anio && data.anio !== anioExistente.anio) {
                const existeAnio = await AnioLegalModel.exists(data.anio);
                if (existeAnio) {
                    return res.status(400).json({
                        success: false,
                        message: `El año ${data.anio} ya está registrado en el sistema`
                    });
                }
            }

            // Validar año
            if (data.anio) {
                const añoActual = new Date().getFullYear();
                if (data.anio < 2000 || data.anio > añoActual + 2) {
                    return res.status(400).json({
                        success: false,
                        message: `El año debe estar entre 2000 y ${añoActual + 2}`
                    });
                }
            }

            const result = await AnioLegalModel.update(id, data);

            res.status(200).json({
                success: true,
                message: 'Año legal actualizado exitosamente',
                data: {
                    id,
                    ...data
                }
            });

        } catch (error) {
            console.error('Error en update anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el año legal',
                error: error.message
            });
        }
    },

    // 7. ACTIVAR/DESACTIVAR AÑO LEGAL
    setActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (activo === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo activo es obligatorio'
                });
            }

            // Verificar que el año existe
            const anioExistente = await AnioLegalModel.getById(id);
            if (!anioExistente) {
                return res.status(404).json({
                    success: false,
                    message: `Año legal con ID ${id} no encontrado`
                });
            }

            const result = await AnioLegalModel.setActivo(id, activo);

            res.status(200).json({
                success: true,
                message: activo ? 'Año legal activado exitosamente' : 'Año legal desactivado exitosamente',
                data: {
                    id,
                    activo
                }
            });

        } catch (error) {
            console.error('Error en setActivo anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado del año legal',
                error: error.message
            });
        }
    },

    // 8. ELIMINAR AÑO LEGAL (SOLO SI NO TIENE DEPENDENCIAS)
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar que el año existe
            const anioExistente = await AnioLegalModel.getById(id);
            if (!anioExistente) {
                return res.status(404).json({
                    success: false,
                    message: `Año legal con ID ${id} no encontrado`
                });
            }

            // Verificar si tiene dependencias (posiciones de cargo)
            const posiciones = await PosicionCargoModel.getAllByAnio(id);
            if (posiciones && posiciones.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `No se puede eliminar el año porque tiene ${posiciones.length} posiciones de cargo asociadas. Desactive el año en su lugar.`,
                    dependencias: {
                        posiciones: posiciones.length
                    }
                });
            }

            // Soft delete - desactivar en lugar de eliminar
            const result = await AnioLegalModel.setActivo(id, false);

            res.status(200).json({
                success: true,
                message: 'Año legal desactivado exitosamente',
                data: {
                    id,
                    activo: false
                }
            });

        } catch (error) {
            console.error('Error en delete anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el año legal',
                error: error.message
            });
        }
    },

    // 9. APERTURA DE AÑO NUEVO
    abrirNuevoAnio: async (req, res) => {
        try {
            const {
                nuevo_anio,
                salario_minimo_legal,
                auxilio_transporte,
                copiar_salarios = true,
                copiar_posiciones = true,
                incremento_salario = 0,
                incremento_auxilio = 0
            } = req.body;

            // Validaciones
            if (!nuevo_anio || !salario_minimo_legal || !auxilio_transporte) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos nuevo_anio, salario_minimo_legal y auxilio_transporte son obligatorios'
                });
            }

            // Validar que el año no exista
            const existeAnio = await AnioLegalModel.exists(nuevo_anio);
            if (existeAnio) {
                return res.status(400).json({
                    success: false,
                    message: `El año ${nuevo_anio} ya está registrado`
                });
            }

            // Obtener año actual
            const anioActual = await AnioLegalModel.getCurrentYear();
            if (!anioActual) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay un año activo para copiar'
                });
            }

            // 1. Crear nuevo año legal
            const nuevoAnio = await AnioLegalModel.create({
                anio: nuevo_anio,
                salario_minimo_legal,
                auxilio_transporte,
                activo: false // No activar automáticamente
            });

            // 2. Copiar salarios históricos si se solicita
            let salariosCopiados = 0;
            if (copiar_salarios) {
                // Aplicar incremento si se especifica
                if (incremento_salario > 0) {
                    const salariosOrigen = await HistoricoSalarioModel.getHistorialByCargo(anioActual.id_anio_legal);
                    for (const salario of salariosOrigen) {
                        await HistoricoSalarioModel.upsert({
                            id_cargo_base: salario.id_cargo_base,
                            id_anio_legal: nuevoAnio.id,
                            salario_base: Math.round(salario.salario_base * (1 + incremento_salario / 100)),
                            bonificacion: salario.bonificacion,
                            aplica_auxilio_transporte: salario.aplica_auxilio_transporte,
                            fecha_desde: new Date(`${nuevo_anio}-01-01`)
                        });
                        salariosCopiados++;
                    }
                } else {
                    salariosCopiados = await HistoricoSalarioModel.copyFromYear(
                        anioActual.id_anio_legal,
                        nuevoAnio.id,
                        new Date(`${nuevo_anio}-01-01`)
                    );
                }
            }

            // 3. Copiar posiciones si se solicita
            let posicionesCopiadas = 0;
            if (copiar_posiciones) {
                posicionesCopiadas = await PosicionCargoModel.copyFromYear(
                    anioActual.id_anio_legal,
                    nuevoAnio.id,
                    new Date(`${nuevo_anio}-01-01`)
                );
            }

            res.status(201).json({
                success: true,
                message: 'Año nuevo abierto exitosamente',
                data: {
                    anio_legal: nuevoAnio,
                    resumen: {
                        salarios_copiados: salariosCopiados,
                        posiciones_copiadas: posicionesCopiadas,
                        año_origen: anioActual.anio,
                        año_destino: nuevo_anio
                    }
                }
            });

        } catch (error) {
            console.error('Error en abrirNuevoAnio:', error);
            res.status(500).json({
                success: false,
                message: 'Error al abrir nuevo año',
                error: error.message
            });
        }
    },

    // 10. OBTENER ESTADÍSTICAS DEL AÑO
    getEstadisticas: async (req, res) => {
        try {
            const { id } = req.params;

            const anio = await AnioLegalModel.getById(id);
            if (!anio) {
                return res.status(404).json({
                    success: false,
                    message: `Año legal con ID ${id} no encontrado`
                });
            }

            // Obtener posiciones del año
            const posiciones = await PosicionCargoModel.getAllByAnio(id);

            // Calcular estadísticas
            const totalPosiciones = posiciones.length;
            const posicionesOcupadas = posiciones.filter(p => p.id_funcionario).length;
            const posicionesDisponibles = totalPosiciones - posicionesOcupadas;

            // Agrupar por departamento
            const porDepartamento = {};
            posiciones.forEach(p => {
                if (!porDepartamento[p.nombre_departamento]) {
                    porDepartamento[p.nombre_departamento] = {
                        total: 0,
                        ocupadas: 0
                    };
                }
                porDepartamento[p.nombre_departamento].total++;
                if (p.id_funcionario) porDepartamento[p.nombre_departamento].ocupadas++;
            });

            res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente',
                data: {
                    anio: anio.anio,
                    salario_minimo: anio.salario_minimo_legal,
                    auxilio_transporte: anio.auxilio_transporte,
                    activo: anio.activo,
                    planta: {
                        total_posiciones: totalPosiciones,
                        posiciones_ocupadas: posicionesOcupadas,
                        posiciones_disponibles: posicionesDisponibles,
                        porcentaje_ocupacion: totalPosiciones > 0 ?
                            ((posicionesOcupadas / totalPosiciones) * 100).toFixed(2) : 0
                    },
                    distribucion_departamentos: porDepartamento
                }
            });

        } catch (error) {
            console.error('Error en getEstadisticas anioLegal:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del año',
                error: error.message
            });
        }
    },

    // 11. COMPARAR DOS AÑOS
    compararAnios: async (req, res) => {
        try {
            const { id1, id2 } = req.params;

            const anio1 = await AnioLegalModel.getById(id1);
            const anio2 = await AnioLegalModel.getById(id2);

            if (!anio1 || !anio2) {
                return res.status(404).json({
                    success: false,
                    message: 'Uno o ambos años no fueron encontrados'
                });
            }

            // Obtener posiciones de ambos años
            const posiciones1 = await PosicionCargoModel.getAllByAnio(id1);
            const posiciones2 = await PosicionCargoModel.getAllByAnio(id2);

            res.status(200).json({
                success: true,
                message: 'Comparación realizada exitosamente',
                data: {
                    año1: {
                        anio: anio1.anio,
                        salario_minimo: anio1.salario_minimo_legal,
                        auxilio: anio1.auxilio_transporte,
                        total_posiciones: posiciones1.length
                    },
                    año2: {
                        anio: anio2.anio,
                        salario_minimo: anio2.salario_minimo_legal,
                        auxilio: anio2.auxilio_transporte,
                        total_posiciones: posiciones2.length
                    },
                    diferencias: {
                        incremento_salario: ((anio2.salario_minimo_legal / anio1.salario_minimo_legal - 1) * 100).toFixed(2) + '%',
                        incremento_auxilio: ((anio2.auxilio_transporte / anio1.auxilio_transporte - 1) * 100).toFixed(2) + '%',
                        variacion_posiciones: posiciones2.length - posiciones1.length
                    }
                }
            });

        } catch (error) {
            console.error('Error en compararAnios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al comparar años',
                error: error.message
            });
        }
    }
};

module.exports = anioLegalController;