const EncargaturaModel = require('../../models/Contratos/EncargaturaModel');
const PosicionModel = require('../../models/PlantaCargos/PosicionCargoModel');
const FuncionarioModel = require('../../models/PlantaCargos/FuncionarioModel');
const AnioLegalModel = require('../../models/PlantaCargos/AnioLegalModel');

const encargaturaController = {
    // 1. GENERAR CÓDIGO DE ENCARGATURA
    generarCodigo: async (req, res) => {
        try {
            const codigo = await EncargaturaModel.generarCodigoEncargatura();
            res.json({
                success: true,
                codigo: codigo
            });
        } catch (error) {
            console.error('Error generando código:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 2. CREAR REGISTRO DE ENCARGATURA
    create: async (req, res) => {
        try {
            const {
                id_posicion_fijo,
                id_funcionario,
                id_anio_legal,
                fecha_inicio,
                fecha_fin,
                hasta_nuevo_aviso,
                usuario_creacion
            } = req.body;

            // Validaciones
            if (!id_posicion_fijo || !id_funcionario || !id_anio_legal || !fecha_inicio) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: id_posicion_fijo, id_funcionario, id_anio_legal, fecha_inicio'
                });
            }

            // Verificar que la posición existe
            const posicion = await PosicionModel.getById(id_posicion_fijo);
            if (!posicion) {
                return res.status(404).json({
                    success: false,
                    message: 'Posición no encontrada'
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

            // Verificar que el año legal existe
            const anioLegal = await AnioLegalModel.getById(id_anio_legal);
            if (!anioLegal) {
                return res.status(404).json({
                    success: false,
                    message: 'Año legal no encontrado'
                });
            }

            // Validar fechas
            const inicio = new Date(fecha_inicio);
            if (fecha_fin && !hasta_nuevo_aviso) {
                const fin = new Date(fecha_fin);
                if (fin <= inicio) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
                    });
                }
            }

            // Generar código de encargatura
            const codigoEncargatura = await EncargaturaModel.generarCodigoEncargatura();

            // Crear el registro
            const result = await EncargaturaModel.create({
                codigo_encargatura: codigoEncargatura,
                id_posicion_fijo,
                id_funcionario,
                id_anio_legal,
                fecha_inicio,
                fecha_fin: hasta_nuevo_aviso ? null : fecha_fin,
                hasta_nuevo_aviso: hasta_nuevo_aviso || false,
                usuario_creacion: usuario_creacion || req.user?.email || 'SISTEMA'
            });

            // Obtener la encargatura completa para la respuesta
            const encargaturaCompleta = await EncargaturaModel.getById(result.id_encargatura);

            res.status(201).json({
                success: true,
                message: 'Encargatura registrada exitosamente',
                data: encargaturaCompleta || {
                    id_encargatura: result.id_encargatura,
                    codigo_encargatura: codigoEncargatura
                }
            });

        } catch (error) {
            console.error('Error en create encargatura:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 3. OBTENER ENCARGATURA POR ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            const encargatura = await EncargaturaModel.getById(id);

            if (!encargatura) {
                return res.status(404).json({
                    success: false,
                    message: 'Encargatura no encontrada'
                });
            }

            res.json({
                success: true,
                data: encargatura
            });

        } catch (error) {
            console.error('Error en getById encargatura:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 4. OBTENER ENCARGATURAS POR FUNCIONARIO
    getByFuncionario: async (req, res) => {
        try {
            const { id_funcionario } = req.params;

            const encargaturas = await EncargaturaModel.getByFuncionario(id_funcionario);

            res.json({
                success: true,
                data: encargaturas,
                total: encargaturas.length
            });

        } catch (error) {
            console.error('Error en getByFuncionario encargatura:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 5. OBTENER ENCARGATURAS ACTIVAS
    getActivas: async (req, res) => {
        try {
            const encargaturas = await EncargaturaModel.getActivas();

            res.json({
                success: true,
                data: encargaturas,
                total: encargaturas.length
            });

        } catch (error) {
            console.error('Error en getActivas encargatura:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 6. OBTENER TODAS LAS ENCARGATURAS (PAGINADO)
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;

            const encargaturas = await EncargaturaModel.getAll(limit, offset);
            const total = await EncargaturaModel.getCount();

            res.json({
                success: true,
                data: encargaturas,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error en getAll encargatura:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = encargaturaController;