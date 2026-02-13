const pool = require('../config/ConectDb');

const HistoricoSalarioModel = {
    // Crear o actualizar salario para un cargo en un año específico
    upsert: async (data) => {
        const query = `
            INSERT INTO historico_salarios_cargo (
                id_cargo_base,
                id_anio_legal,
                salario_base,
                bonificacion,
                aplica_auxilio_transporte,
                fecha_desde,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                salario_base = VALUES(salario_base),
                bonificacion = VALUES(bonificacion),
                aplica_auxilio_transporte = VALUES(aplica_auxilio_transporte),
                fecha_desde = VALUES(fecha_desde),
                activo = VALUES(activo)
        `;

        const values = [
            data.id_cargo_base,
            data.id_anio_legal,
            data.salario_base,
            data.bonificacion || 0,
            data.aplica_auxilio_transporte !== undefined ? data.aplica_auxilio_transporte : true,
            data.fecha_desde || new Date(),
            data.activo !== undefined ? data.activo : true
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    // Obtener salario de un cargo para un año específico
    getByCargoAndAnio: async (idCargoBase, idAnioLegal) => {
        const [rows] = await pool.query(
            'SELECT * FROM historico_salarios_cargo WHERE id_cargo_base = ? AND id_anio_legal = ? AND activo = true',
            [idCargoBase, idAnioLegal]
        );
        return rows[0];
    },

    // Obtener historial completo de salarios de un cargo
    getHistorialByCargo: async (idCargoBase) => {
        const [rows] = await pool.query(`
            SELECT hsc.*, al.anio
            FROM historico_salarios_cargo hsc
            INNER JOIN anios_legales al ON hsc.id_anio_legal = al.id_anio_legal
            WHERE hsc.id_cargo_base = ? AND hsc.activo = true
            ORDER BY al.anio DESC
        `, [idCargoBase]);
        return rows;
    },

    // Actualizar salario
    update: async (id, data) => {
        const query = `
            UPDATE historico_salarios_cargo SET
                salario_base = ?,
                bonificacion = ?,
                aplica_auxilio_transporte = ?,
                fecha_desde = ?,
                fecha_hasta = ?,
                activo = ?
            WHERE id_historico_salario = ?
        `;

        const values = [
            data.salario_base,
            data.bonificacion,
            data.aplica_auxilio_transporte,
            data.fecha_desde,
            data.fecha_hasta || null,
            data.activo,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    // Desactivar salario histórico
    deactivate: async (id) => {
        const [result] = await pool.query(
            'UPDATE historico_salarios_cargo SET activo = false WHERE id_historico_salario = ?',
            [id]
        );
        return result;
    },

    // Copiar salarios de un año a otro (para apertura de año)
    copyFromYear: async (idAnioOrigen, idAnioDestino, fechaDesde) => {
        const query = `
            INSERT INTO historico_salarios_cargo (
                id_cargo_base,
                id_anio_legal,
                salario_base,
                bonificacion,
                aplica_auxilio_transporte,
                fecha_desde,
                activo
            )
            SELECT 
                id_cargo_base,
                ?,
                salario_base,
                bonificacion,
                aplica_auxilio_transporte,
                ?,
                true
            FROM historico_salarios_cargo
            WHERE id_anio_legal = ? AND activo = true
        `;

        const [result] = await pool.query(query, [idAnioDestino, fechaDesde, idAnioOrigen]);
        return result;
    }
};

module.exports = HistoricoSalarioModel;