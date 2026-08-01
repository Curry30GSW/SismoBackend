const pool = require('../../config/ConectDb');

const NombramientoModel = {
    generarCodigoNombramiento: async () => {
        try {
            const anioActual = new Date().getFullYear();
            const [rows] = await pool.query(`
                SELECT codigo_nombramiento 
                FROM nombramientos 
                WHERE codigo_nombramiento LIKE ? 
                ORDER BY id_nombramiento DESC 
                LIMIT 1
            `, [`CM-${anioActual}-%`]);

            let nuevoNumero = 1;
            if (rows[0] && rows[0].codigo_nombramiento) {
                const match = rows[0].codigo_nombramiento.match(/CM-\d+-(\d+)/);
                if (match) {
                    nuevoNumero = parseInt(match[1]) + 1;
                }
            }
            return `CM-${anioActual}-${nuevoNumero}`;
        } catch (error) {
            console.error('Error generando código de cambio:', error);
            const timestamp = Date.now().toString().slice(-6);
            return `CM-${timestamp}`;
        }
    },

    create: async (data) => {
        const query = `
        INSERT INTO nombramientos (
            codigo_nombramiento,
            id_contrato_anterior,
            id_contrato_nuevo,
            id_posicion_nueva,
            id_posicion_anterior,
            id_funcionario,
            fecha_nombramiento,
            fecha_efectiva,
            estado,
            usuario_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            data.codigo_nombramiento,
            data.id_contrato_anterior,
            data.id_contrato_nuevo,
            data.id_posicion_nueva || null,
            data.id_posicion_anterior || null,
            data.id_funcionario || null,
            data.fecha_nombramiento || new Date().toISOString().split('T')[0],
            data.fecha_efectiva || data.fecha_nombramiento || new Date().toISOString().split('T')[0],
            data.estado || 'PENDIENTE',
            data.usuario_creacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_nombramiento: result.insertId, ...data };
    },

    getPendientes: async () => {
        const [rows] = await pool.query(`
            SELECT 
                nm.*,
                c.id_funcionario,
                c.id_posicion as id_posicion_actual,
                c.estado as estado_contrato_actual
            FROM nombramientos nm
            INNER JOIN contratos c ON c.id_contrato = nm.id_contrato_anterior
            WHERE nm.estado = 'PENDIENTE' 
            AND nm.fecha_efectiva <= CURDATE()
            AND c.estado = 'ACTIVO'
            ORDER BY nm.fecha_efectiva ASC
        `);
        return rows;
    },

    marcarEjecutado: async (idNombramiento) => {
        const [result] = await pool.query(`
            UPDATE nombramientos 
            SET estado = 'EJECUTADO', 
                ejecutado_at = NOW() 
            WHERE id_nombramiento = ?
        `, [idNombramiento]);
        return result;
    },

    getById: async (idNombramiento) => {
        const [rows] = await pool.query(`
            SELECT * FROM nombramientos WHERE id_nombramiento = ?
        `, [idNombramiento]);
        return rows[0];
    },

    getByFuncionario: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                n.*,
                c_ant.numero_contrato as contrato_anterior,
                c_nuevo.numero_contrato as contrato_nuevo,
                c_ant.cargo as cargo_anterior,
                c_nuevo.cargo as cargo_nuevo
            FROM nombramientos n
            INNER JOIN contratos c_ant ON n.id_contrato_anterior = c_ant.id_contrato
            INNER JOIN contratos c_nuevo ON n.id_contrato_nuevo = c_nuevo.id_contrato
            WHERE n.id_funcionario = ?
            ORDER BY n.fecha_nombramiento DESC
        `, [idFuncionario]);
        return rows;
    },

    getAll: async (filtros = {}) => {
        let query = `
        SELECT 
            n.id_nombramiento,
            n.codigo_nombramiento,
            n.id_contrato_anterior,
            n.id_contrato_nuevo,
            n.id_posicion_nueva,
            n.id_posicion_anterior,
            n.id_funcionario,
            n.fecha_nombramiento,
            n.fecha_efectiva,
            n.estado,
            
            -- Datos del contrato anterior
            ca.numero_contrato as numero_contrato,
            ca.cargo as cargo_anterior,
            ca.salario as salario_anterior,
            ca.fecha_inicio as fecha_inicio_anterior,
            ca.estado as estado_contrato_anterior,
            ca.lugar_labores as departamento_anterior,
            
            -- Datos del contrato nuevo
            cn.numero_contrato as contrato_nuevo_numero,
            cn.cargo as cargo_nuevo,
            cn.salario as salario_nuevo,
            cn.fecha_inicio as fecha_inicio_nuevo,
            cn.estado as estado_contrato_nuevo,
            
            -- Datos del funcionario
            f.nombres,
            f.apellidos,
            f.tipo_documento,
            f.numero_documento,
            f.correo_electronico,
            
            -- Datos de la posición nueva
            cb.nombre_cargo as nombre_cargo_nuevo,
            d.nombre_departamento as departamento_nuevo,
            
            -- Posición anterior (fija)
            cbf.nombre_cargo as nombre_cargo_anterior
            
        FROM nombramientos n
        INNER JOIN contratos ca ON n.id_contrato_anterior = ca.id_contrato
        INNER JOIN contratos cn ON n.id_contrato_nuevo = cn.id_contrato
        INNER JOIN funcionarios f ON n.id_funcionario = f.id_funcionario
        LEFT JOIN posiciones_cargo pc ON n.id_posicion_nueva = pc.id_posicion
        LEFT JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
        LEFT JOIN departamentos d ON pc.id_departamento = d.id_departamento
        LEFT JOIN posiciones_cargo_fijo pf ON n.id_posicion_anterior = pf.id_posicion_fijo
        LEFT JOIN cargos_base cbf ON pf.id_cargo_base = cbf.id_cargo_base
        WHERE 1=1
    `;

        const params = [];

        // Filtros
        if (filtros.estado) {
            query += ' AND n.estado = ?';
            params.push(filtros.estado);
        }

        if (filtros.id_funcionario) {
            query += ' AND n.id_funcionario = ?';
            params.push(filtros.id_funcionario);
        }

        if (filtros.fecha_desde) {
            query += ' AND n.fecha_nombramiento >= ?';
            params.push(filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
            query += ' AND n.fecha_nombramiento <= ?';
            params.push(filtros.fecha_hasta);
        }

        // Búsqueda por texto
        if (filtros.busqueda) {
            const busqueda = `%${filtros.busqueda}%`;
            query += ` AND (
            f.nombres LIKE ? OR 
            f.apellidos LIKE ? OR 
            f.numero_documento LIKE ? OR 
            n.codigo_nombramiento LIKE ? OR
            ca.numero_contrato LIKE ? OR
            cn.numero_contrato LIKE ?
        )`;
            params.push(busqueda, busqueda, busqueda, busqueda, busqueda, busqueda);
        }

        // Ordenamiento
        const orden = filtros.orden || 'DESC';
        const ordenarPor = filtros.ordenar_por || 'n.fecha_nombramiento';
        query += ` ORDER BY ${ordenarPor} ${orden}`;

        // Paginación
        if (filtros.limite) {
            query += ' LIMIT ?';
            params.push(parseInt(filtros.limite));

            if (filtros.pagina) {
                const offset = (parseInt(filtros.pagina) - 1) * parseInt(filtros.limite);
                query += ' OFFSET ?';
                params.push(offset);
            }
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Contar nombramientos (para paginación)
    getCount: async (filtros = {}) => {
        let query = `
        SELECT COUNT(*) as total
        FROM nombramientos n
        INNER JOIN funcionarios f ON n.id_funcionario = f.id_funcionario
        WHERE 1=1
    `;

        const params = [];

        if (filtros.estado) {
            query += ' AND n.estado = ?';
            params.push(filtros.estado);
        }

        if (filtros.id_funcionario) {
            query += ' AND n.id_funcionario = ?';
            params.push(filtros.id_funcionario);
        }

        if (filtros.fecha_desde) {
            query += ' AND n.fecha_nombramiento >= ?';
            params.push(filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
            query += ' AND n.fecha_nombramiento <= ?';
            params.push(filtros.fecha_hasta);
        }

        if (filtros.busqueda) {
            const busqueda = `%${filtros.busqueda}%`;
            query += ` AND (
            f.nombres LIKE ? OR 
            f.apellidos LIKE ? OR 
            f.numero_documento LIKE ? OR 
            n.codigo_nombramiento LIKE ?
        )`;
            params.push(busqueda, busqueda, busqueda, busqueda);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }
};

module.exports = NombramientoModel;