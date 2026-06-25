const pool = require('../config/ConectDb');
const cron = require('node-cron');
const PosicionCargoModel = require('../models/plantaCargos/PosicionCargoModel');
const PosicionFijoModel = require('../models/plantaCargos/PosicionCargoFijoModel');
const ContratoModel = require('../models/Contratos/ContratoModel');
const NombramientoModel = require('../models/Contratos/NombramientosModel');

const ejecutarCambiosModalidad = async () => {
    const connection = await pool.getConnection();

    try {
        const hoy = new Date().toISOString().split('T')[0];
        const pendientes = await NombramientoModel.getPendientes();

        if (pendientes.length === 0) {
            return;
        }

        for (const cambio of pendientes) {

            if (!cambio.id_posicion_nueva) {
                continue;
            }

            await connection.beginTransaction();

            try {
                // PASO 1: Obtener posición actual del funcionario en tabla FIJA
                const posicionFija = await PosicionFijoModel.getPosicionByFuncionario(
                    cambio.id_funcionario
                );

                if (posicionFija) {
                    await PosicionFijoModel.desasignarFuncionario(
                        posicionFija.id_posicion
                    );

                    await PosicionFijoModel.delete(
                        posicionFija.id_posicion,
                        hoy
                    );
                }

                // PASO 2: Verificar la posición nueva
                const posicionNueva = await PosicionCargoModel.getById(
                    cambio.id_posicion_nueva
                );

                if (!posicionNueva) {
                    throw new Error(
                        `Posición ${cambio.id_posicion_nueva} no encontrada en posiciones_cargo`
                    );
                }

                if (
                    posicionNueva.id_funcionario &&
                    posicionNueva.id_funcionario !== cambio.id_funcionario
                ) {
                    throw new Error(
                        `La posición ${cambio.id_posicion_nueva} ya está ocupada por otro funcionario`
                    );
                }

                // PASO 3: Asignar nueva posición
                if (posicionNueva.id_funcionario !== cambio.id_funcionario) {
                    await PosicionCargoModel.asignarFuncionario(
                        cambio.id_posicion_nueva,
                        cambio.id_funcionario,
                        false
                    );
                }

                // PASO 4: Activar nuevo contrato
                await ContratoModel.update(cambio.id_contrato_nuevo, {
                    estado: 'ACTIVO',
                    fecha_inicio: hoy
                });

                // PASO 5: Finalizar contrato anterior
                if (cambio.estado_contrato_actual === 'ACTIVO') {
                    await ContratoModel.update(cambio.id_contrato_anterior, {
                        estado: 'TERMINADO',
                        fecha_fin: hoy
                    });
                }

                // PASO 6: Marcar nombramiento como ejecutado
                await NombramientoModel.marcarEjecutado(
                    cambio.id_nombramiento
                );

                await connection.commit();

            } catch (err) {
                await connection.rollback();
                console.error(
                    `Error ejecutando nombramiento ${cambio.id_nombramiento}:`,
                    err.message
                );
            }
        }
    } catch (error) {
        console.error('Error general en ejecutarCambiosModalidad:', error);
    } finally {
        connection.release();
    }
};

module.exports = { ejecutarCambiosModalidad };

cron.schedule('5 0,12 * * *', ejecutarCambiosModalidad);

// cron.schedule('*/10 * * * *', ejecutarCambiosModalidad);