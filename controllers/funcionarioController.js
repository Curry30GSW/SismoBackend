const FuncionarioModel = require('../models/FuncionarioModel');
const MovimientoCargoModel = require('../models/MovimientoCargoModel');
const PosicionCargoModel = require('../models/PosicionCargoModel');

const funcionarioController = {
    // Contratar funcionario
    hire: async (req, res) => {
        try {
            const data = req.body;

            // Crear funcionario y asignar a posición
            const funcionario = await FuncionarioModel.create(data);

            // Obtener información de la posición para el año legal
            const posicion = await PosicionCargoModel.getById(data.id_posicion);

            // Registrar movimiento
            await MovimientoCargoModel.registrarAsignacion(
                data.id_posicion,
                funcionario.id_funcionario,
                posicion.id_anio_legal,
                data.motivo || 'Contratación',
                req.user?.email || 'SISTEMA'
            );

            res.status(201).json({
                message: 'Funcionario contratado exitosamente',
                data: funcionario
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error al contratar funcionario',
                error: error.message
            });
        }
    },

    // Retirar funcionario
    retire: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_retiro, motivo } = req.body;

            // Retirar funcionario
            const result = await FuncionarioModel.retire(id, fecha_retiro);

            // Obtener posición para el año legal
            const posicion = await PosicionCargoModel.getById(result.id_posicion_liberada);

            // Registrar movimiento
            await MovimientoCargoModel.registrarDesasignacion(
                result.id_posicion_liberada,
                id,
                posicion.id_anio_legal,
                motivo || 'Retiro voluntario',
                req.user?.email || 'SISTEMA'
            );

            res.json({
                message: 'Funcionario retirado exitosamente',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error al retirar funcionario',
                error: error.message
            });
        }
    },

    // Trasladar funcionario
    transfer: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_nueva_posicion, fecha_traslado, motivo } = req.body;

            // Trasladar funcionario
            const result = await FuncionarioModel.transfer(
                id,
                id_nueva_posicion,
                fecha_traslado
            );

            // Obtener año legal de la nueva posición
            const posicionDestino = await PosicionCargoModel.getById(id_nueva_posicion);

            // Registrar movimientos de traslado
            await MovimientoCargoModel.registrarTraslado(
                result.id_posicion_origen,
                result.id_posicion_destino,
                id,
                posicionDestino.id_anio_legal,
                motivo || 'Traslado',
                req.user?.email || 'SISTEMA'
            );

            res.json({
                message: 'Funcionario trasladado exitosamente',
                data: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error al trasladar funcionario',
                error: error.message
            });
        }
    }
};

module.exports = funcionarioController;