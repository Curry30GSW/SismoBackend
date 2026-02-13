const CategoriaDirectorModel = require('../models/CategoriaDirectorModel');

const categoriaDirectorController = {
    // 1. CREAR CATEGORÍA
    create: async (req, res) => {
        try {
            const {
                codigo_categoria,
                nombre_categoria,
                rango_min_clientes,
                rango_max_clientes,
                activo
            } = req.body;

            // Validaciones obligatorias
            if (!codigo_categoria) {
                return res.status(400).json({
                    message: 'El código de categoría es requerido'
                });
            }

            if (rango_min_clientes === undefined || rango_max_clientes === undefined) {
                return res.status(400).json({
                    message: 'Los rangos mínimo y máximo de clientes son requeridos'
                });
            }

            // Validar que el rango mínimo sea menor al máximo
            if (parseInt(rango_min_clientes) >= parseInt(rango_max_clientes)) {
                return res.status(400).json({
                    message: 'El rango mínimo debe ser menor al rango máximo'
                });
            }

            // Validar que el código no exista
            const existeCodigo = await CategoriaDirectorModel.findByCodigo(codigo_categoria);
            if (existeCodigo) {
                return res.status(400).json({
                    message: `El código ${codigo_categoria} ya está registrado`
                });
            }

            // Validar que no haya solapamiento de rangos
            const haySolapamiento = await CategoriaDirectorModel.checkRangoOverlap(
                rango_min_clientes,
                rango_max_clientes
            );

            if (haySolapamiento) {
                return res.status(400).json({
                    message: 'El rango especificado se solapa con una categoría existente'
                });
            }

            const result = await CategoriaDirectorModel.create({
                codigo_categoria,
                nombre_categoria: nombre_categoria || codigo_categoria,
                rango_min_clientes,
                rango_max_clientes,
                activo: activo !== undefined ? activo : true
            });

            res.status(201).json({
                message: 'Categoría de director creada exitosamente',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. OBTENER TODAS LAS CATEGORÍAS
    getAll: async (req, res) => {
        try {
            const { activo } = req.query;

            const activoFilter =
                activo !== undefined
                    ? activo === 'true'
                    : undefined;

            const data = await CategoriaDirectorModel.getAll(activoFilter);

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. OBTENER CATEGORÍA POR ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const data = await CategoriaDirectorModel.getById(id);

            if (!data) {
                return res.status(404).json({
                    message: 'Categoría no encontrada'
                });
            }

            res.json({ data });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. OBTENER CATEGORÍA POR CÓDIGO
    getByCodigo: async (req, res) => {
        try {
            const { codigo } = req.params;

            const data = await CategoriaDirectorModel.findByCodigo(codigo);

            if (!data) {
                return res.status(404).json({
                    message: `Categoría con código ${codigo} no encontrada`
                });
            }

            res.json({ data });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. BUSCAR CATEGORÍA POR RANGO DE CLIENTES
    getByRangoClientes: async (req, res) => {
        try {
            const { numClientes } = req.params;

            if (!numClientes || isNaN(numClientes)) {
                return res.status(400).json({
                    message: 'El número de clientes debe ser un valor numérico'
                });
            }

            const data = await CategoriaDirectorModel.findByRangoClientes(parseInt(numClientes));

            if (!data) {
                return res.status(404).json({
                    message: `No hay categoría que cubra ${numClientes} clientes`
                });
            }

            res.json({ data });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. ACTUALIZAR CATEGORÍA
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                codigo_categoria,
                nombre_categoria,
                rango_min_clientes,
                rango_max_clientes,
                activo
            } = req.body;

            // Validar que la categoría existe
            const categoriaExistente = await CategoriaDirectorModel.getById(id);
            if (!categoriaExistente) {
                return res.status(404).json({
                    message: 'Categoría no encontrada'
                });
            }

            // Validar rangos si vienen
            if (rango_min_clientes !== undefined && rango_max_clientes !== undefined) {
                if (parseInt(rango_min_clientes) >= parseInt(rango_max_clientes)) {
                    return res.status(400).json({
                        message: 'El rango mínimo debe ser menor al rango máximo'
                    });
                }
            }

            // Validar código único si se está cambiando
            if (codigo_categoria && codigo_categoria !== categoriaExistente.codigo_categoria) {
                const existeCodigo = await CategoriaDirectorModel.findByCodigo(codigo_categoria);
                if (existeCodigo) {
                    return res.status(400).json({
                        message: `El código ${codigo_categoria} ya está registrado`
                    });
                }
            }

            // Validar solapamiento de rangos si se están cambiando
            const nuevoRangoMin = rango_min_clientes !== undefined ? rango_min_clientes : categoriaExistente.rango_min_clientes;
            const nuevoRangoMax = rango_max_clientes !== undefined ? rango_max_clientes : categoriaExistente.rango_max_clientes;

            if (nuevoRangoMin !== categoriaExistente.rango_min_clientes ||
                nuevoRangoMax !== categoriaExistente.rango_max_clientes) {

                const haySolapamiento = await CategoriaDirectorModel.checkRangoOverlap(
                    nuevoRangoMin,
                    nuevoRangoMax,
                    id
                );

                if (haySolapamiento) {
                    return res.status(400).json({
                        message: 'El rango especificado se solapa con una categoría existente'
                    });
                }
            }

            await CategoriaDirectorModel.update(id, {
                codigo_categoria: codigo_categoria || categoriaExistente.codigo_categoria,
                nombre_categoria: nombre_categoria !== undefined ? nombre_categoria : categoriaExistente.nombre_categoria,
                rango_min_clientes: rango_min_clientes !== undefined ? rango_min_clientes : categoriaExistente.rango_min_clientes,
                rango_max_clientes: rango_max_clientes !== undefined ? rango_max_clientes : categoriaExistente.rango_max_clientes,
                activo: activo !== undefined ? activo : categoriaExistente.activo
            });

            res.json({
                message: 'Categoría actualizada exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 7. ELIMINAR (DESACTIVAR) CATEGORÍA
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const categoriaExistente = await CategoriaDirectorModel.getById(id);
            if (!categoriaExistente) {
                return res.status(404).json({
                    message: 'Categoría no encontrada'
                });
            }

            // Verificar si tiene cargos base asociados
            const CargoBaseModel = require('./CargoBaseModel');
            const cargosAsociados = await CargoBaseModel.getAll({
                id_categoria_director: id,
                activo: true
            });

            if (cargosAsociados.length > 0) {
                return res.status(400).json({
                    message: `No se puede eliminar la categoría porque tiene ${cargosAsociados.length} cargo(s) base asociado(s)`,
                    cargos: cargosAsociados.map(c => c.nombre_cargo)
                });
            }

            await CategoriaDirectorModel.delete(id);

            res.json({
                message: 'Categoría desactivada exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 8. OBTENER CATEGORÍAS CON ESTADÍSTICAS
    getWithStats: async (req, res) => {
        try {
            const { id_anio_legal } = req.params;

            if (!id_anio_legal) {
                return res.status(400).json({
                    message: 'El ID del año legal es requerido'
                });
            }

            const data = await CategoriaDirectorModel.getWithStats(id_anio_legal);

            res.json({
                data,
                total: data.length
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 9. ACTIVAR/DESACTIVAR CATEGORÍA
    setActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (activo === undefined) {
                return res.status(400).json({
                    message: 'El estado activo es requerido'
                });
            }

            const categoriaExistente = await CategoriaDirectorModel.getById(id);
            if (!categoriaExistente) {
                return res.status(404).json({
                    message: 'Categoría no encontrada'
                });
            }

            await CategoriaDirectorModel.update(id, {
                ...categoriaExistente,
                activo
            });

            res.json({
                message: activo ? 'Categoría activada exitosamente' : 'Categoría desactivada exitosamente'
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 10. VALIDAR RANGO
    validarRango: async (req, res) => {
        try {
            const { rango_min, rango_max, exclude_id } = req.query;

            if (!rango_min || !rango_max) {
                return res.status(400).json({
                    message: 'Los parámetros rango_min y rango_max son requeridos'
                });
            }

            const haySolapamiento = await CategoriaDirectorModel.checkRangoOverlap(
                parseInt(rango_min),
                parseInt(rango_max),
                exclude_id || null
            );

            res.json({
                data: {
                    valido: !haySolapamiento,
                    hay_solapamiento: haySolapamiento,
                    rango_min: parseInt(rango_min),
                    rango_max: parseInt(rango_max)
                }
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = categoriaDirectorController;