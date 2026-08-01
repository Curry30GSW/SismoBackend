const pool = require('../../config/ConectDb');
const { generarCodigo } = require('../../utils/verificacion');

const DocumentoVerificacionModel = {
    crear: async (data) => {
        const { tipo_documento, id_documento, id_funcionario, nombre_firma, cargo_firma } = data;

        // Generar código único
        const codigo = generarCodigo(tipo_documento, id_documento);

        const query = `
        INSERT INTO documentos_verificacion (
            codigo,
            tipo_documento,
            id_documento,
            id_funcionario,
            nombre_firma,
            cargo_firma,
            activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            codigo,
            tipo_documento,
            id_documento,
            id_funcionario,
            nombre_firma || null,
            cargo_firma || null,
            true
        ];

        const [result] = await pool.query(query, values);

        return {
            id_verificacion: result.insertId,
            codigo,
            tipo_documento,
            id_documento,
            id_funcionario,
            nombre_firma,
            cargo_firma
        };
    },

    // Obtener código por tipo y ID de documento
    obtenerPorReferencia: async (tipo_documento, id_documento) => {
        const [rows] = await pool.query(`
            SELECT * FROM documentos_verificacion 
            WHERE tipo_documento = ? AND id_documento = ? AND activo = true
        `, [tipo_documento, id_documento]);

        return rows[0] || null;
    },

    // Verificar código
    verificar: async (codigo) => {
        const [rows] = await pool.query(`
            SELECT * FROM documentos_verificacion 
            WHERE codigo = ? AND activo = true
        `, [codigo]);

        if (rows.length === 0) return null;

        return rows[0];
    },

    // Desactivar código (para anular documento)
    desactivar: async (codigo) => {
        const [result] = await pool.query(`
            UPDATE documentos_verificacion 
            SET activo = false 
            WHERE codigo = ?
        `, [codigo]);

        return result;
    },

    // Obtener información completa del documento verificado
    obtenerDocumentoCompleto: async (tipo_documento, id_documento) => {
        let query = '';
        let params = [id_documento];

        switch (tipo_documento) {
            case 'CONTRATO':
                query = `
                   SELECT 
                    c.*,
                    f.nombres,
                    f.apellidos,
                    f.numero_documento,
                    f.tipo_documento,
                    f.direccion,
                    f.telefono,
                    f.sexo,
                    f.correo_electronico,
                    f.fecha_nacimiento,
                    f.lugar_nacimiento,
                    f.lugar_expedicion,
                    f.numero_cuenta_bancaria,
                    f.tipo_cuenta,
                    
                    -- Datos de banco
                    b.id_banco,
                    b.nombre_banco,
                    
                    -- Datos de EPS
                    e.id_eps,
                    e.nombre_eps,
                    e.codigo_eps,
                    
                    -- Datos de Cesantías
                    ce.id_cesantia,
                    ce.nombre_cesantia,
                    ce.codigo_cesantia,
                    
                    -- Datos de Pensión
                    p.id_pension,
                    p.nombre_pension,
                    p.codigo_pension,
                    
                    -- Datos de Caja de Compensación
                    cc.id_caja,
                    cc.nombre_caja,
                    cc.codigo_caja,
                    
                    -- Datos de Nivel de Riesgo (ARL se guarda como texto en c.arl)
                    nr.id_riesgo,
                    nr.clase_riesgo,
                    nr.tarifa,
                    
                    -- Datos de la posición
                    pc.codigo_posicion,
                    d.nombre_departamento,
                    cb.nombre_cargo as cargo_base_nombre
                    
                FROM contratos c
                INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
                LEFT JOIN bancos b ON f.id_banco = b.id_banco
                LEFT JOIN eps e ON f.id_eps = e.id_eps
                LEFT JOIN cesantias ce ON f.id_cesantia = ce.id_cesantia
                LEFT JOIN pensiones p ON f.id_pension = p.id_pension
                LEFT JOIN caja_compensacion cc ON f.id_caja_compensacion = cc.id_caja
                LEFT JOIN nivel_riesgo nr ON c.id_riesgo = nr.id_riesgo
                LEFT JOIN posiciones_cargo pc ON c.id_posicion = pc.id_posicion
                LEFT JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
                LEFT JOIN departamentos d ON pc.id_departamento = d.id_departamento
                WHERE c.id_contrato = ?
                `;
                break;

            case 'ASCENSO':
                query = `
                    SELECT 
                        a.codigo_ascenso,
                        a.fecha_ascenso,
                        a.created_at,
                        c_nuevo.numero_contrato as numero_contrato,
                        c_ant.cargo as cargo_anterior,
                        c_nuevo.cargo as cargo_nuevo,
                        c_ant.salario as salario_anterior,
                        c_nuevo.salario as salario_nuevo,
                        c_ant.fecha_inicio as fecha_inicio_anterior,
                        c_ant.lugar_labores as departamento_anterior,
                        c_nuevo.lugar_labores as departamento_nuevo,
                        f.nombres,
                        f.apellidos,
                        f.numero_documento as numero_documento,
                        'ASCENSO' as tipo
                    FROM ascensos a
                    INNER JOIN contratos c_ant ON a.id_contrato_anterior = c_ant.id_contrato
                    INNER JOIN contratos c_nuevo ON a.id_contrato_nuevo = c_nuevo.id_contrato
                    INNER JOIN funcionarios f ON c_nuevo.id_funcionario = f.id_funcionario
                    WHERE a.id_ascenso = ?
                `;
                break;

            case 'ENCARGATURA':
                query = `
                    SELECT 
                        e.*,
                        pf.codigo_posicion,
                        cb.nombre_cargo,
                        d.nombre_departamento,
                        f.nombres,
                        f.apellidos,
                        f.tipo_documento as funcionario_tipo_documento,
                        f.numero_documento as funcionario_numero_documento,
                        'ENCARGATURA' as tipo
                    FROM encargaturas e
                    INNER JOIN posiciones_cargo_fijo pf ON e.id_posicion_fijo = pf.id_posicion_fijo
                    INNER JOIN cargos_base cb ON pf.id_cargo_base = cb.id_cargo_base
                    INNER JOIN departamentos d ON pf.id_departamento = d.id_departamento
                    INNER JOIN funcionarios f ON e.id_funcionario = f.id_funcionario
                    WHERE e.id_encargatura = ?
                `;
                break;

            case 'PRORROGA':
                query = `
                    SELECT 
                        p.*,
                        c.numero_contrato,
                        c.cargo,
                        c.salario,
                        f.nombres,
                        f.apellidos,
                        f.tipo_documento as funcionario_tipo_documento,
                        f.numero_documento as funcionario_numero_documento,
                        'PRORROGA' as tipo
                    FROM prorrogas_contrato p
                    INNER JOIN contratos c ON p.id_contrato = c.id_contrato
                    INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
                    WHERE p.id_prorroga = ?
                `;
                break;

            case 'NO_PRORROGA':
                query = `
                    SELECT 
                        n.*,
                        c.numero_contrato,
                        c.cargo,
                        c.salario,
                        c.fecha_inicio as contrato_fecha_inicio,
                        c.fecha_fin as contrato_fecha_fin,
                        f.nombres,
                        f.apellidos,
                        f.tipo_documento as funcionario_tipo_documento,
                        f.numero_documento as funcionario_numero_documento,
                        'NO_PRORROGA' as tipo
                    FROM preavisos_no_prorroga n
                    INNER JOIN contratos c ON n.id_contrato = c.id_contrato
                    INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
                    WHERE n.id_preaviso = ?
                `;
                break;

            default:
                return null;
        }

        const [rows] = await pool.query(query, params);
        const documento = rows[0] || null;

        if (tipo_documento === 'CONTRATO' && documento) {
            const [clausulas] = await pool.query(`
            SELECT * FROM clausulas_contrato
            WHERE id_contrato = ?
            ORDER BY orden
        `, [id_documento]);

            documento.clausulas = clausulas;
        }

        return documento;
    },

    actualizarFirma: async (idVerificacion, nombreFirma, cargoFirma) => {
        const [result] = await pool.query(`
        UPDATE documentos_verificacion 
        SET nombre_firma = ?, cargo_firma = ? 
        WHERE id_verificacion = ?
    `, [nombreFirma, cargoFirma, idVerificacion]);

        return result;
    },
};

module.exports = DocumentoVerificacionModel;