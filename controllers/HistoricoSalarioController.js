const HistoricoSalarioModel = require('../models/HistoricoSalarioModel');
const CargoBaseModel = require('../models/CargoBaseModel');
const AnioLegalModel = require('../models/AnioLegalModel');

const historicoSalarioController = {
    // 1. CREAR O ACTUALIZAR SALARIO HISTÓRICO (UPSERT)
    upsert: async (req, res) => {
        try {
            const {
                id_cargo_base,
                id_anio_legal,
                salario_base,
                bonificacion,
                aplica_auxilio_transporte,
                fecha_desde,
                activo
            } = req.body;

            // Validaciones obligatorias
            if (!id_cargo_base || !id_anio_legal || !salario_base) {
                return res.status(400).json({
                    message: 'id_cargo_base, id_anio_legal y salario_base son requeridos'
                });
            }

            // Validar que el cargo base exista
            const cargo = await CargoBaseModel.getById(id_cargo_base);
            if (!cargo) {
                return res.status(404).json({
                    message: 'El cargo base no existe'
                });
            }

            // Validar que el año legal exista
            const anio = await AnioLegalModel.getById(id_anio_legal);
            if (!anio) {
                return res.status(404).json({
                    message: 'El año legal no existe'
                });
            }

            // Validar que el salario base no sea menor al mínimo legal
            if (salario_base < anio.salario_minimo_legal) {
                return res.status(400).json({
                    message: `El salario base no puede ser menor al salario mínimo legal (${anio.salario_minimo_legal})`
                });
            }

            const result = await HistoricoSalarioModel.upsert({
                id_cargo_base,
                id_anio_legal,
                salario_base,
                bonificacion: bonificacion || 0,
                aplica_auxilio_transporte: aplica_auxilio_transporte !== undefined ? aplica_auxilio_transporte : true,
                fecha_desde: fecha_desde || new Date(),
                activo: activo !== undefined ? activo : true
            });

            res.status(201).json({
                message: 'Salario histórico guardado exitosamente',
                data: {
                    id_cargo_base,
                    id_anio_legal,
                    salario_base,
                    bonificacion: bonificacion || 0,
                    aplica_auxilio_transporte: aplica_auxilio_transporte !== undefined ? aplica_auxilio_transporte : true
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. OBTENER SALARIO POR CARGO Y AÑO
    getByCargoAndAnio: async (req, res) => {
        try {
            const { id_cargo_base, id_anio_legal } = req.params;

            const data = await HistoricoSalarioModel.getByCargoAndAnio(id_cargo_base, id_anio_legal);

            if (!data) {
                return res.status(404).json({
                    message: 'No hay salario configurado para este cargo en el año especificado'
                });
            }

            // Enriquecer con información adicional
            const cargo = await CargoBaseModel.getById(id_cargo_base);
            const anio = await AnioLegalModel.getById(id_anio_legal);

            res.json({
                data: {
                    ...data,
                    cargo: cargo ? {
                        id: cargo.id_cargo_base,
                        nombre: cargo.nombre_cargo,
                        codigo: cargo.codigo_cargo
                    } : null,
                    anio: anio ? {
                        id: anio.id_anio_legal,
                        anio: anio.anio,
                        salario_minimo: anio.salario_minimo_legal,
                        auxilio_transporte: anio.auxilio_transporte
                    } : null
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. OBTENER HISTORIAL COMPLETO DE UN CARGO
    getHistorialByCargo: async (req, res) => {
        try {
            const { id_cargo_base } = req.params;

            const cargo = await CargoBaseModel.getById(id_cargo_base);
            if (!cargo) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            const data = await HistoricoSalarioModel.getHistorialByCargo(id_cargo_base);

            res.json({
                data,
                cargo: {
                    id: cargo.id_cargo_base,
                    nombre: cargo.nombre_cargo,
                    codigo: cargo.codigo_cargo
                },
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. ACTUALIZAR SALARIO HISTÓRICO
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                salario_base,
                bonificacion,
                aplica_auxilio_transporte,
                fecha_desde,
                fecha_hasta,
                activo
            } = req.body;

            // Validar que el registro existe
            const [existe] = await pool.query(
                'SELECT * FROM historico_salarios_cargo WHERE id_historico_salario = ?',
                [id]
            );

            if (!existe[0]) {
                return res.status(404).json({
                    message: 'Registro de salario histórico no encontrado'
                });
            }

            // Si se actualiza salario_base, validar contra mínimo legal
            if (salario_base) {
                const anio = await AnioLegalModel.getById(existe[0].id_anio_legal);
                if (salario_base < anio.salario_minimo_legal) {
                    return res.status(400).json({
                        message: `El salario base no puede ser menor al salario mínimo legal (${anio.salario_minimo_legal})`
                    });
                }
            }

            await HistoricoSalarioModel.update(id, {
                salario_base: salario_base || existe[0].salario_base,
                bonificacion: bonificacion !== undefined ? bonificacion : existe[0].bonificacion,
                aplica_auxilio_transporte: aplica_auxilio_transporte !== undefined ? aplica_auxilio_transporte : existe[0].aplica_auxilio_transporte,
                fecha_desde: fecha_desde || existe[0].fecha_desde,
                fecha_hasta: fecha_hasta !== undefined ? fecha_hasta : existe[0].fecha_hasta,
                activo: activo !== undefined ? activo : existe[0].activo
            });

            res.json({
                message: 'Salario histórico actualizado exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. DESACTIVAR SALARIO HISTÓRICO
    deactivate: async (req, res) => {
        try {
            const { id } = req.params;

            const [existe] = await pool.query(
                'SELECT * FROM historico_salarios_cargo WHERE id_historico_salario = ?',
                [id]
            );

            if (!existe[0]) {
                return res.status(404).json({
                    message: 'Registro de salario histórico no encontrado'
                });
            }

            await HistoricoSalarioModel.deactivate(id);

            res.json({
                message: 'Salario histórico desactivado exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. COPIAR SALARIOS DE UN AÑO A OTRO
    copyFromYear: async (req, res) => {
        try {
            const { id_anio_origen, id_anio_destino } = req.params;
            const { fecha_desde } = req.body;

            // Validar que los años existan
            const anioOrigen = await AnioLegalModel.getById(id_anio_origen);
            const anioDestino = await AnioLegalModel.getById(id_anio_destino);

            if (!anioOrigen) {
                return res.status(404).json({
                    message: 'Año legal origen no encontrado'
                });
            }

            if (!anioDestino) {
                return res.status(404).json({
                    message: 'Año legal destino no encontrado'
                });
            }

            // Validar que no sea el mismo año
            if (id_anio_origen === id_anio_destino) {
                return res.status(400).json({
                    message: 'El año origen y destino deben ser diferentes'
                });
            }

            const result = await HistoricoSalarioModel.copyFromYear(
                id_anio_origen,
                id_anio_destino,
                fecha_desde || new Date(`${anioDestino.anio}-01-01`)
            );

            res.status(201).json({
                message: 'Salarios copiados exitosamente',
                data: {
                    año_origen: anioOrigen.anio,
                    año_destino: anioDestino.anio,
                    salarios_copiados: result.affectedRows,
                    fecha_desde: fecha_desde || `${anioDestino.anio}-01-01`
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 7. OBTENER TODOS LOS SALARIOS DE UN AÑO
    getByAnio: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            const anio = await AnioLegalModel.getById(id_anio_legal);
            if (!anio) {
                return res.status(404).json({
                    message: 'Año legal no encontrado'
                });
            }

            const [rows] = await pool.query(`
                SELECT 
                    hsc.*,
                    cb.nombre_cargo,
                    cb.codigo_cargo,
                    cb.nivel_cargo
                FROM historico_salarios_cargo hsc
                INNER JOIN cargos_base cb ON hsc.id_cargo_base = cb.id_cargo_base
                WHERE hsc.id_anio_legal = ? AND hsc.activo = true
                ORDER BY cb.nombre_cargo ASC
            `, [id_anio_legal]);

            res.json({
                data: rows,
                anio: {
                    id: anio.id_anio_legal,
                    anio: anio.anio,
                    salario_minimo: anio.salario_minimo_legal,
                    auxilio_transporte: anio.auxilio_transporte
                },
                total: rows.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 8. OBTENER COMPARATIVO DE SALARIOS ENTRE AÑOS
    getComparativo: async (req, res) => {
        try {
            const { id_cargo_base } = req.params;
            const { anio_inicio, anio_fin } = req.query;

            const cargo = await CargoBaseModel.getById(id_cargo_base);
            if (!cargo) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            let query = `
                SELECT 
                    hsc.*,
                    al.anio
                FROM historico_salarios_cargo hsc
                INNER JOIN anios_legales al ON hsc.id_anio_legal = al.id_anio_legal
                WHERE hsc.id_cargo_base = ? AND hsc.activo = true
            `;
            const params = [id_cargo_base];

            if (anio_inicio && anio_fin) {
                query += ' AND al.anio BETWEEN ? AND ?';
                params.push(anio_inicio, anio_fin);
            }

            query += ' ORDER BY al.anio ASC';

            const [rows] = await pool.query(query, params);

            // Calcular variaciones
            const historial = rows.map((item, index) => {
                const itemAnterior = rows[index - 1];
                const variacion = itemAnterior ?
                    ((item.salario_base - itemAnterior.salario_base) / itemAnterior.salario_base * 100).toFixed(2) :
                    null;

                return {
                    ...item,
                    variacion_porcentual: variacion ? `${variacion}%` : null,
                    incremento: itemAnterior ? item.salario_base - itemAnterior.salario_base : null
                };
            });

            res.json({
                data: historial,
                cargo: {
                    id: cargo.id_cargo_base,
                    nombre: cargo.nombre_cargo,
                    codigo: cargo.codigo_cargo
                },
                total: historial.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 9. APLICAR INCREMENTO PORCENTUAL A TODOS LOS CARGOS
    aplicarIncremento: async (req, res) => {
        try {
            const { id_anio_origen, id_anio_destino } = req.params;
            const { porcentaje, fecha_desde } = req.body;

            if (!porcentaje || porcentaje <= 0) {
                return res.status(400).json({
                    message: 'El porcentaje de incremento es requerido y debe ser mayor a 0'
                });
            }

            // Validar años
            const anioOrigen = await AnioLegalModel.getById(id_anio_origen);
            const anioDestino = await AnioLegalModel.getById(id_anio_destino);

            if (!anioOrigen || !anioDestino) {
                return res.status(404).json({
                    message: 'Año legal origen o destino no encontrado'
                });
            }

            // Obtener salarios del año origen
            const salariosOrigen = await HistoricoSalarioModel.getByAnio(id_anio_origen);

            let contador = 0;
            for (const salario of salariosOrigen) {
                const nuevoSalario = Math.round(salario.salario_base * (1 + porcentaje / 100));

                await HistoricoSalarioModel.upsert({
                    id_cargo_base: salario.id_cargo_base,
                    id_anio_legal: id_anio_destino,
                    salario_base: nuevoSalario,
                    bonificacion: salario.bonificacion,
                    aplica_auxilio_transporte: salario.aplica_auxilio_transporte,
                    fecha_desde: fecha_desde || new Date(`${anioDestino.anio}-01-01`),
                    activo: true
                });
                contador++;
            }

            res.status(201).json({
                message: 'Incremento aplicado exitosamente',
                data: {
                    año_origen: anioOrigen.anio,
                    año_destino: anioDestino.anio,
                    porcentaje_aplicado: porcentaje,
                    cargos_actualizados: contador,
                    fecha_desde: fecha_desde || `${anioDestino.anio}-01-01`
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 10. ACTIVAR/DESACTIVAR SALARIO
    setActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (activo === undefined) {
                return res.status(400).json({
                    message: 'El estado activo es requerido'
                });
            }

            const [existe] = await pool.query(
                'SELECT * FROM historico_salarios_cargo WHERE id_historico_salario = ?',
                [id]
            );

            if (!existe[0]) {
                return res.status(404).json({
                    message: 'Registro de salario histórico no encontrado'
                });
            }

            await HistoricoSalarioModel.update(id, {
                ...existe[0],
                activo
            });

            res.json({
                message: activo ? 'Salario histórico activado exitosamente' : 'Salario histórico desactivado exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 11. Configurar salarios por lote (múltiples cargos)
    configurarLote: async (req, res) => {
        try {
            const { ids_cargos, id_anio_legal, salario_base, bonificacion, aplica_auxilio_transporte, fecha_desde } = req.body;

            // Validaciones
            if (!ids_cargos || !Array.isArray(ids_cargos) || ids_cargos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe seleccionar al menos un cargo'
                });
            }

            if (!id_anio_legal) {
                return res.status(400).json({
                    success: false,
                    message: 'El año legal es requerido'
                });
            }

            if (!salario_base || salario_base <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El salario base debe ser mayor a 0'
                });
            }

            // Verificar que el año existe
            const anioLegal = await AnioLegalModel.getById(id_anio_legal);
            if (!anioLegal) {
                return res.status(404).json({
                    success: false,
                    message: 'Año legal no encontrado'
                });
            }

            // Procesar cada cargo
            const resultados = [];
            const errores = [];

            for (const id_cargo_base of ids_cargos) {
                try {
                    // Verificar que el cargo existe
                    const cargo = await CargoBaseModel.getById(id_cargo_base);
                    if (!cargo) {
                        errores.push({ id_cargo: id_cargo_base, error: 'Cargo no encontrado' });
                        continue;
                    }

                    // Verificar si requiere bonificación
                    const bonificacionFinal = cargo.requiere_bonificacion ? (bonificacion || 0) : 0;

                    // Guardar/actualizar salario
                    await HistoricoSalarioModel.upsert({
                        id_cargo_base,
                        id_anio_legal,
                        salario_base,
                        bonificacion: bonificacionFinal,
                        aplica_auxilio_transporte,
                        fecha_desde: fecha_desde || new Date(),
                        activo: true
                    });

                    resultados.push({
                        id_cargo: id_cargo_base,
                        codigo: cargo.codigo_cargo,
                        nombre: cargo.nombre_cargo,
                        success: true
                    });

                } catch (error) {
                    errores.push({
                        id_cargo: id_cargo_base,
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: `Procesados ${resultados.length} cargos${errores.length > 0 ? `, ${errores.length} errores` : ''}`,
                data: {
                    procesados: resultados.length,
                    errores: errores.length,
                    detalles: {
                        exitosos: resultados,
                        fallidos: errores
                    }
                }
            });

        } catch (error) {
            console.error('Error en configurarLote:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al configurar salarios por lote'
            });
        }
    }
};

module.exports = historicoSalarioController;