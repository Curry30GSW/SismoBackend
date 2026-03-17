const pool = require('../../config/ConectDb');

const CargoModel = {

    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO cargos (
                    ext,
                    cargo,
                    salario_base,
                    auxilio_transporte,
                    tiene_bonificacion,
                    bonificacion,
                    director_agencia,
                    id_categoria,
                    cargos_cantidad,
                    cargos_disponibles,
                    activo,
                    fecha_actualizacion
                ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                data.ext,
                data.cargo,
                data.salario_base,
                data.auxilio_transporte,
                data.tiene_bonificacion,
                data.bonificacion,
                data.director_agencia,
                data.id_categoria,
                data.cargos_cantidad,
                data.cargos_disponibles,
                data.activo,
                data.fecha_actualizacion
            ];

            const [result] = await connection.query(query, values);
            return result;

        } finally {
            connection.release();
        }
    },

    findAll: async () => {
        const [rows] = await pool.query(`
            SELECT c.*, dc.categoria
            FROM cargos c
            LEFT JOIN directores_categorias dc 
                ON c.id_categoria = dc.id_categoria
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM cargos WHERE id_cargo = ?',
            [id]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE cargos SET
                cargo = ?,
                salario_base = ?,
                auxilio_transporte = ?,
                tiene_bonificacion = ?,
                bonificacion = ?,
                director_agencia = ?,
                id_categoria = ?,
                cargos_cantidad = ?,
                cargos_disponibles = ?,
                activo = ?,
                fecha_actualizacion = ?
            WHERE id_cargo = ?
        `;

        const values = [
            data.cargo,
            data.salario_base,
            data.auxilio_transporte,
            data.tiene_bonificacion,
            data.bonificacion,
            data.director_agencia,
            data.id_categoria,
            data.cargos_cantidad,
            data.cargos_disponibles,
            data.activo,
            data.fecha_actualizacion,
            id
        ];

        const [result] = await pool.query(query, values);
        return result;
    },

    delete: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM cargos WHERE id_cargo = ?',
            [id]
        );
        return result;
    }

}


module.exports = CargoModel;