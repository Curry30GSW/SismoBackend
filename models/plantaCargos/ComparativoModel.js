const pool = require('../../config/ConectDb');

const ComparativoModel = {
    // Obtener comparativo por cargo entre dos años
    getComparativoCargos: async (idAnio1, idAnio2, auxilio1, auxilio2) => {
        const [rows] = await pool.query(`
            SELECT 
                cb.id_cargo_base,
                cb.nombre_cargo,
                cb.es_director_agencia,
                
                -- Datos año 1 (anterior)
                COUNT(DISTINCT pc1.id_posicion) as total_posiciones_1,
                COUNT(DISTINCT CASE WHEN pc1.id_funcionario IS NOT NULL THEN pc1.id_posicion END) as ocupadas_1,
                MAX(hsc1.salario_base) as salario_base_1,
                MAX(hsc1.bonificacion) as bonificacion_1,
                MAX(CASE WHEN hsc1.aplica_auxilio_transporte = 1 THEN ? ELSE 0 END) as auxilio_valor_1,
                
                -- Datos año 2 (actual)
                COUNT(DISTINCT pc2.id_posicion) as total_posiciones_2,
                COUNT(DISTINCT CASE WHEN pc2.id_funcionario IS NOT NULL THEN pc2.id_posicion END) as ocupadas_2,
                MAX(hsc2.salario_base) as salario_base_2,
                MAX(hsc2.bonificacion) as bonificacion_2,
                MAX(CASE WHEN hsc2.aplica_auxilio_transporte = 1 THEN ? ELSE 0 END) as auxilio_valor_2
                
            FROM cargos_base cb
            LEFT JOIN posiciones_cargo pc1 
                ON cb.id_cargo_base = pc1.id_cargo_base 
                AND pc1.id_anio_legal = ? 
                AND pc1.activo = true
            LEFT JOIN historico_salarios_cargo hsc1 
                ON cb.id_cargo_base = hsc1.id_cargo_base 
                AND hsc1.id_anio_legal = ? 
                AND hsc1.activo = true
            LEFT JOIN posiciones_cargo pc2 
                ON cb.id_cargo_base = pc2.id_cargo_base 
                AND pc2.id_anio_legal = ? 
                AND pc2.activo = true
            LEFT JOIN historico_salarios_cargo hsc2 
                ON cb.id_cargo_base = hsc2.id_cargo_base 
                AND hsc2.id_anio_legal = ? 
                AND hsc2.activo = true
            WHERE cb.activo = true and id_tipo_planta = 1
            GROUP BY cb.id_cargo_base, cb.nombre_cargo, cb.es_director_agencia
            ORDER BY cb.nombre_cargo
        `, [auxilio1, auxilio2, idAnio1, idAnio1, idAnio2, idAnio2]);

        return rows;
    },

    // Obtener resumen comparativo por departamento
    getComparativoDepartamentos: async (idAnio1, idAnio2) => {
        const [rows] = await pool.query(`
            SELECT 
                d.id_departamento,
                d.nombre_departamento,
                
                -- Datos año 1
                COUNT(DISTINCT pc1.id_posicion) as total_posiciones_1,
                COUNT(DISTINCT CASE WHEN pc1.id_funcionario IS NOT NULL THEN pc1.id_posicion END) as ocupadas_1,
                
                -- Datos año 2
                COUNT(DISTINCT pc2.id_posicion) as total_posiciones_2,
                COUNT(DISTINCT CASE WHEN pc2.id_funcionario IS NOT NULL THEN pc2.id_posicion END) as ocupadas_2
                
            FROM departamentos d
            LEFT JOIN posiciones_cargo pc1 
                ON d.id_departamento = pc1.id_departamento 
                AND pc1.id_anio_legal = ? 
                AND pc1.activo = true
            LEFT JOIN posiciones_cargo pc2 
                ON d.id_departamento = pc2.id_departamento 
                AND pc2.id_anio_legal = ? 
                AND pc2.activo = true
            WHERE d.activo = true
            GROUP BY d.id_departamento, d.nombre_departamento
            ORDER BY d.nombre_departamento
        `, [idAnio1, idAnio2]);

        return rows;
    },

    getResumenAnioActual: async (idAnioLegal, auxilioTransporte) => {
        const [rows] = await pool.query(`
        SELECT 
            cb.id_cargo_base,
            cb.nombre_cargo,
            cb.codigo_cargo,
            cb.es_director_agencia,
            
            -- Datos de posiciones del año actual
            COUNT(DISTINCT pc.id_posicion) as total_posiciones,
            
            -- 🔥 OCUPADAS: SOLO cuando tiene funcionario Y NO es encargado
            COUNT(DISTINCT CASE 
                WHEN pc.id_funcionario IS NOT NULL AND (pc.encargado IS NULL OR pc.encargado = 0) 
                THEN pc.id_posicion 
            END) as ocupadas,
            
            -- 🔥 DISPONIBLES: Cuando NO tiene funcionario O es encargado
            COUNT(DISTINCT CASE 
                WHEN pc.id_funcionario IS NULL OR pc.encargado = 1 
                THEN pc.id_posicion 
            END) as disponibles,
            
            -- Datos salariales del año actual
            MAX(hsc.salario_base) as salario_base,
            MAX(hsc.bonificacion) as bonificacion,
            MAX(CASE WHEN hsc.aplica_auxilio_transporte = 1 THEN ? ELSE 0 END) as auxilio_valor,
            
            -- Calcular totales
            (MAX(hsc.salario_base) + MAX(hsc.bonificacion) + 
             MAX(CASE WHEN hsc.aplica_auxilio_transporte = 1 THEN ? ELSE 0 END)) as total_salario_individual,
            
            -- Total planta (salario total * posiciones)
            ((MAX(hsc.salario_base) + MAX(hsc.bonificacion) + 
              MAX(CASE WHEN hsc.aplica_auxilio_transporte = 1 THEN ? ELSE 0 END)) * 
             COUNT(DISTINCT pc.id_posicion)) as total_planta
            
        FROM cargos_base cb
        LEFT JOIN posiciones_cargo pc 
            ON cb.id_cargo_base = pc.id_cargo_base 
            AND pc.id_anio_legal = ? 
            AND pc.activo = true
        LEFT JOIN historico_salarios_cargo hsc 
            ON cb.id_cargo_base = hsc.id_cargo_base 
            AND hsc.id_anio_legal = ? 
            AND hsc.activo = true
        WHERE cb.activo = true AND id_tipo_planta = 1
        GROUP BY cb.id_cargo_base, cb.nombre_cargo, cb.codigo_cargo, cb.es_director_agencia
        ORDER BY cb.nombre_cargo
    `, [auxilioTransporte, auxilioTransporte, auxilioTransporte, idAnioLegal, idAnioLegal]);

        return rows;
    },

    // Obtener totales generales del año actual
    getTotalesAnioActual: async (idAnioLegal, auxilioTransporte) => {
        const [rows] = await pool.query(`
        SELECT 
            COUNT(DISTINCT pc.id_posicion) as total_posiciones,
            
            -- 🔥 OCUPADAS: SOLO cuando tiene funcionario Y NO es encargado
            COUNT(DISTINCT CASE 
                WHEN pc.id_funcionario IS NOT NULL AND (pc.encargado IS NULL OR pc.encargado = 0) 
                THEN pc.id_posicion 
            END) as total_ocupadas,
            
            -- 🔥 DISPONIBLES: Cuando NO tiene funcionario O es encargado
            COUNT(DISTINCT CASE 
                WHEN pc.id_funcionario IS NULL OR pc.encargado = 1 
                THEN pc.id_posicion 
            END) as total_disponibles,
            
            -- Funcionarios asignados (personas únicas)
            COUNT(DISTINCT pc.id_funcionario) as funcionarios_asignados,
            
            -- Total planta general (con la misma lógica de encargados)
            SUM(
                (hsc.salario_base + hsc.bonificacion + 
                 CASE WHEN hsc.aplica_auxilio_transporte = 1 THEN ? ELSE 0 END)
            ) as total_planta_mensual
            
        FROM posiciones_cargo pc
        INNER JOIN historico_salarios_cargo hsc 
            ON pc.id_cargo_base = hsc.id_cargo_base 
            AND hsc.id_anio_legal = ? 
            AND hsc.activo = true
        WHERE pc.id_anio_legal = ? AND pc.activo = true
    `, [auxilioTransporte, idAnioLegal, idAnioLegal]);

        return rows[0];
    },

};

module.exports = ComparativoModel;