const CategoriaDirectorModel = require('../models/DirectoresModel');

const CategoriaDirectorController = {

    // Crear nueva categoría
    create: async (req, res) => {
        try {
            const { categoria, rango_min, rango_max, salario_basico, bonificacion } = req.body;

            // Validaciones
            if (!categoria || !rango_min || !rango_max || !salario_basico || !bonificacion) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            if (parseInt(rango_min) >= parseInt(rango_max)) {
                return res.status(400).json({
                    success: false,
                    message: 'El rango mínimo debe ser menor al rango máximo'
                });
            }

            // Verificar si el rango se solapa con otros
            const tieneSolapamiento = await CategoriaDirectorModel.checkRangoOverlap(rango_min, rango_max);
            if (tieneSolapamiento) {
                return res.status(400).json({
                    success: false,
                    message: 'El rango se solapa con otra categoría existente'
                });
            }

            const result = await CategoriaDirectorModel.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                data: {
                    id_categoria: result.insertId
                }
            });

        } catch (error) {
            console.error('Error al crear categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Obtener todas las categorías
    getAll: async (req, res) => {
        try {
            const { activo } = req.query;
            const activoBool = activo === 'false' ? false : true;

            const categorias = await CategoriaDirectorModel.getAll(activoBool);

            res.json({
                success: true,
                data: categorias
            });

        } catch (error) {
            console.error('Error al obtener categorías:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Obtener categoría por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const categoria = await CategoriaDirectorModel.getById(id);

            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                data: categoria
            });

        } catch (error) {
            console.error('Error al obtener categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Obtener categoría por letra
    findByCategoria: async (req, res) => {
        try {
            const { categoria } = req.params;
            const cat = await CategoriaDirectorModel.findByCategoria(categoria);

            if (!cat) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                data: cat
            });

        } catch (error) {
            console.error('Error al obtener categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Obtener categoría por rango
    findByRango: async (req, res) => {
        try {
            const { valor } = req.params;
            const categoria = await CategoriaDirectorModel.findByRango(valor);

            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró categoría para el valor especificado'
                });
            }

            res.json({
                success: true,
                data: categoria
            });

        } catch (error) {
            console.error('Error al obtener categoría por rango:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Actualizar categoría
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { categoria, rango_min, rango_max } = req.body;

            // Verificar si existe
            const categoriaExistente = await CategoriaDirectorModel.findById(id);
            if (!categoriaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            // Validar rangos si se están actualizando
            if (rango_min !== undefined && rango_max !== undefined) {
                if (parseInt(rango_min) >= parseInt(rango_max)) {
                    return res.status(400).json({
                        success: false,
                        message: 'El rango mínimo debe ser menor al rango máximo'
                    });
                }

                // Verificar solapamiento excluyendo la categoría actual
                const tieneSolapamiento = await CategoriaDirectorModel.checkRangoOverlap(
                    rango_min,
                    rango_max,
                    id
                );
                if (tieneSolapamiento) {
                    return res.status(400).json({
                        success: false,
                        message: 'El rango se solapa con otra categoría existente'
                    });
                }
            }

            const result = await CategoriaDirectorModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Categoría actualizada exitosamente',
                data: result
            });

        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Eliminar categoría
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si existen directores usando esta categoría
            const [directores] = await pool.query(
                'SELECT COUNT(*) as count FROM cargos WHERE id_categoria = ?',
                [id]
            );

            if (directores[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar la categoría porque hay directores asignados a ella'
                });
            }

            const result = await CategoriaDirectorModel.delete(id);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Categoría eliminada exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Desactivar categoría
    deactivate: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await CategoriaDirectorModel.deactivate(id);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Categoría desactivada exitosamente'
            });

        } catch (error) {
            console.error('Error al desactivar categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Activar categoría
    activate: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await CategoriaDirectorModel.activate(id);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Categoría activada exitosamente'
            });

        } catch (error) {
            console.error('Error al activar categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Obtener estadísticas de categorías
    getStats: async (req, res) => {
        try {
            const categoriasConStats = await CategoriaDirectorModel.getWithStats();

            const estadisticas = {
                total_categorias: categoriasConStats.length,
                total_directores: categoriasConStats.reduce((sum, cat) => sum + cat.total_directores, 0),
                categorias: categoriasConStats
            };

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // Validar datos antes de crear/actualizar
    validateData: async (req, res) => {
        try {
            const { categoria, rango_min, rango_max, salario_basico, bonificacion } = req.body;

            const errors = [];

            // Validaciones básicas
            if (!categoria) errors.push('La categoría es requerida');
            if (!rango_min) errors.push('El rango mínimo es requerido');
            if (!rango_max) errors.push('El rango máximo es requerido');
            if (!salario_basico) errors.push('El salario básico es requerido');
            if (!bonificacion) errors.push('La bonificación es requerida');

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors
                });
            }

            // Validar tipos de datos
            if (isNaN(rango_min)) errors.push('El rango mínimo debe ser un número');
            if (isNaN(rango_max)) errors.push('El rango máximo debe ser un número');
            if (isNaN(salario_basico)) errors.push('El salario básico debe ser un número');
            if (isNaN(bonificacion)) errors.push('La bonificación debe ser un número');

            if (parseInt(rango_min) >= parseInt(rango_max)) {
                errors.push('El rango mínimo debe ser menor al rango máximo');
            }

            if (parseInt(salario_basico) <= 0) {
                errors.push('El salario básico debe ser mayor a 0');
            }

            if (parseInt(bonificacion) < 0) {
                errors.push('La bonificación no puede ser negativa');
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors
                });
            }

            // Verificar si la categoría ya existe
            const categoriaExistente = await CategoriaDirectorModel.findByCategoria(categoria);
            if (categoriaExistente) {
                errors.push(`La categoría "${categoria}" ya existe`);
            }

            // Verificar solapamiento de rangos
            const tieneSolapamiento = await CategoriaDirectorModel.checkRangoOverlap(rango_min, rango_max);
            if (tieneSolapamiento) {
                errors.push('El rango se solapa con otra categoría existente');
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors
                });
            }

            res.json({
                success: true,
                message: 'Datos válidos'
            });

        } catch (error) {
            console.error('Error en validación:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

};

module.exports = CategoriaDirectorController;