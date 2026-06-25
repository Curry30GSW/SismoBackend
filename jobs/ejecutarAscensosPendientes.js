const pool = require('../config/ConectDb');
const cron = require('node-cron');
const PosicionCargoModel = require('../models/plantaCargos/PosicionCargoModel');
const ContratoModel = require('../models/Contratos/ContratoModel');
const AscensoModel = require('../models/Contratos/AscensoModel');

const ejecutarAscensosPendientes = async () => {
    const connection = await pool.getConnection();
    try {
        const hoy = new Date().toISOString().split('T')[0];

        const pendientes = await AscensoModel.getPendientes();

        if (pendientes.length === 0) {
            return;
        }

        for (const ascenso of pendientes) {
            await connection.beginTransaction();
            try {
                const contratoActual = await ContratoModel.getById(ascenso.id_contrato_anterior);
                const idPosicionActual = contratoActual?.id_posicion;

                const posicionNueva = await PosicionCargoModel.getById(ascenso.id_posicion_nueva);

                if (!posicionNueva) {
                    throw new Error(`Posición ${ascenso.id_posicion_nueva} no encontrada`);
                }

                if (posicionNueva.id_funcionario &&
                    posicionNueva.id_funcionario !== ascenso.id_funcionario) {
                    throw new Error(`La posición ${ascenso.id_posicion_nueva} ya está ocupada por otro funcionario`);
                }

                if (idPosicionActual) {
                    const posicionActual = await PosicionCargoModel.getById(idPosicionActual);

                    if (posicionActual && posicionActual.id_funcionario === ascenso.id_funcionario) {
                        await PosicionCargoModel.desasignarFuncionario(idPosicionActual);
                    }
                }

                if (posicionNueva.id_funcionario !== ascenso.id_funcionario) {
                    await PosicionCargoModel.asignarFuncionario(
                        ascenso.id_posicion_nueva,
                        ascenso.id_funcionario,
                        false
                    );
                }

                await ContratoModel.update(ascenso.id_contrato_nuevo, {
                    estado: 'ACTIVO',
                    fecha_inicio: hoy
                });

                if (ascenso.estado_contrato_actual === 'ACTIVO') {
                    await ContratoModel.update(ascenso.id_contrato_anterior, {
                        estado: 'TERMINADO',
                        fecha_fin: hoy
                    });
                }

                await AscensoModel.marcarEjecutado(ascenso.id_ascenso);

                await connection.commit();

            } catch (err) {
                await connection.rollback();
                console.error(`❌ Error ejecutando ascenso ${ascenso.id_ascenso}:`, err.message);
            }
        }
    } finally {
        connection.release();
    }
};

module.exports = { ejecutarAscensosPendientes };

// Ejecutar a las 00:05 y 12:05
cron.schedule('5 0,12 * * *', ejecutarAscensosPendientes);

// cron.schedule('*/10 * * * *', ejecutarAscensosPendientes)