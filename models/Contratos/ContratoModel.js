const pool = require('../../config/ConectDb');
const PosicionCargoModel = require('../plantaCargos/PosicionCargoModel');


function obtenerClausulasPorTipo(tipoContrato, fechaInicio, fechaFin, terminoInicial, cargo, datosAprendiz = {}) {

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
            contenido: tipoContrato === 'MEDIO_TIEMPO'
                ? `EL TRABAJADOR se obliga a laborar media jornada máxima legal, salvo acuerdo especial, cumpliendo con los turnos y horarios que señale el EMPLEADOR, El TRABAJADOR se obliga a laborar una jornada de medio tiempo, distribuidas de la siguiente manera: de lunes a viernes, el TRABAJADOR prestará sus servicios durante 4 horas en la mañana, desde las 8:00 a.m. hasta las 12:00 p.m. Asimismo, los sábados se desempeñará durante 2 horas en la jornada de 8:00 a.m. a 10:00 a.m. lo cual no implica que el empleador pueda hacer ajustes o cambios de horario respetando la media jornada laboral es decir las 21 horas semanales en la jornada ordinaria diaria de 6:00 a.m. a 10:00 p.m. cuando lo estime conveniente, sin que ello se considere como una desmejora en las condiciones laborales del TRABAJADOR, podrán repartirse las horas de la media jornada ordinaria con base en lo dispuesto por el Artículo 164 del código Sustantivo de Trabajo modificado por el artículo 23 de la Ley 50 de 1990, teniendo en cuenta que los tiempos de descanso entre las secciones de la jornada no se computan dentro de la misma, según el artículo 167 ibidem`
                : `EL TRABAJADOR se obliga a laborar la jornada máxima legal, salvo acuerdo especial, cumpliendo con los turnos y horarios que señale EL EMPLEADOR, pudiendo hacer éste ajustes o cambios de horario cuando lo estime conveniente, sin que ello se considere como una desmejora en las condiciones laborales del TRABAJADOR. Por el acuerdo expreso o tácito de las partes, podrán repartirse las horas de la jornada ordinaria con base en lo dispuesto por el Artículo 164 del Código Sustantivo de Trabajo modificado por el artículo 23 de la Ley 50 de 1990, teniendo en cuenta que los tiempos de descanso entre las secciones de la jornada no se computan dentro de la misma, según el artículo 167 ibidem.`,
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

    if (tipoContrato === 'APRENDIZ') {
        // Formatear fechas
        const fechaInicioObj = new Date(fechaInicio);
        const fechaFinObj = new Date(fechaFin);

        const diaInicio = fechaInicioObj.getDate();
        const mesInicio = fechaInicioObj.toLocaleString('es', { month: 'short' }).toUpperCase();
        const añoInicio = fechaInicioObj.getFullYear();

        const diaFin = fechaFinObj.getDate();
        const mesFin = fechaFinObj.toLocaleString('es', { month: 'short' }).toUpperCase();
        const añoFin = fechaFinObj.getFullYear();

        // Calcular meses de duración
        const diffTime = Math.abs(fechaFinObj - fechaInicioObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const meses = Math.round(diffDays / 30);

        // Obtener datos del aprendiz
        const especialidad = datosAprendiz.especialidad || cargo || 'la formación establecida';
        const grupo = datosAprendiz.numero_grupo || '';
        const centroFormacion = datosAprendiz.centro_formacion || 'CENTRO DE FORMACIÓN PROFESIONAL';
        const institutoFormacion = datosAprendiz.instituto_formacion === 'OTRO'
            ? datosAprendiz.otro_instituto
            : datosAprendiz.instituto_formacion || 'SENA';
        const arl = datosAprendiz.arl || 'ARL CONTRATADA POR LA EMPRESA';

        // Determinar porcentaje de salario según etapa
        const salarioNumerico = datosAprendiz.salario || 0;
        const smlv = datosAprendiz.salarioMinimoAnual || 0;
        const porcentaje = smlv > 0 ? (salarioNumerico / smlv) * 100 : 75;
        const porcentajeTexto = porcentaje === 75 ? '75%' : porcentaje === 100 ? '100%' : `${porcentaje.toFixed(0)}%`;

        // Determinar si es universitario
        const esUniversitario = datosAprendiz.esUniversitario || false;

        // Fechas de etapas (si no se envían, usar las del contrato)
        const fechaInicioelectiva = datosAprendiz.electiva_inicio || fechaInicio;
        const fechaFinelectiva = datosAprendiz.electiva_fin || fechaInicio;
        const fechaInicioPractica = datosAprendiz.practica_inicio || fechaInicio;
        const fechaFinPractica = datosAprendiz.practica_fin || fechaFin;



        const formatearFechaClausula = (fechaStr) => {
            if (!fechaStr) return '';

            const [year, month, day] = fechaStr.split('-').map(Number);
            const fecha = new Date(year, month - 1, day); // month - 1 porque los meses son 0-indexados

            const dia = fecha.getDate();
            const mes = fecha.toLocaleString('es', { month: 'short' }).toUpperCase();
            const anio = fecha.getFullYear();

            return `${dia} de ${mes} de ${anio}`;
        };


        return [
            {
                titulo: 'PRIMERA.- OBJETO',
                contenido: `El presente contrato tiene como objeto garantizar al APRENDIZ la formación profesional metódica y completa en la especialidad de ${especialidad} Grupo ${grupo}, la cual se impartirá en su etapa lectiva en los ambientes de formación del ${centroFormacion} (Centro de Formación Profesional del ${institutoFormacion}), y en su etapa práctica se desarrollará en los ambientes reales de trabajo de la EMPRESA PATROCINADORA.`,
                orden: 1
            },
            {
                titulo: 'SEGUNDA – DURACIÓN',
                contenido: `El presente contrato tiene un término de duración de ${meses} meses, comprendidos entre el Día ${diaInicio} Mes ${mesInicio} Año ${añoInicio} fecha de iniciación del Contrato; y el Día ${diaFin} Mes ${mesFin} Año ${añoFin} fecha de terminación de este. Esta duración deberá ajustarse al diseño curricular del programa de formación y no podrá exceder de TRES (3) años, de conformidad con lo dispuesto por el artículo 81 del Código Sustantivo del Trabajo y previa revisión de la normatividad formativa aplicable a cada una de las modalidades de formación.`,
                orden: 2
            },
            {
                titulo: 'TERCERA – MODALIDAD DE FORMACIÓN',
                contenido: `La formación será de tipo ${datosAprendiz.modalidad_formacion || 'tradicional'}, compuesta por las siguientes fases:

Fase Electiva: del ${formatearFechaClausula(fechaInicioelectiva)} al ${formatearFechaClausula(fechaFinelectiva)}.
Fase Práctica: del ${formatearFechaClausula(fechaInicioPractica)} al ${formatearFechaClausula(fechaFinPractica)}.`,
                orden: 3
            },
            {
                titulo: 'CUARTA. NATURALEZA JURÍDICA',
                contenido: `El presente contrato de aprendizaje tiene el carácter de laboral especial y a término fijo, conforme al artículo 81 del Código Sustantivo del Trabajo, modificado por el artículo 21 de la Ley 2466 de 2025. Su finalidad es facilitar la formación teórico-práctica del aprendiz en la ocupación, oficio o profesión de ${especialidad}, en concordancia con el programa de formación de la institución educativa ${institutoFormacion}.`,
                orden: 4
            },
            {
                titulo: 'QUINTA – APOYO DE SOSTENIMIENTO MENSUAL',
                contenido: `Durante la vigencia del contrato, la EMPRESA PATROCINADORA se compromete a pagar al APRENDIZ un apoyo de sostenimiento mensual durante toda la formación y siendo equivalente a:

${porcentajeTexto} del salario mínimo legal mensual vigente, según la etapa y modalidad de formación.

${esUniversitario ? 'En caso de ser estudiante universitario, el apoyo será de 100% del salario mínimo legal mensual vigente, sin importar la modalidad.' : ''}

En caso de ser formación dual, el APRENDIZ recibirá como mínimo durante el primer año el equivalente al setenta y cinco por ciento (75%) de un (1) salario mínimo legal mensual vigente y durante el segundo año el equivalente al cien por ciento (100%) de un (1) salario mínimo legal mensual vigente o proporcional de acuerdo con el diseño curricular. La duración de la alternancia podrá ser menor o mayor, sin superar de tres (3) años, caso en el cual la distribución teórica/práctica deberá ser, como mínimo, de 50% [teoría] y 50% [práctica], en relación con el tiempo total de la duración del programa dispuesto en sus diseños curriculares y los pagos corresponderán a cada etapa según la alternancia.

PARAGRAFO. Atendiendo lo dispuesto en el artículo 81 del Código Sustantivo del Trabajo, modificado por la Ley 2466 de 2025, en ningún caso el apoyo de sostenimiento mensual podrá ser regulado a través de convenios o contratos colectivos o fallos arbitrales recaídos en una negociación colectiva.`,
                orden: 5
            },
            {
                titulo: 'SEXTA – SEGURIDAD SOCIAL',
                contenido: `LA EMPRESA garantizará la afiliación y pago mensual de la cotización del APRENDIZ al Sistema de Seguridad Social, conforme a la etapa del contrato:

Formación tradicional 
•	Fase lectiva: salud y riesgos laborales, pagados en su totalidad por la empresa.
•	Fase práctica: salud, pensión y riesgos laborales, pagado conforme al régimen de trabajadores dependientes.

Formación dual
•	Afiliación y cotización al sistema general de seguridad social en salud, pensión y riesgos laborales, así como el derecho a prestaciones, auxilios, y demás derechos propios de un contrato de trabajo.

Estudiante universitario
•	La afiliación al sistema de seguridad social depende la etapa: fase lectiva se surte la afiliación a salud y riesgos laborales; para fase práctica, salud, pensiones y riesgos laborales, así como el, así como el derecho a prestaciones, auxilios, y demás derechos propios de un contrato de trabajo.`,
                orden: 6
            },
            {
                titulo: 'SÉPTIMA – DERECHOS LABORALES EN LA ETAPA PRÁCTICA',
                contenido: `Durante la etapa práctica o durante toda la formación dual, EL APRENDIZ tendrá derecho al reconocimiento y pago a cargo de la EMPRESA PATROCINADORA de todas las prestaciones, auxilios y demás derechos propios del contrato laboral, incluyendo:

•	Prima de servicios
•	Cesantías e intereses
•	Vacaciones
•	Dotación
•	Auxilio de transporte
•	Subsidio familiar
•	Pago de horas extra, nocturnas y en días festivos (cuando aplique)`,
                orden: 7
            },
            {
                titulo: 'OCTAVA–SUBORDINACIÓN JURÍDICA',
                contenido: `La subordinación estará referida exclusivamente a las actividades propias del aprendizaje, conforme al reglamento interno de trabajo de LA EMPRESA y al reglamento formativo del estudiante, por lo cual, se excluye de este contrato toda forma de subordinación laboral.

Parágrafo. De conformidad con lo dispuesto por el parágrafo 4° del artículo 15 de la Ley 1780 de 2016, si las actividades que se desarrollan no están directamente relacionadas con el área de estudio la práctica laboral mutará a relación laboral con sus implicaciones legales.`,
                orden: 8
            },
            {
                titulo: 'NOVENA – OBLIGACIONES',
                contenido: `1. POR PARTE DE LA EMPRESA. - En virtud del presente contrato la EMPRESA PATROCINADORA deberá:

1.1. Reconocer y pagar al APRENDIZ el apoyo de sostenimiento mensual correspondiente a la fase de formación en la que se encuentre.

a. Facilitar al APRENDIZ los medios para que tanto en las fases lectiva y productiva, reciba formación profesional metódica y completa requerida en el oficio, actividad, ocupación o profesión y esto le implique desempeñarse dentro del manejo administrativo, operativo, comercial o financiero propios del giro ordinario de las actividades de la empresa.

b. Diligenciar y reportar al respectivo Centro de Formación Profesional Integral del ${institutoFormacion} las evaluaciones y certificaciones del APRENDIZ en su fase productiva del aprendizaje.

c. Afiliar al APRENDIZ, durante las fases lectiva y productiva de la formación, a la Aseguradora de Riesgos Laborales ${arl}, de conformidad con lo dispuesto por el artículo 81 del Código Sustantivo del Trabajo, modificado por la Ley 2466 de 2025. El aporte al riesgo laboral corresponderá al del nivel de riesgo de la empresa y de sus funciones.

d. Afiliar al APRENDIZ y efectuar, durante las fases lectiva y productiva de la formación, el pago mensual del aporte al régimen de Seguridad Social Integral, de conformidad con lo indicado en la cláusula sexta del presente contrato.

e. Otorgar y reconocer al APRENDIZ todas las prestaciones, auxilios y demás derechos propios del contrato laboral, conforme se dispone en el presente contrato y en el artículo 81 del Código Sustantivo del Trabajo.

2. POR PARTE DEL APRENDIZ

Por su parte, el aprendiz se compromete en virtud del presente contrato a:

a. Concurrir puntualmente a las clases durante los periodos de enseñanza para así recibir la formación profesional metódica y completa a que se refiere el presente Contrato, someterse a los reglamentos y normas establecidas por el respectivo Centro de Formación del ${institutoFormacion}, y poner toda diligencia y aplicación para lograr el mayor rendimiento en su formación.

b. Acatar, durante la fase lectiva, el reglamento del estudiante correspondiente a su respectivo oferente de formación.

c. Acatar durante la fase práctica el reglamento interno de trabajo y el reglamento del estudiante correspondiente a su respectivo oferente de formación.

d. Concurrir puntualmente al lugar asignado por la Empresa para desarrollar su práctica en los ambientes laborales determinados para tal fin y durante el periodo establecido por el diseño curricular para el mismo, siempre relacionados con las actividades que se le encomiende y que guarde relación con la Formación, cumpliendo con las indicaciones que le señale la EMPRESA. En todo caso la intensidad horaria que debe cumplir el APRENDIZ durante la etapa práctica en la EMPRESA no podrá exceder de lo dispuesto por el artículo 3° de la Ley 2101 de 2021 sobre la aplicación gradual, y una jornada máxima de cuarenta y dos (42) horas a la semana.

e. Proporcionar la información necesaria para que la EMPRESA lo afilie como APRENDIZ al sistema de seguridad social en las condiciones enunciadas en la cláusula SEXTA del presente contrato.`,
                orden: 9
            },
            {
                titulo: 'DÉCIMA. SUPERVISIÓN',
                contenido: `La EMPRESA podrá supervisar al APRENDIZ en el respectivo Centro de Formación del ${institutoFormacion} (o en el Centro Educativo donde estuviere adelantando los estudios el aprendiz), la asistencia, como el rendimiento académico, a efectos de verificar y asegurar la real y efectiva utilización del tiempo en la etapa lectiva por parte de este. El ${institutoFormacion} supervisará al APRENDIZ en la EMPRESA para que sus actividades en cada periodo práctico correspondan al programa de la especialidad para la cual se está formando.`,
                orden: 10
            },
            {
                titulo: 'DÉCIMA PRIMERA - SUSPENSIÓN',
                contenido: 'Para efectos de cualquier suspensión presentada en el desarrollo del contrato laboral especial de aprendizaje a término fijo aquí suscrito, se interpretará a la luz de los criterios taxativos estipulados en el artículo 51 del Código Sustantivo del Trabajo, para la etapa práctica.',
                orden: 11
            },
            {
                titulo: 'DÉCIMA SEGUNDA. - TERMINACIÓN',
                contenido: `El presente contrato podrá darse por terminado por:
 
a. En etapa lectiva por las causales estipuladas en el Acuerdo SENA 009 de 2024 (Reglamento del aprendiz). 
b. En etapa productiva las causales estipuladas en los artículos 61 y 62 del Código Sustantivo del Trabajo.
c. Por el vencimiento del plazo fijo pactado de duración del presente Contrato.  
d. Las demás que consideren y pacten las partes por voluntad expresa en virtud del contrato, siempre y cuando no generen contradicción con su finalidad formativa ni con el Código Sustantivo del Trabajo.`,
                orden: 12
            },
            {
                titulo: 'DÉCIMA TERCERA. - DECLARACIÓN JURAMENTADA',
                contenido: 'El APRENDIZ declara bajo la gravedad de juramento que no se encuentra ni ha estado vinculado con la EMPRESA o con otras EMPRESAS en una relación de aprendizaje. Así mismo, las partes declaran, que el aprendiz no se encuentra ni ha estado vinculado mediante una relación laboral con la EMPRESA.',
                orden: 13
            },
            {
                titulo: 'DÉCIMA CUARTA. - VIGENCIA',
                contenido: `El presente contrato de aprendizaje rige a partir del día ${diaInicio} del Mes ${mesInicio} de ${añoInicio} y termina el del día ${diaFin} del Mes ${mesFin} de ${añoFin}, fecha prevista como terminación de la etapa productiva que se describe en la cláusula segunda de este contrato.`,
                orden: 14
            },
            {
                titulo: 'FIRMA',
                contenido: `El presente contrato es firmado el día ${new Date().getDate()} del Mes ${new Date().toLocaleString('es', { month: 'long' }).toUpperCase()} del año ${new Date().getFullYear()} en la ciudad de CALI, ratificando que ha sido leído, pactado y consensuado, constituyéndose en manifestación de voluntad de las partes firmantes:`,
                orden: 15
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

    if (datosAprendiz?.esMedioTiempo === true) {
        // Encontrar el índice de la cláusula QUINTA
        const quintaIndex = clausulasComunes.findIndex(c => c.titulo === 'QUINTA. JORNADA DE TRABAJO');

        if (quintaIndex !== -1) {
            // Reemplazar con la cláusula de medio tiempo
            clausulasComunes[quintaIndex] = {
                titulo: 'QUINTA. JORNADA DE TRABAJO',
                contenido: `EL TRABAJADOR se obliga a laborar media jornada máxima legal, salvo acuerdo especial, cumpliendo con los turnos y horarios que señale el EMPLEADOR. El TRABAJADOR se obliga a laborar una jornada de medio tiempo, distribuidas de la siguiente manera: de lunes a viernes, el TRABAJADOR prestará sus servicios durante 4 horas en la mañana, desde las 8:00 a.m. hasta las 12:00 p.m. Asimismo, los sábados se desempeñará durante 2 horas en la jornada de 8:00 a.m. a 10:00 a.m. lo cual no implica que el empleador pueda hacer ajustes o cambios de horario respetando la media jornada laboral es decir las 21 horas semanales en la jornada ordinaria diaria de 6:00 a.m. a 10:00 p.m. cuando lo estime conveniente, sin que ello se considere como una desmejora en las condiciones laborales del TRABAJADOR, podrán repartirse las horas de la media jornada ordinaria con base en lo dispuesto por el Artículo 164 del código Sustantivo de Trabajo modificado por el artículo 23 de la Ley 50 de 1990, teniendo en cuenta que los tiempos de descanso entre las secciones de la jornada no se computan dentro de la misma, según el artículo 167 ibidem.`,
                orden: 5
            };
        }
    }


    // Combinar todas las cláusulas y ordenar
    const todasLasClausulas = [...clausulasEspecificas, ...clausulasComunes];
    return todasLasClausulas.sort((a, b) => a.orden - b.orden);
}


const ContratoModel = {

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
                    numero_contrato_ant,
                    fecha_inicio_contrato_ant,
                    fecha_inicio,
                    fecha_fin,
                    termino_inicial,
                    cargo,
                    salario,
                    periodo_pago,
                    horas_laborales,
                    lugar_labores,
                    ciudad_contratacion,
                    arl,
                    id_riesgo,
                    estado,
                    numero_grupo,
                    centro_formacion,
                    especialidad,
                    instituto_formacion,
                    otro_instituto,
                    usuario_creacion,
                    electiva_inicio,
                    electiva_fin,
                    practica_inicio,
                    practica_fin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                data.id_funcionario,
                data.id_posicion,
                data.id_anio_legal,
                data.tipo_contrato,
                data.numero_contrato || null,
                data.numero_contrato_ant || null,
                data.fecha_inicio_contrato_ant || null,
                data.fecha_inicio,
                data.fecha_fin || null,
                data.termino_inicial || null,
                data.cargo,
                data.salario,
                data.periodo_pago || 'MENSUAL',
                data.horas_laborales || 220,
                data.lugar_labores,
                data.ciudad_contratacion || 'CALI',
                data.arl || null,
                data.id_riesgo || null,
                'ACTIVO',
                data.numero_grupo || null,
                data.centro_formacion || null,
                data.especialidad || null,
                data.instituto_formacion || null,
                data.otro_instituto || null,
                data.usuario_creacion || 'SISTEMA',
                data.electiva_inicio || null,
                data.electiva_fin || null,
                data.practica_inicio || null,
                data.practica_fin || null
            ]);

            const idContrato = result.insertId;

            const datosAprendiz = {
                especialidad: data.especialidad,
                numero_grupo: data.numero_grupo,
                centro_formacion: data.centro_formacion,
                instituto_formacion: data.instituto_formacion,
                otro_instituto: data.otro_instituto,
                arl: data.arl,
                salario: data.salario,
                salarioMinimoAnual: data.salario_minimo_anual || 0,
                electiva_inicio: data.electiva_inicio || data.fecha_inicio,
                electiva_fin: data.electiva_fin || data.fecha_inicio,
                practica_inicio: data.practica_inicio || data.fecha_inicio,
                practica_fin: data.practica_fin || data.fecha_fin
            };

            // 2. Insertar cláusulas según tipo de contrato
            const clausulas = obtenerClausulasPorTipo(
                data.tipo_contrato,
                data.fecha_inicio,
                data.fecha_fin,
                data.termino_inicial,
                data.cargo,
                datosAprendiz
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

    getAll: async (filtros = {}) => {
        let query = `
        SELECT 
            c.id_contrato,
            c.tipo_contrato,
            c.numero_contrato,
            c.numero_contrato_ant,
            c.fecha_inicio_contrato_ant,
            c.fecha_inicio,
            c.fecha_fin,
            c.termino_inicial,
            c.cargo,
            c.salario,
            c.periodo_pago,
            c.horas_laborales,
            c.lugar_labores,
            c.ciudad_contratacion,
            c.arl,
            c.estado,
            c.fecha_creacion,
            c.electiva_inicio,
            c.electiva_fin,
            c.practica_inicio,
            c.practica_fin,
            
            -- Datos del funcionario
            f.id_funcionario,
            f.nombres,
            f.apellidos,
            f.numero_documento,
            f.tipo_documento,
            
            -- Datos de la posición
            pc.id_posicion,
            pc.codigo_posicion,
            d.nombre_departamento,
            
            -- Datos del año legal
            al.anio,
            
            -- Conteo de cláusulas
            (SELECT COUNT(*) FROM clausulas_contrato WHERE id_contrato = c.id_contrato) as total_clausulas
            
        FROM contratos c
        INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
        LEFT JOIN posiciones_cargo pc ON c.id_posicion = pc.id_posicion
        LEFT JOIN departamentos d ON pc.id_departamento = d.id_departamento
        INNER JOIN anios_legales al ON c.id_anio_legal = al.id_anio_legal
        WHERE 1=1
    `;

        let params = [];
        let condiciones = [];

        // Filtros
        if (filtros.estado) {
            condiciones.push('c.estado = ?');
            params.push(filtros.estado);
        }

        if (filtros.tipo_contrato) {
            condiciones.push('c.tipo_contrato = ?');
            params.push(filtros.tipo_contrato);
        }

        if (filtros.id_funcionario) {
            condiciones.push('c.id_funcionario = ?');
            params.push(filtros.id_funcionario);
        }

        if (filtros.id_anio_legal) {
            condiciones.push('c.id_anio_legal = ?');
            params.push(filtros.id_anio_legal);
        }

        if (filtros.fecha_desde) {
            condiciones.push('c.fecha_inicio >= ?');
            params.push(filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
            condiciones.push('c.fecha_inicio <= ?');
            params.push(filtros.fecha_hasta);
        }

        if (filtros.busqueda) {
            const busqueda = `%${filtros.busqueda}%`;
            condiciones.push(`(
            f.nombres LIKE ? OR 
            f.apellidos LIKE ? OR 
            f.numero_documento LIKE ? OR 
            c.numero_contrato LIKE ? OR 
            c.cargo LIKE ?
        )`);
            params.push(busqueda, busqueda, busqueda, busqueda, busqueda);
        }

        if (condiciones.length > 0) {
            query += ' AND ' + condiciones.join(' AND ');
        }

        // Ordenamiento
        const orden = filtros.orden || 'DESC';
        const ordenarPor = filtros.ordenar_por || 'c.fecha_creacion';
        query += ` ORDER BY ${ordenarPor} ${orden}`;


        const [rows] = await pool.query(query, params);
        return rows;
    },

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

    update: async (id, data) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Construir dinámicamente la consulta de actualización
            const campos = [];
            const valores = [];

            if (data.estado !== undefined) {
                campos.push('estado = ?');
                valores.push(data.estado);
            }

            if (data.fecha_fin !== undefined) {
                campos.push('fecha_fin = ?');
                valores.push(data.fecha_fin);
            }

            if (data.fecha_modificacion !== undefined) {
                campos.push('fecha_modificacion = ?');
                valores.push(data.fecha_modificacion);
            }

            if (data.fecha_inicio !== undefined) {
                campos.push('fecha_inicio = ?');
                valores.push(data.fecha_inicio);
            }

            if (data.cargo !== undefined) {
                campos.push('cargo = ?');
                valores.push(data.cargo);
            }

            if (data.salario !== undefined) {
                campos.push('salario = ?');
                valores.push(data.salario);
            }

            if (data.lugar_labores !== undefined) {
                campos.push('lugar_labores = ?');
                valores.push(data.lugar_labores);
            }

            if (data.estado !== undefined) {
                campos.push('estado = ?');
                valores.push(data.estado);
            }

            if (data.id_posicion !== undefined) {
                campos.push('id_posicion = ?');
                valores.push(data.id_posicion);
            }

            if (campos.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            valores.push(id);

            const query = `UPDATE contratos SET ${campos.join(', ')} WHERE id_contrato = ?`;
            const [result] = await connection.query(query, valores);

            await connection.commit();
            return result;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    updateClausula: async (idClausula, contenido) => {
        const [result] = await pool.query(`
            UPDATE clausulas_contrato
            SET contenido = ?
            WHERE id_clausula = ?
        `, [contenido, idClausula]);
        return result;
    },

    getContratoActivoPorFuncionario: async (idFuncionario) => {
        const [rows] = await pool.query(`
        SELECT c.*, al.anio
        FROM contratos c
        INNER JOIN anios_legales al ON c.id_anio_legal = al.id_anio_legal
        WHERE c.id_funcionario = ? 
          AND c.estado IN ('ACTIVO', 'PRORROGADO')
        ORDER BY c.fecha_creacion DESC
        LIMIT 1
    `, [idFuncionario]);

        return rows[0];
    },

    cambiarModalidadAIndefinido: async (idContrato, idPosicion, usuarioCreacion, nuevoNumeroContrato) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Obtener el contrato actual con todos sus datos
            const [contratoActual] = await connection.query(`
            SELECT 
                c.*,
                f.nombres,
                f.apellidos,
                f.tipo_documento,
                f.numero_documento,
                f.direccion,
                f.telefono,
                f.sexo,
                f.fecha_nacimiento,
                f.lugar_nacimiento,
                f.numero_cuenta_bancaria,
                f.tipo_cuenta,
                f.correo_electronico,
                f.fecha_ingreso,
                b.nombre_banco,
                e.nombre_eps,
                e.codigo_eps,
                ce.codigo_cesantia,
                ce.nombre_cesantia,
                p.codigo_pension,
                p.nombre_pension,
                cc.codigo_caja,
                cc.nombre_caja
            FROM contratos c
            INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
            LEFT JOIN bancos b ON f.id_banco = b.id_banco
            LEFT JOIN eps e ON f.id_eps = e.id_eps
            LEFT JOIN cesantias ce ON f.id_cesantia = ce.id_cesantia
            LEFT JOIN pensiones p ON f.id_pension = p.id_pension
            LEFT JOIN caja_compensacion cc ON f.id_caja_compensacion = cc.id_caja
            WHERE c.id_contrato = ?
        `, [idContrato]);

            if (contratoActual.length === 0) {
                throw new Error('Contrato no encontrado');
            }

            // 2. Obtener la posición seleccionada con su información
            const [posicion] = await connection.query(`
            SELECT 
                pc.*,
                cb.nombre_cargo,
                cb.codigo_cargo,
                cb.es_director_agencia,
                d.nombre_departamento,
                d.codigo_ext,
                hsc.salario_base,
                hsc.bonificacion,
                hsc.aplica_auxilio_transporte
            FROM posiciones_cargo pc
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            INNER JOIN departamentos d ON pc.id_departamento = d.id_departamento
            INNER JOIN historico_salarios_cargo hsc 
                ON cb.id_cargo_base = hsc.id_cargo_base 
                AND pc.id_anio_legal = hsc.id_anio_legal
                AND hsc.activo = true
            WHERE pc.id_posicion = ? AND pc.activo = true
        `, [idPosicion]);

            if (posicion.length === 0) {
                throw new Error('Posición no encontrada o inactiva');
            }

            // 🔥 VERIFICAR QUE LA POSICIÓN ESTÉ DISPONIBLE (sin funcionario asignado)
            if (posicion[0].id_funcionario) {
                throw new Error('La posición seleccionada ya tiene un funcionario asignado. No puede ser ocupada.');
            }

            // 🔥 NUEVA VALIDACIÓN: Verificar que el funcionario NO tenga ya una posición en el mismo año legal
            const idFuncionario = contratoActual[0].id_funcionario;
            const idAnioLegal = posicion[0].id_anio_legal;

            const [posicionExistente] = await connection.query(`
            SELECT pc.*, cb.nombre_cargo
            FROM posiciones_cargo pc
            INNER JOIN cargos_base cb ON pc.id_cargo_base = cb.id_cargo_base
            WHERE pc.id_funcionario = ? 
              AND pc.id_anio_legal = ? 
              AND pc.activo = true
        `, [idFuncionario, idAnioLegal]);

            if (posicionExistente.length > 0) {
                throw new Error(
                    `El funcionario ya tiene una posición asignada en el año: ` +
                    `${posicionExistente[0].nombre_cargo} (Posición Planta: ${posicionExistente[0].numero_posicion}). ` +
                    `No puede tener múltiples posiciones en el mismo año a excepción de que sea ENCARGADO.`
                );
            }

            // 3. Verificar que el id_anio_legal de la posición existe
            const [anioLegalExiste] = await connection.query(`
            SELECT id_anio_legal FROM anios_legales WHERE id_anio_legal = ?
        `, [idAnioLegal]);

            if (anioLegalExiste.length === 0) {
                throw new Error(`El año legal ${idAnioLegal} no existe en el sistema`);
            }

            // 4. Calcular valores
            const salarioBase = parseFloat(posicion[0].salario_base);
            const bonificacion = parseFloat(posicion[0].bonificacion) || 0;
            const aplicaAuxilio = posicion[0].aplica_auxilio_transporte === 1;

            // Calcular total mensual
            let totalMensual = salarioBase + bonificacion;
            if (aplicaAuxilio) {
                totalMensual += parseFloat(contratoActual[0].auxilio_transporte) || 0;
            }

            // 5. Crear nuevo contrato indefinido
            const queryNuevoContrato = `
            INSERT INTO contratos (
                numero_contrato,
                tipo_contrato,
                fecha_inicio,
                fecha_creacion,
                cargo,
                salario,
                lugar_labores,
                ciudad_contratacion,
                arl,
                id_riesgo,
                horas_laborales,
                periodo_pago,
                estado,
                id_funcionario,
                id_posicion,
                id_anio_legal,
                usuario_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

            const fechaActual = new Date();
            const fechaInicio = contratoActual[0].fecha_inicio || fechaActual;

            const valoresNuevoContrato = [
                nuevoNumeroContrato,
                'INDEFINIDO',
                fechaInicio,
                fechaActual,
                posicion[0].nombre_cargo,
                totalMensual,
                posicion[0].sede_ubicacion || contratoActual[0].lugar_labores || 'Cali',
                contratoActual[0].ciudad_contratacion || 'CALI',
                contratoActual[0].arl || 'SURA',
                contratoActual[0].id_riesgo || null,
                contratoActual[0].horas_laborales || 220,
                contratoActual[0].periodo_pago || 'MENSUAL',
                'ACTIVO',
                idFuncionario,
                idPosicion,
                idAnioLegal,
                usuarioCreacion
            ];

            const [resultadoInsert] = await connection.query(queryNuevoContrato, valoresNuevoContrato);
            const nuevoContratoId = resultadoInsert.insertId;

            // 6. INSERTAR CLÁUSULAS DEL CONTRATO INDEFINIDO
            const datosAprendiz = {};

            const clausulas = obtenerClausulasPorTipo(
                'INDEFINIDO',
                fechaInicio,
                null,
                null,
                posicion[0].nombre_cargo,
                datosAprendiz
            );

            for (const clausula of clausulas) {
                await connection.query(`
                INSERT INTO clausulas_contrato (
                    id_contrato,
                    titulo,
                    contenido,
                    orden
                ) VALUES (?, ?, ?, ?)
            `, [nuevoContratoId, clausula.titulo, clausula.contenido, clausula.orden]);
            }

            // 7. ASIGNAR EL FUNCIONARIO A LA POSICIÓN (sin lógica de encargado, siempre es 0)
            await connection.query(`
            UPDATE posiciones_cargo 
            SET id_funcionario = ?, encargado = 0 
            WHERE id_posicion = ?
        `, [idFuncionario, idPosicion]);

            // 8. Finalizar el contrato anterior
            await connection.query(`
            UPDATE contratos 
            SET estado = 'TERMINADO',
                fecha_fin = ?
            WHERE id_contrato = ?
        `, [fechaActual, idContrato]);

            await connection.commit();

            // 9. Obtener el nuevo contrato con todos los datos
            const [nuevoContratoCompleto] = await connection.query(`
            SELECT 
                c.*,
                f.nombres,
                f.apellidos,
                f.tipo_documento,
                f.numero_documento,
                f.direccion,
                f.telefono,
                f.sexo,
                f.fecha_nacimiento,
                f.lugar_nacimiento,
                f.numero_cuenta_bancaria,
                f.tipo_cuenta,
                f.correo_electronico,
                b.nombre_banco,
                e.nombre_eps,
                e.codigo_eps,
                ce.codigo_cesantia,
                ce.nombre_cesantia,
                p.codigo_pension,
                p.nombre_pension,
                cc.codigo_caja,
                cc.nombre_caja
            FROM contratos c
            INNER JOIN funcionarios f ON c.id_funcionario = f.id_funcionario
            LEFT JOIN bancos b ON f.id_banco = b.id_banco
            LEFT JOIN eps e ON f.id_eps = e.id_eps
            LEFT JOIN cesantias ce ON f.id_cesantia = ce.id_cesantia
            LEFT JOIN pensiones p ON f.id_pension = p.id_pension
            LEFT JOIN caja_compensacion cc ON f.id_caja_compensacion = cc.id_caja
            WHERE c.id_contrato = ?
        `, [nuevoContratoId]);

            // 🔥 OBTENER LAS CLÁUSULAS DEL CONTRATO
            const [clausulasContrato] = await connection.query(`
                    SELECT * FROM clausulas_contrato
                    WHERE id_contrato = ?
                    ORDER BY orden
                `, [nuevoContratoId]);

            await connection.commit();

            return {
                contrato_anterior_id: idContrato,
                nuevo_contrato: {
                    ...nuevoContratoCompleto[0],
                    clausulas: clausulasContrato
                },
                posicion_asignada: idPosicion,
                es_ascenso: salarioBase > parseFloat(contratoActual[0].salario),
                salario_anterior: parseFloat(contratoActual[0].salario),
                salario_nuevo: totalMensual
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    obtenerClausulasPorTipo: obtenerClausulasPorTipo
};



module.exports = ContratoModel;