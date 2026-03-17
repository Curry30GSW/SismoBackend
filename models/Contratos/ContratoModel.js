const pool = require('../../config/ConectDb');

const ContratoModel = {
    // =============================================
    // CREATE
    // =============================================
    create: async (data) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Insertar contrato
            const [result] = await connection.query(`
                INSERT INTO contratos (
                    id_funcionario,
                    id_posicion,
                    id_anio_legal,
                    tipo_contrato,
                    numero_contrato,
                    fecha_inicio,
                    fecha_fin,
                    termino_inicial,
                    cargo,
                    salario,
                    periodo_pago,
                    horas_laborales,
                    lugar_labores,
                    ciudad_contratacion,
                    id_arl,
                    id_nivel_riesgo,
                    estado,
                    usuario_creacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                data.id_funcionario,
                data.id_posicion,
                data.id_anio_legal,
                data.tipo_contrato,
                data.numero_contrato || null,
                data.fecha_inicio,
                data.fecha_fin || null,
                data.termino_inicial || null,
                data.cargo,
                data.salario,
                data.periodo_pago || 'MENSUAL',
                data.horas_laborales || 220,
                data.lugar_labores,
                data.ciudad_contratacion || 'CALI',
                data.id_arl || null,
                data.id_nivel_riesgo || null,
                'ACTIVO',
                data.usuario_creacion || 'SISTEMA'
            ]);

            const idContrato = result.insertId;

            // 2. Insertar cláusulas según tipo de contrato
            const clausulas = this._obtenerClausulasPorTipo(
                data.tipo_contrato,
                data.fecha_inicio,
                data.fecha_fin,
                data.termino_inicial,
                data.cargo,
                data.lugar_labores
            );

            for (const clausula of clausulas) {
                await connection.query(`
                    INSERT INTO clausulas_contrato (
                        id_contrato,
                        titulo,
                        contenido,
                        orden
                    ) VALUES (?, ?, ?, ?)
                `, [idContrato, clausula.titulo, clausula.contenido, clausula.orden]);
            }

            await connection.commit();
            return idContrato;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // =============================================
    // CLÁUSULAS POR TIPO DE CONTRATO
    // =============================================
    _obtenerClausulasPorTipo: (tipoContrato, fechaInicio, fechaFin, terminoInicial, cargo, lugarLabores) => {

        // Cláusulas comunes a todos los contratos
        const clausulasComunes = [
            {
                titulo: 'PRIMERA. OBJETO DEL CONTRATO',
                contenido: `EL EMPLEADOR contrata los servicios personales del TRABAJADOR y este se Obliga: a) A poner al servicio del empleador toda su capacidad normal de trabajo, en el desempeño de las funciones propias del Oficio mencionado y las labores anexas y complementarias del mismo, de conformidad con las órdenes e instrucciones que le Imparta EL EMPLEADOR directamente o a través de sus representantes, y b) A prestar sus servicios en forma exclusiva a EL EMPLEADOR, es decir a no prestar directa ni indirectamente servicios laborales a otros empleadores, ni a trabajar por cuenta propia en el mismo oficio, durante la vigencia de este contrato, c) a guardar absoluta reserva sobre los hechos, documentos físicos y/o electrónicos, informaciones y en general, sobre todos los asuntos que lleguen a su conocimiento por causa o con ocasión de su contrato de trabajo. EL TRABAJADOR no puede extraer, compartir, divulgar o dispersar información de la entidad empleadora con terceros ni para beneficio propio.`,
                orden: 1
            },
            {
                titulo: 'SEGUNDA. REMUNERACIÓN',
                contenido: `EL EMPLEADOR pagará al TRABAJADOR por la prestación de sus servicios el salario indicado en el encabezado del presente documento, pagadero en las oportunidades señaladas en la parte superior.
                
PARÁGRAFO PRIMERO: SALARIO ORDINARIO. Dentro del salario ordinario se encuentra incluida la remuneración de los descansos dominicales y festivos de que tratan los capítulos I, II y III del título VII del Código Sustantivo del Trabajo. De igual manera se aclara y se conviene que en los casos en los que el TRABAJADOR devengue comisiones o cualquier otra modalidad de salario variable, el 82,5% de dichos ingresos, constituye remuneración de labor realizada y el 17.5% restante está designado a remunerar el descanso en los días dominicales y festivos que tratan los capítulos I y II del título VII del Código Sustantivo de Trabajo.

PARÁGRAFO SEGUNDO: SALARIO INTEGRAL. En la eventualidad en que EL TRABAJADOR devengue salario integral, se entiende de conformidad con el numeral dos del Artículo 132 del Código Sustantivo de Trabajo, subrogado por el Artículo 18 de la Ley 50 de 1990 que, dentro del salario integral, convenido se encuentra incorporado el factor prestacional del trabajador el cual no será inferior al 30% del salario antes mencionado. De igual manera se conviene y aclara que en los casos en los que el TRABAJADOR devengue comisión o cualquier otra modalidad de salario variable integral, se entenderá que dentro de las sumas reconocidas se encuentra incorporado el factor prestacional del trabajador, el cual no será inferior al 30% del salario antes mencionado. El salario Integral acordado además de retribuir la remuneración ordinaria, remunera y compensa todo recargo por trabajo extraordinario nocturno, dominical o festivo, primas de servicio legales o extralegales, cesantía, e intereses a la cesantía, subsidios y suministros en especie, incidencia prestacional de eventuales viáticos y en general toda prestación o acreencia legal o extralegal derivada del contrato, con excepción de las vacaciones.

PARÁGRAFO TERCERO: Las partes acuerdan que en los casos en que se le reconozcan a EL TRABAJADOR beneficios por concepto de alimentación, comunicaciones, habitación o vivienda, transporte, parqueaderos, vestuario, auxilios de rodamiento, auxilios en dinero o en especie o bonificaciones ocasionales, así como cualquier amparo otorgado por la empresa como seguros de vida y planes exequiales, entre otros, se considerarán tales beneficios o reconocimientos como no salariales y por tanto no se tendrán en cuenta como factor salarial para liquidación de acreencias laborales, y pago de aportes parafiscales de conformidad con los Artículos 128 y 129 del Código Sustantivo del Trabajo subrogados con los Artículos 15 y 16 de la Ley 50 de 1990 en concordancia con el Artículo 17 de la Ley 344 de 1996. Para efectos del pago de aportes al sistema de Seguridad Social, los pagos laborales no constitutivos de salario de los trabajadores particulares no podrán ser superiores al 40% del total de la remuneración de conformidad con lo señalado en el Artículo 30 de la Ley 1393 de 2010.`,
                orden: 2
            },
            {
                titulo: 'CUARTA. TRABAJO NOCTURNO, SUPLEMENTARIO, DOMINICAL Y/O FESTIVO',
                contenido: 'Todo trabajo nocturno, suplementario o en horas extras y todo trabajo en domingo o festivo en los que legalmente debe concederse el descanso, se remunerará conforme a la Ley, salvo acuerdo en contrario contenido en convención, pacto colectivo o laudo arbitral. Para el reconocimiento y pago del trabajo suplementario, nocturno dominical o festivo el empleador o sus representantes deben autorizarlo previamente por escrito. Cuando la necesidad de este trabajo se presente de manera imprevista o inaplazable, deberá ejecutarse y darse cuenta de él por escrito, a la mayor brevedad, a EL EMPLEADOR o sus representantes para su aprobación. EL EMPLEADOR, en consecuencia, no reconocerá ningún trabajo suplementario o trabajo nocturno o en días de descanso legalmente obligatorio que no haya sido autorizado previamente o que, habiendo sido avisado inmediatamente, no haya sido aprobado como queda dicho. Tratándose de trabajadores de dirección, confianza o manejo, no habrá lugar al pago de horas extras.',
                orden: 4
            },
            {
                titulo: 'QUINTA. JORNADA DE TRABAJO',
                contenido: `EL TRABAJADOR se obliga a laborar la jornada máxima legal, salvo acuerdo especial, cumpliendo con los turnos y horarios que señale EL EMPLEADOR, pudiendo hacer éste ajustes o cambios de horario cuando lo estime conveniente, sin que ello se considere como una desmejora en las condiciones laborales del TRABAJADOR. Por el acuerdo expreso o tácito de las partes, podrán repartirse las horas de la jornada ordinaria con base en lo dispuesto por el Artículo 164 del Código Sustantivo de Trabajo modificado por el artículo 23 de la Ley 50 de 1990, teniendo en cuenta que los tiempos de descanso entre las secciones de la jornada no se computan dentro de la misma, según el artículo 167 ibidem.`,
                orden: 5
            },
            {
                titulo: 'SEXTA. PERIODO DE PRUEBA',
                contenido: tipoContrato === 'TERMINO_FIJO'
                    ? 'La quinta parte de la duración inicial del presente contrato se considera como periodo de prueba, sin que exceda de dos meses contados a partir de la fecha de inicio y por consiguiente cualquiera de las partes podrá terminar el contrato unilateralmente, en cualquier momento durante dicho periodo y sin previo aviso, sin que se cause el pago de indemnización alguna. En caso de prórrogas del presente contrato se entenderá que no hay nuevo periodo de prueba.'
                    : 'Los primeros dos meses del presente contrato se consideran como periodo de prueba y, por consiguiente, cualquiera de las partes podrá dar por terminado el contrato unilateralmente, en cualquier momento durante dicho periodo y sin previo aviso, sin que se cause el pago de indemnización alguna.',
                orden: 6
            },
            {
                titulo: 'SÉPTIMA. TERMINACIÓN UNILATERAL',
                contenido: 'Son justas causas para dar por terminado unilateralmente este contrato por cualquiera de las partes, las enumeradas en los artículos 62 del Código Sustantivo del Trabajo, modificado por el Artículo 7 del Decreto 2351 de 1965 y además, por parte de EL EMPLEADOR, las faltas que para el efecto se califiquen como graves en reglamentos, manuales, instructivos y demás documentos que contengan reglamentaciones, órdenes, instrucciones o prohibiciones de carácter general o particular, pactos convenciones colectivas, laudos arbitrales y las que expresamente convengan calificar así en escritos que formarán parte integral del presente contrato. Expresamente se califican en este acto como faltas graves, la violación de las obligaciones y prohibiciones contenidas en la cláusula primera del presente contrato.',
                orden: 7
            },
            {
                titulo: 'OCTAVA. PROPIEDAD INTELECTUAL',
                contenido: 'Las partes acuerdan que todas las invenciones, descubrimientos y trabajos originales concebidos o hechos por EL TRABAJADOR en vigencia del presente contrato pertenecerán a EL EMPLEADOR, por lo cual EL TRABAJADOR se obliga a informar a EL EMPLEADOR de forma inmediata sobre la existencia de dichas invenciones y/o trabajos originales. EL TRABAJADOR accederá a facilitar el cumplimiento oportuno de las correspondientes formalidades y dará su firma o extenderá los poderes y documentos necesarios para transferir la propiedad intelectual a EL EMPLEADOR cuando así se lo solicite. Teniendo en cuenta lo dispuesto en la normatividad de derechos de autor y lo estipulado anteriormente, las partes acuerdan que el salario devengado contiene la remuneración por la transferencia de todo tipo de propiedad intelectual, razón por la cual no se causará ninguna compensación adicional.',
                orden: 8
            },
            {
                titulo: 'NOVENA. MODIFICACIÓN DE LAS CONDICIONES LABORALES',
                contenido: 'EL TRABAJADOR acepta desde hoy expresamente todas las modificaciones de sus condiciones laborales determinadas por EL EMPLEADOR en ejercicio de su poder subordinante, tales como el horario de trabajo, el lugar de prestación del servicio, y el cargo u oficio y/o funciones y siempre que tales modificaciones no afecten su honor, dignidad o sus derechos mínimos, ni impliquen desmejoras sustanciales o graves perjuicios para él, de conformidad con lo dispuesto por el Artículo 23 del Código Sustantivo de Trabajo modificado por el Artículo 1° de la Ley 50 de 1990. Los gastos que se originen por el traslado de lugar de prestación del servicio de EL TRABAJADOR serán cubiertos por EL EMPLEADOR, de conformidad con el numeral 8 del Artículo 57 del Código Sustantivo del Trabajo.',
                orden: 9
            },
            {
                titulo: 'DÉCIMA. DIRECCIÓN DEL TRABAJADOR',
                contenido: 'EL TRABAJADOR para todos los efectos legales, y en especial para la aplicación del parágrafo 1 del Artículo 29 de la Ley 78, se compromete a informar por escrito y de manera inmediata a EL EMPLEADOR a cualquier cambio en su dirección de residencia, teniéndose en todo caso como suya la última dirección registrada en su hoja de vida.',
                orden: 10
            },
            {
                titulo: 'DÉCIMA PRIMERA. ACEPTACIÓN DE NORMATIVA INTERNA',
                contenido: 'EL TRABAJADOR acepta y se acoge a los Estatutos, el Reglamento Interno de Trabajo, el Manual de Normas Disciplinarias, así como las políticas e instructivos establecidos por EL EMPLEADOR.',
                orden: 11
            },
            {
                titulo: 'DÉCIMA SEGUNDA. EFECTOS',
                contenido: 'El presente contrato reemplaza en su integridad y deja sin efecto alguno cualquiera otro contrato verbal o escrito celebrado por las partes con anterioridad, pudiendo las partes convenir por escrito modificaciones al mismo, las que formarán parte integral de este contrato.',
                orden: 12
            },
            {
                titulo: 'DÉCIMA TERCERA. TRATAMIENTO DE DATOS',
                contenido: 'EL TRABAJADOR en calidad de titular de la información y en virtud de lo dispuesto en la Ley 1581 de 2012 y demás normas que la modifiquen, adicionen y/o complementen, autoriza de manera irrevocable, expresa y voluntaria a EL EMPLEADOR con la finalidad que la información personal de la cual es titular sea consultada, reportada y validada en las centrales de información.',
                orden: 13
            }
        ];

        // Cláusulas específicas por tipo de contrato
        let clausulasEspecificas = [];

        if (tipoContrato === 'INDEFINIDO') {
            clausulasEspecificas = [
                {
                    titulo: 'TERCERA. DURACIÓN DEL CONTRATO',
                    contenido: 'La duración del presente contrato será indefinida, mientras subsistan las causas que le dieron origen y la materia del trabajo contratado.',
                    orden: 3
                }
            ];
        }
        else if (tipoContrato === 'TERMINO_FIJO') {
            clausulasEspecificas = [
                {
                    titulo: 'TERCERA. DURACIÓN DEL CONTRATO',
                    contenido: `El término inicial de duración del contrato será ${terminoInicial || 'el señalado en la parte superior'}, comprendido entre el ${fechaInicio} y el ${fechaFin}. Si antes de la fecha de vencimiento de este término, ninguna de las partes avisare por escrito a la otra su determinación de no prorrogar el contrato con antelación no inferior a treinta (30) días, este se entenderá prorrogado por un periodo igual al inicialmente pactado. Por tratarse de un contrato a término fijo inferior a un año, únicamente podrá prorrogarse sucesivamente el contrato hasta por tres (3) periodos iguales o inferiores, al cabo de los cuales el término de renovación no podrá ser inferior a un año y así sucesivamente.`,
                    orden: 3
                }
            ];
        }
        else if (tipoContrato === 'APRENDIZ') {
            clausulasEspecificas = [
                {
                    titulo: 'PRIMERA. OBJETO DEL CONTRATO DE APRENDIZAJE',
                    contenido: `El presente contrato tiene como objeto garantizar al APRENDIZ la formación profesional metódica y completa en la especialidad de ${cargo || 'la formación establecida'}, la cual se impartirá en su etapa lectiva en los ambientes de formación del CENTRO DE FORMACIÓN, y en su etapa práctica se desarrollará en los ambientes reales de trabajo de la EMPRESA PATROCINADORA en ${lugarLabores}.`,
                    orden: 1
                },
                {
                    titulo: 'SEGUNDA. DURACIÓN DEL CONTRATO DE APRENDIZAJE',
                    contenido: `El presente contrato tiene un término de duración comprendido entre el ${fechaInicio} fecha de iniciación del Contrato y el ${fechaFin} fecha de terminación de este. Esta duración deberá ajustarse al diseño curricular del programa de formación y no podrá exceder de TRES (3) años, de conformidad con lo dispuesto por el artículo 81 del Código Sustantivo del Trabajo.`,
                    orden: 2
                },
                {
                    titulo: 'TERCERA. MODALIDAD DE FORMACIÓN',
                    contenido: 'La formación será de tipo [dual / tradicional], compuesta por las siguientes fases: Fase lectiva y Fase práctica, según el cronograma establecido por la institución educativa.',
                    orden: 3
                },
                {
                    titulo: 'CUARTA. NATURALEZA JURÍDICA',
                    contenido: 'El presente contrato de aprendizaje tiene el carácter de laboral especial y a término fijo, conforme al artículo 81 del Código Sustantivo del Trabajo, modificado por el artículo 21 de la Ley 2466 de 2025. Su finalidad es facilitar la formación teórico-práctica del aprendiz en la ocupación, oficio o profesión, en concordancia con el programa de formación de la institución educativa.',
                    orden: 4
                },
                {
                    titulo: 'QUINTA. APOYO DE SOSTENIMIENTO MENSUAL',
                    contenido: 'Durante la vigencia del contrato, la EMPRESA PATROCINADORA se compromete a pagar al APRENDIZ un apoyo de sostenimiento mensual durante toda la formación, siendo equivalente al 75% del salario mínimo legal mensual vigente durante la etapa lectiva y al 100% durante la etapa práctica, o según lo establecido en la ley.',
                    orden: 5
                },
                {
                    titulo: 'SEXTA. SEGURIDAD SOCIAL',
                    contenido: 'LA EMPRESA garantizará la afiliación y pago mensual de la cotización del APRENDIZ al Sistema de Seguridad Social, conforme a la etapa del contrato: en fase lectiva: salud y riesgos laborales; en fase práctica: salud, pensión y riesgos laborales.',
                    orden: 6
                },
                {
                    titulo: 'SÉPTIMA. DERECHOS LABORALES EN LA ETAPA PRÁCTICA',
                    contenido: 'Durante la etapa práctica o durante toda la formación dual, EL APRENDIZ tendrá derecho al reconocimiento y pago a cargo de la EMPRESA PATROCINADORA de todas las prestaciones, auxilios y demás derechos propios del contrato laboral, incluyendo: prima de servicios, cesantías e intereses, vacaciones, dotación, auxilio de transporte, subsidio familiar, y pago de horas extra cuando aplique.',
                    orden: 7
                },
                {
                    titulo: 'OCTAVA. SUBORDINACIÓN JURÍDICA',
                    contenido: 'La subordinación estará referida exclusivamente a las actividades propias del aprendizaje, conforme al reglamento interno de trabajo de LA EMPRESA y al reglamento formativo del estudiante, por lo cual, se excluye de este contrato toda forma de subordinación laboral. Si las actividades que se desarrollan no están directamente relacionadas con el área de estudio, la práctica laboral mutará a relación laboral con sus implicaciones legales.',
                    orden: 8
                }
            ];
        }

        // Combinar todas las cláusulas y ordenar
        const todasLasClausulas = [...clausulasEspecificas, ...clausulasComunes];
        return todasLasClausulas.sort((a, b) => a.orden - b.orden);
    },

    // =============================================
    // READ
    // =============================================
    getById: async (id) => {
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                f.nombres,
                f.apellidos,
                f.numero_documento,
                f.tipo_documento,
                f.direccion,
                f.telefono,
                f.sexo,
                f.fecha_nacimiento,
                f.lugar_nacimiento,
                f.numero_cuenta_bancaria,
                f.tipo_cuenta,
                b.id_banco,
                b.nombre_banco,
                e.id_eps,
                e.nombre_eps,
                e.codigo_eps,
                ce.id_cesantias,
                ce.nombre_cesantia,
                ce.codigo_cesantia,
                p.id_pension,
                p.nombre_pension,
                p.codigo_pension,
                cc.id_caja,
                cc.nombre_caja,
                cc.codigo_caja,
                a.id_arl,
                a.nombre_arl,
                nr.id_nivel_riesgo,
                nr.nivel,
                nr.porcentaje,
                pc.codigo_posicion,
                cb.nombre_cargo as cargo_base_nombre
            FROM contratos c
            INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
            LEFT JOIN bancos b ON f.id_banco = b.id_banco
            LEFT JOIN eps e ON f.id_eps = e.id_eps
            LEFT JOIN cesantias ce ON f.id_cesantias = ce.id_cesantias
            LEFT JOIN pensiones p ON f.id_pension = p.id_pension
            LEFT JOIN caja_compensacion cc ON f.id_caja_compensacion = cc.id_caja
            LEFT JOIN arl a ON c.id_arl = a.id_arl
            LEFT JOIN niveles_riesgo nr ON c.id_nivel_riesgo = nr.id_nivel_riesgo
            LEFT JOIN posiciones_cargo pc ON c.id_posicion = pc.id_posicion
            LEFT JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            WHERE c.id_contrato = ?
        `, [id]);

        if (rows.length === 0) return null;

        const contrato = rows[0];

        // Obtener cláusulas
        const [clausulas] = await pool.query(`
            SELECT * FROM clausulas_contrato
            WHERE id_contrato = ?
            ORDER BY orden
        `, [id]);

        contrato.clausulas = clausulas;
        return contrato;
    },

    // Actualizar cláusula específica
    updateClausula: async (idClausula, contenido) => {
        const [result] = await pool.query(`
            UPDATE clausulas_contrato
            SET contenido = ?
            WHERE id_clausula = ?
        `, [contenido, idClausula]);
        return result;
    }
};

module.exports = ContratoModel;