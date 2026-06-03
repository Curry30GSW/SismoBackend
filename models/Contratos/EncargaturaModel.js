const pool = require('../../config/ConectDb');

const EncargaturaModel = {
    // Generar código de encargatura
    generarCodigoEncargatura: async () => {
        try {
            const anioActual = new Date().getFullYear();

            // Buscar el último código del año actual
            const [rows] = await pool.query(`
            SELECT codigo_encargatura 
            FROM encargaturas 
            WHERE codigo_encargatura LIKE ? 
            ORDER BY id_encargatura DESC 
            LIMIT 1
        `, [`ENC-${anioActual}-%`]);

            let nuevoNumero = 1;
            if (rows[0] && rows[0].codigo_encargatura) {
                const match = rows[0].codigo_encargatura.match(/ENC-\d+-(\d+)/);
                if (match) {
                    nuevoNumero = parseInt(match[1]) + 1;
                }
            }

            // Sin padding, solo el número
            return `ENC-${anioActual}-${nuevoNumero}`;
        } catch (error) {
            console.error('Error generando código de encargatura:', error);
            const timestamp = Date.now().toString().slice(-6);
            return `ENC-${timestamp}`;
        }
    },

    // Crear registro de encargatura
    create: async (data) => {
        const query = `
            INSERT INTO encargaturas (
                codigo_encargatura,
                id_posicion_fijo,
                id_funcionario,
                id_anio_legal,
                fecha_inicio,
                fecha_fin,
                hasta_nuevo_aviso,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.codigo_encargatura,
            data.id_posicion_fijo,
            data.id_funcionario,
            data.id_anio_legal,
            data.fecha_inicio,
            data.fecha_fin || null,
            data.hasta_nuevo_aviso || false,
            data.usuario_creacion || 'SISTEMA'
        ];

        const [result] = await pool.query(query, values);
        return { id_encargatura: result.insertId, ...data };
    },

    // Obtener encargatura por ID con datos completos
    getById: async (idEncargatura) => {
        const [rows] = await pool.query(`
            SELECT 
                e.id_encargatura,
                e.codigo_encargatura,
                e.fecha_inicio,
                e.fecha_fin,
                e.hasta_nuevo_aviso,
                e.created_at,
                
                -- Datos de la posición fijo
                pf.id_posicion_fijo,
                pf.codigo_posicion,
                pf.sede_ubicacion,
                cb.nombre_cargo,
                d.nombre_departamento,
                
                -- Datos del funcionario
                f.id_funcionario,
                f.tipo_documento,
                f.numero_documento,
                f.nombres,
                f.apellidos,
                f.correo_electronico,
                f.telefono,
                
                -- Datos del contrato actual del funcionario
                c.numero_contrato,
                c.fecha_inicio as fecha_inicio_contrato,
                c.cargo as cargo_actual,
                c.lugar_labores as departamento_actual,
                
                -- Año legal
                al.anio
                
            FROM encargaturas e
            INNER JOIN posiciones_cargo_fijo pf ON e.id_posicion_fijo = pf.id_posicion_fijo
            INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pf.id_departamento = d.id_departamento
            INNER JOIN funcionarios f ON e.id_funcionario = f.id_funcionario
            LEFT JOIN anios_legales al ON e.id_anio_legal = al.id_anio_legal
            LEFT JOIN (
                SELECT * FROM contratos c2 
                WHERE c2.estado IN ('ACTIVO', 'PRORROGADO')
                ORDER BY c2.fecha_inicio DESC 
                LIMIT 1
            ) c ON c.id_funcionario = f.id_funcionario
            WHERE e.id_encargatura = ?
        `, [idEncargatura]);

        return rows[0];
    },

    // Obtener encargaturas por funcionario
    getByFuncionario: async (idFuncionario) => {
        const [rows] = await pool.query(`
            SELECT 
                e.id_encargatura,
                e.codigo_encargatura,
                e.fecha_inicio,
                e.fecha_fin,
                e.hasta_nuevo_aviso,
                e.created_at,
                pf.codigo_posicion,
                cb.nombre_cargo,
                d.nombre_departamento
            FROM encargaturas e
            INNER JOIN posiciones_cargo_fijo pf ON e.id_posicion_fijo = pf.id_posicion_fijo
            INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pf.id_departamento = d.id_departamento
            WHERE e.id_funcionario = ?
            ORDER BY e.fecha_inicio DESC
        `, [idFuncionario]);
        return rows;
    },

    // Obtener encargaturas activas (sin fecha_fin o fecha_fin > hoy)
    getActivas: async () => {
        const [rows] = await pool.query(`
            SELECT 
                e.*,
                f.nombres,
                f.apellidos,
                cb.nombre_cargo,
                d.nombre_departamento
            FROM encargaturas e
            INNER JOIN funcionarios f ON e.id_funcionario = f.id_funcionario
            INNER JOIN posiciones_cargo_fijo pf ON e.id_posicion_fijo = pf.id_posicion_fijo
            INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pf.id_departamento = d.id_departamento
            WHERE e.hasta_nuevo_aviso = true 
               OR e.fecha_fin >= CURDATE()
            ORDER BY e.fecha_inicio DESC
        `);
        return rows;
    },

    // Obtener todas las encargaturas con paginación
    getAll: async (limit = 100, offset = 0) => {
        const [rows] = await pool.query(`
            SELECT 
                e.id_encargatura,
                e.codigo_encargatura,
                e.fecha_inicio,
                e.fecha_fin,
                e.hasta_nuevo_aviso,
                e.created_at,
                f.nombres,
                f.apellidos,
                f.numero_documento,
                cb.nombre_cargo,
                d.nombre_departamento
            FROM encargaturas e
            INNER JOIN funcionarios f ON e.id_funcionario = f.id_funcionario
            INNER JOIN posiciones_cargo pf ON e.id_posicion_fijo = pf.id_posicion
            INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pf.id_departamento = d.id_departamento
            ORDER BY e.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        return rows;
    },

    // Obtener count total
    getCount: async () => {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM encargaturas');
        return rows[0].total;
    },

    finalizarEncargatura: async (idEncargatura, fechaFinalizacion) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Obtener la encargatura con el id_posicion_fijo
            const [encargatura] = await connection.query(
                `SELECT id_encargatura, id_posicion_fijo, id_funcionario 
             FROM encargaturas 
             WHERE id_encargatura = ?`,
                [idEncargatura]
            );

            if (encargatura.length === 0) {
                throw new Error('Encargatura no encontrada');
            }

            const datosEncargatura = encargatura[0];

            // 2. Verificar si ya está finalizada
            if (datosEncargatura.fecha_fin && datosEncargatura.fecha_fin < new Date()) {
                throw new Error('Esta encargatura ya está vencida o finalizada');
            }

            // 3. Actualizar la encargatura con fecha de finalización
            const fechaFin = fechaFinalizacion || new Date().toISOString().split('T')[0];

            await connection.query(
                `UPDATE encargaturas 
             SET fecha_fin = ?, 
                 hasta_nuevo_aviso = 0
             WHERE id_encargatura = ?`,
                [fechaFin, idEncargatura]
            );

            // 4. Liberar la posición (quitar encargatura)
            await connection.query(
                `UPDATE posiciones_cargo
             SET id_funcionario = NULL,
                 encargado = 0
             WHERE id_posicion = ?`,
                [datosEncargatura.id_posicion_fijo]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Encargatura finalizada y posición liberada exitosamente',
                data: {
                    id_encargatura: idEncargatura,
                    id_posicion_fijo: datosEncargatura.id_posicion_fijo,
                    fecha_fin: fechaFin,
                    posicion_liberada: true
                }
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error al finalizar encargatura:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = EncargaturaModel;