const CargoBaseModel = require('../../models/plantaCargos/CargoBaseModel');
const CategoriaDirectorModel = require('../../models/plantaCargos/CategoriaDirectorModel');

const cargoBaseController = {
    // 1. CREAR CARGO BASE
    create: async (req, res) => {
        try {
            const {
                codigo_cargo,
                nombre_cargo,
                requiere_bonificacion,
                es_director_agencia,
                id_categoria_director,
                id_tipo_planta,
                activo
            } = req.body;

            // Validaciones obligatorias
            if (!codigo_cargo || !nombre_cargo) {
                return res.status(400).json({
                    message: 'Código y nombre son requeridos'
                });
            }

            if (!id_tipo_planta) {
                return res.status(400).json({
                    message: 'El tipo de planta es requerido'
                });
            }

            // Validar que el código no exista
            const existeCodigo = await CargoBaseModel.getByCodigo(codigo_cargo);
            if (existeCodigo) {
                return res.status(400).json({
                    message: `El código ${codigo_cargo} ya está registrado`
                });
            }

            // Si es director de agencia, validar categoría
            if (es_director_agencia && !id_categoria_director) {
                return res.status(400).json({
                    message: 'Para cargos de director de agencia, la categoría es requerida'
                });
            }

            // Si tiene categoría, validar que exista
            if (id_categoria_director) {
                const categoria = await CategoriaDirectorModel.getById(id_categoria_director);
                if (!categoria) {
                    return res.status(400).json({
                        message: 'La categoría de director seleccionada no existe'
                    });
                }
            }

            const result = await CargoBaseModel.create({
                codigo_cargo,
                nombre_cargo,
                requiere_bonificacion: requiere_bonificacion || false,
                es_director_agencia: es_director_agencia || false,
                id_categoria_director: id_categoria_director || null,
                id_tipo_planta: id_tipo_planta,
                activo: activo !== undefined ? activo : true
            });

            res.status(201).json({
                message: 'Cargo base creado exitosamente',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. OBTENER TODOS LOS CARGOS BASE
    getAll: async (req, res) => {
        try {
            const { activo, es_director_agencia, id_tipo_planta } = req.query;

            const filtros = {
                activo: activo !== undefined ? activo === 'true' : undefined,
                es_director_agencia: es_director_agencia !== undefined ? es_director_agencia === 'true' : undefined,
                id_tipo_planta: id_tipo_planta || undefined
            };

            const data = await CargoBaseModel.getAll(filtros);

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. OBTENER CARGO POR ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const data = await CargoBaseModel.getById(id);

            if (!data) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            res.json({ data });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. OBTENER CARGO POR CÓDIGO
    getByCodigo: async (req, res) => {
        try {
            const { codigo } = req.params;

            const data = await CargoBaseModel.getByCodigo(codigo);

            if (!data) {
                return res.status(404).json({
                    message: `Cargo con código ${codigo} no encontrado`
                });
            }

            res.json({ data });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. ACTUALIZAR CARGO BASE
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                codigo_cargo,
                nombre_cargo,
                requiere_bonificacion,
                es_director_agencia,
                id_categoria_director,
                activo
            } = req.body;

            // Validar que el cargo existe
            const cargoExistente = await CargoBaseModel.getById(id);
            if (!cargoExistente) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            // Validar código único si se está cambiando
            if (codigo_cargo && codigo_cargo !== cargoExistente.codigo_cargo) {
                const existeCodigo = await CargoBaseModel.getByCodigo(codigo_cargo);
                if (existeCodigo) {
                    return res.status(400).json({
                        message: `El código ${codigo_cargo} ya está registrado`
                    });
                }
            }

            // Si es director de agencia, validar categoría
            if (es_director_agencia && !id_categoria_director) {
                return res.status(400).json({
                    message: 'Para cargos de director de agencia, la categoría es requerida'
                });
            }

            // Si tiene categoría, validar que exista
            if (id_categoria_director) {
                const categoria = await CategoriaDirectorModel.getById(id_categoria_director);
                if (!categoria) {
                    return res.status(400).json({
                        message: 'La categoría de director seleccionada no existe'
                    });
                }
            }

            await CargoBaseModel.update(id, {
                codigo_cargo: codigo_cargo || cargoExistente.codigo_cargo,
                nombre_cargo: nombre_cargo || cargoExistente.nombre_cargo,
                requiere_bonificacion: requiere_bonificacion !== undefined ? requiere_bonificacion : cargoExistente.requiere_bonificacion,
                es_director_agencia: es_director_agencia !== undefined ? es_director_agencia : cargoExistente.es_director_agencia,
                id_categoria_director: id_categoria_director !== undefined ? id_categoria_director : cargoExistente.id_categoria_director,
                activo: activo !== undefined ? activo : cargoExistente.activo
            });

            res.json({
                message: 'Cargo base actualizado exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. ELIMINAR (DESACTIVAR) CARGO BASE
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const cargoExistente = await CargoBaseModel.getById(id);
            if (!cargoExistente) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            await CargoBaseModel.delete(id);

            res.json({
                message: 'Cargo base desactivado exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 7. OBTENER CARGOS CON SALARIOS HISTÓRICOS
    getWithSalarioHistorico: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            if (!id_anio_legal) {
                return res.status(400).json({
                    message: 'El ID del año legal es requerido'
                });
            }

            const data = await CargoBaseModel.getWithSalarioHistorico(id_anio_legal);

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 8. OBTENER CARGOS CON DISPONIBILIDAD
    getWithDisponibilidad: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            if (!id_anio_legal) {
                return res.status(400).json({
                    message: 'El ID del año legal es requerido'
                });
            }

            const data = await CargoBaseModel.getWithDisponibilidad(id_anio_legal);

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 9. OBTENER CARGOS POR NIVEL
    getByNivel: async (req, res) => {
        try {
            const { nivel } = req.params;

            const nivelesValidos = ['OPERATIVO', 'TECNICO', 'PROFESIONAL', 'COORDINADOR', 'JEFE', 'DIRECTIVO'];

            if (!nivelesValidos.includes(nivel)) {
                return res.status(400).json({
                    message: `Nivel inválido. Niveles válidos: ${nivelesValidos.join(', ')}`
                });
            }

            const data = await CargoBaseModel.getAll({
                activo: true
            });

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 10. OBTENER DIRECTORES DE AGENCIA
    getDirectoresAgencia: async (req, res) => {
        try {
            const data = await CargoBaseModel.getAll({
                es_director_agencia: true,
                activo: true
            });

            // Enriquecer con información de categoría
            const dataEnriquecida = await Promise.all(data.map(async (cargo) => {
                if (cargo.id_categoria_director) {
                    const categoria = await CategoriaDirectorModel.getById(cargo.id_categoria_director);
                    return {
                        ...cargo,
                        categoria: categoria ? {
                            id: categoria.id_categoria,
                            codigo: categoria.codigo_categoria,
                            rango_min: categoria.rango_min_clientes,
                            rango_max: categoria.rango_max_clientes
                        } : null
                    };
                }
                return cargo;
            }));

            res.json({
                data: dataEnriquecida,
                total: dataEnriquecida.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 11. ACTIVAR/DESACTIVAR CARGO
    setActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (activo === undefined) {
                return res.status(400).json({
                    message: 'El estado activo es requerido'
                });
            }

            const cargoExistente = await CargoBaseModel.getById(id);
            if (!cargoExistente) {
                return res.status(404).json({
                    message: 'Cargo base no encontrado'
                });
            }

            await CargoBaseModel.update(id, {
                ...cargoExistente,
                activo
            });

            res.json({
                message: activo ? 'Cargo activado exitosamente' : 'Cargo desactivado exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = cargoBaseController;