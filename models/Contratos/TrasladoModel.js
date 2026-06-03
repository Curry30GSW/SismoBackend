const pool = require('../../config/ConectDb');

const TrasladoModel = {
    // =============================================
    // CREATE
    // =============================================
    create: async (data) => {
        const query = `
            INSERT INTO traslados (
                codigo_traslado,
                id_funcionario,
                departamento_origen,
                departamento_destino,
                fecha_traslado,
                fecha_fin,
                hasta_nuevo_aviso,
                motivo,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.codigo_traslado,
            data.id_funcionario,
            data.departamento_origen,
            data.departamento_destino,
            data.fecha_traslado,
            data.fecha_fin || null,
            data.hasta_nuevo_aviso ? 1 : 0,
            data.motivo || null,
            data.usuario_creacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_traslado: result.insertId, ...data };
    },

    // =============================================
    // READ
    // =============================================
    getAll: async (filtros = {}) => {
        let query = `
               SELECT 
                t.*,
                f.nombres,
                f.apellidos,
                f.tipo_documento,
                f.numero_documento,
                t.departamento_origen,      
                t.departamento_destino,   
                c.numero_contrato,
                c.cargo as cargo_actual,
                c.fecha_inicio
            FROM traslados t
            INNER JOIN funcionarios f ON t.id_funcionario = f.id_funcionario
            LEFT JOIN contratos c ON c.id_funcionario = f.id_funcionario AND c.estado IN ('ACTIVO', 'PRORROGADO')
            WHERE 1=1
        `;
        const params = [];

        if (filtros.id_funcionario) {
            query += ' AND t.id_funcionario = ?';
            params.push(filtros.id_funcionario);
        }

        if (filtros.busqueda) {
            query += ` AND (
                f.nombres LIKE ? OR 
                f.apellidos LIKE ? OR 
                f.numero_documento LIKE ? OR 
                t.codigo_traslado LIKE ? OR
                t.departamento_origen LIKE ? OR
                t.departamento_destino LIKE ?
            )`;
            const searchTerm = `%${filtros.busqueda}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY t.created_at ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await pool.query(`
                SELECT 
                t.*,
                f.nombres,
                f.apellidos,
                f.tipo_documento,
                f.numero_documento,
                t.departamento_origen,     
                t.departamento_destino,    
                c.numero_contrato,
                c.cargo as cargo_actual,
                c.fecha_inicio as fecha_inicio_contrato
            FROM traslados t
            INNER JOIN funcionarios f ON t.id_funcionario = f.id_funcionario
            LEFT JOIN contratos c ON c.id_funcionario = f.id_funcionario AND c.estado IN ('ACTIVO', 'PRORROGADO')
            WHERE t.id_traslado = ?
        `, [id]);
        return rows[0];
    },

    getByFuncionario: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                t.*,
                t.departamento_origen,      
                t.departamento_destino      
            FROM traslados t
            WHERE t.id_funcionario = ?
            ORDER BY t.created_at DESC
        `, [idFuncionario]);
        return rows;
    },


    // =============================================
    // UPDATE
    // =============================================
    finalizar: async (id, fechaFin) => {
        const query = `
            UPDATE traslados 
            SET fecha_fin = ?, hasta_nuevo_aviso = 0
            WHERE id_traslado = ?
        `;
        const [result] = await pool.query(query, [fechaFin, id]);
        return result;
    },

    // =============================================
    // UTILS
    // =============================================
    obtenerUltimoCodigo: async (anio) => {
        const [rows] = await pool.query(`
        SELECT codigo_traslado 
        FROM traslados 
        WHERE codigo_traslado LIKE ? 
        ORDER BY id_traslado DESC 
        LIMIT 1
    `, [`ADT-${anio}-%`]);
        return rows.length > 0 ? rows[0].codigo_traslado : null;
    },

    // Verificar si el funcionario ya tiene un traslado activo
    tieneTrasladoActivo: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT id_traslado FROM traslados 
            WHERE id_funcionario = ? AND (fecha_fin IS NULL OR fecha_fin > NOW())
        `, [idFuncionario]);
        return rows.length > 0;
    }
};

module.exports = TrasladoModel;