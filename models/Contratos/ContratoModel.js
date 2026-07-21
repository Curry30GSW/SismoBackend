const pool = require('../../config/ConectDb');
const PosicionCargoModel = require('../plantaCargos/PosicionCargoModel');


const formatearFechaLarga = (fechaStr) => {
    if (!fechaStr) return 'XXXXXXXX';

    try {
        // Extraer año, mes, día manualmente para evitar problemas de timezone
        const [year, month, day] = fechaStr.split('-').map(Number);

        const meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];

        const mesNombre = meses[month - 1];
        const diaConCero = String(day).padStart(2, '0');

        return `${diaConCero} de ${mesNombre} de ${year}`;

    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'XXXXXXXX';
    }
};

function obtenerClausulasPorTipo(tipoContrato, fechaInicio, fechaFin, terminoInicial, cargo, datosAprendiz = {}, funcionarioData = {}, confianzaManejo = false, esAscenso = false, esCambioModalidad = false, esDiscapacidad = false) {

    const esAprendiz = tipoContrato === 'APRENDIZ';
    const datosBancarios = esAprendiz
        ? {
            numero_cuenta: datosAprendiz?.numero_cuenta || 'ERROR',
            nombre_banco: datosAprendiz?.nombre_banco || 'ERROR',
            tipo_cuenta: datosAprendiz?.tipo_cuenta || 'AHORROS'
        }
        : {
            numero_cuenta: funcionarioData?.numero_cuenta || 'ERROR',
            nombre_banco: funcionarioData?.nombre_banco || 'ERROR',
            tipo_cuenta: funcionarioData?.tipo_cuenta || 'AHORROS'
        };

    // ─── 👇 Textos auxiliares para discapacidad (solo se usan si esDiscapacidad === true) ───
    const objetoDiscapacidadContenido = `EL EMPLEADOR contrata los servicios personales del TRABAJADOR para desempeñar el cargo de ${cargo || 'el señalado en el encabezado'} ejecutando las funciones propias del mismo, así como aquellas que le sean asignadas por el EMPLEADOR conforme a sus necesidades y dentro del marco legal.
PARÁGRAFO PRIMERO. No obstante que la actividad para la cual el trabajador está destinado a ejecutar su labor se encuentra predeterminado y establecido en el cabezote del presente contrato, las partes estipulan de común acuerdo que se reservan la posibilidad que el trabajador pueda apoyar si así lo requiere el empleador, otras funciones, siempre y cuando haya previa formalización y siempre que las nuevas funciones resulten compatibles con las recomendaciones médico-laborales y con los ajustes razonables vigentes.
PARÁGRAFO SEGUNDO. AJUSTES RAZONABLES Y ACCESIBILIDAD. De conformidad con las normas de inclusión y la jurisprudencia constitucional colombiana, EL EMPLEADOR se compromete a realizar los ajustes razonables necesarios en el puesto de trabajo, herramientas, funciones y entorno físico del TRABAJADOR, garantizando la eliminación de barreras actitudinales, físicas o metodológicas que pudiesen obstaculizar su desempeño laboral en condiciones de igualdad de oportunidades, los ajustes razonables se definirán de manera concertada con EL TRABAJADOR, con el apoyo del área de Seguridad y Salud en el Trabajo y de la ARL, y constarán por escrito, se entenderán por ajustes razonables aquellas modificaciones y adaptaciones necesarias y adecuadas que no impongan una carga desproporcionada o indebida al EMPLEADOR (Ley 1618 de 2013 – Ley 1346 de 2009)`;

    const jornadaDiscapacidadContenido = `El TRABAJADOR estará sujeto a la jornada laboral establecida por el EMPLEADOR, de conformidad con lo dispuesto en el Código Sustantivo del Trabajo, la Ley 2101 de 2021 y demás normas concordantes.
PARÁGRAFO ÚNICO. FLEXIBILIDAD HORARIA POR MOTIVOS DE SALUD. En cumplimiento de las garantías de accesibilidad, EL EMPLEADOR otorgará los permisos debidamente remunerados que requiera el TRABAJADOR para asistir a citas médicas programadas por su EPS, respecto a terapias, exámenes especializados o controles periódicos directamente relacionados con su diagnóstico de discapacidad. EL TRABAJADOR informará las citas programadas con antelación razonable y acreditará su asistencia mediante la constancia correspondiente`;

    const obligacionesEmpleadorDiscapacidadContenido = `Son obligaciones de EL EMPLEADOR las establecidas en el Artículo 57 del Código Sustantivo del Trabajo y en el Reglamento Interno de Trabajo.
PARÁGRAFO ÚNICO. ACCIONES AFIRMATIVAS EN SEGURIDAD Y SALUD. EL EMPLEADOR velará porque el Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST) de la Cooperativa adapte de forma proactiva el puesto de trabajo del TRABAJADOR, garantizando un entorno libre de riesgos adicionales para su salud y promoviendo su bienestar integral.`;

    const modificacionCondicionesDiscapacidadContenido = `El TRABAJADOR acepta desde ahora expresamente las modificaciones de sus condiciones laborales determinadas por el EMPLEADOR en ejercicio de su poder subordinante, tales como los turnos y jornadas de trabajo, el lugar de prestación de servicio, el cargo u oficio y/o funciones y la forma de remuneración, siempre que tales modificaciones no afecten su honor, dignidad o sus derechos mínimos, ni impliquen desmejoras sustanciales o graves perjuicios para él, de conformidad con lo dispuesto por el Art. 23 del C.S.T. modificado por el Art. 1º de la Ley 50/90. Los gastos que se originen con el traslado de lugar de prestación del servicio serán cubiertos por el EMPLEADOR, de conformidad con el numeral 8º del Art. 57 de C.S.T.
PARÁGRAFO PRIMERO. El presente contrato queda sujeto a las disposiciones legales que regulan las relaciones entre EL EMPLEADOR y EL TRABAJADOR y las que, por virtud de acuerdo entre los contratantes, constituyan modificaciones las cuales en la medida en que se produzcan se consideran incorporadas al mismo. De igual manera surtirán el mismo efecto las modificaciones que se hagan al Reglamento Interno de Trabajo de EL EMPLEADOR, quien a la suscripción de este documento deja constancia de conocer sus textos.
PARÁGRAFO SEGUNDO. LÍMITES AL JUS VARIANDI POR MOTIVOS DE SALUD. Las modificaciones unilaterales en ejercicio del jus variandi por parte del EMPLEADOR no podrá desmejorar las condiciones de salud del empleado, ni contrariar las restricciones o recomendaciones médicas permanentes o temporales emitidas por su EPS o el médico ocupacional de la Cooperativa. Cualquier cambio de puesto o función deberá garantizar que el nuevo entorno sea apto y compatible con la condición del trabajador.`;

    // Punto 44 y 49 originales (idénticos en ambas variantes de confianzaManejo) y sus reemplazos para discapacidad
    const punto44Original = `44) Bajar el nivel de productividad frente a su mismo nivel de quienes desempeñan una labor similar.`;
    const punto44Discapacidad = `44) Bajar el nivel de productividad frente a su mismo nivel de quienes desempeñan una labor similar. Esta falta solo se configurará previa evaluación con criterios objetivos, verificación de la implementación de los ajustes razonables y respeto de las recomendaciones médico-laborales vigentes; en ningún caso podrá derivarse de limitaciones propias de la condición de discapacidad del TRABAJADOR.`;

    const punto49Original = `49) Que el TRABAJADOR suministre información o documentación equivocada, imprecisa o no cierta sobre su estado de salud, formación académica, experiencia laboral, referencias, datos personales y demás en el proceso de selección, contratación, en el desarrollo de sus labores y durante la vigencia del presente contrato laboral.`;
    const punto49Discapacidad = `49) Que el TRABAJADOR suministre información o documentación equivocada, imprecisa o no cierta sobre su estado de salud, formación académica, experiencia laboral, referencias, datos personales y demás en el proceso de selección, contratación, en el desarrollo de sus labores y durante la vigencia del presente contrato laboral. Se exceptúa la información sobre el estado de salud cuya revelación no sea legalmente exigible; la reserva de datos sensibles que EL TRABAJADOR no estuviere obligado a suministrar no constituirá falta.`;

    let clausulasComunes = [
        {
            titulo: 'PRIMERA. OBJETO',
            contenido: esDiscapacidad
                ? objetoDiscapacidadContenido
                : confianzaManejo
                    ? `EL EMPLEADOR contrata los servicios personales del TRABAJADOR para desempeñar el cargo de ${cargo || 'el señalado en el encabezado'} el cual es considerado de dirección, confianza y manejo, llevando a cabo la ejecución de las tareas ordinarias y anexas al mencionado cargo, de conformidad con las órdenes, reglamentos e instrucciones que le impartan el EMPLEADOR, o sus representantes, observando en su cumplimiento la diligencia y el cuidado necesarios. EL TRABAJADOR se compromete a realizar todas las funciones inherentes a dicho cargo, pero no limitándose a la gestión de personal, desarrollo organizacional, y cumplimiento de políticas internas.
PARÁGRAFO PRIMERO. No obstante que la actividad para la cual el trabajador está destinado a ejecutar su labor se encuentra predeterminado y establecido en el cabezote del presente contrato, las partes estipulan de común acuerdo que se reservan la posibilidad que el trabajador pueda apoyar si así lo requiere el empleador, otras funciones, siempre y cuando haya previa formalización.`
                    : `EL EMPLEADOR contrata los servicios personales del TRABAJADOR para desempeñar el cargo de ${cargo || 'el señalado en el encabezado'} ejecutando las funciones propias del mismo, así como aquellas que le sean asignadas por EL EMPLEADOR conforme a sus necesidades y dentro del marco legal.
PARÁGRAFO PRIMERO. No obstante que la actividad para la cual el trabajador está destinado a ejecutar su labor se encuentra predeterminado y establecido en el cabezote del presente contrato, las partes estipulan de común acuerdo que se reservan la posibilidad que el trabajador pueda apoyar si así lo requiere el empleador, otras funciones, siempre y cuando haya previa formalización.`,
            orden: 1
        },
        {
            titulo: 'CUARTA. REMUNERACIÓN',
            contenido: confianzaManejo
                ? `El salario como contraprestación del servicio será el indicado en el encabezado del presente contrato y se pagará mensualmente mediante consignación en la cuenta de nómina autorizada e informada por el TRABAJADOR. Dada la naturaleza del cargo de dirección, confianza y manejo desempeñado por EL TRABAJADOR, este se encuentra excluido de la jornada máxima legal de trabajo, de conformidad con el artículo 162 del Código Sustantivo del Trabajo. El salario pactado remunera las funciones y responsabilidades propias del cargo, sin perjuicio de los demás derechos laborales consagrados en la ley.
PARÁGRAFO PRIMERO. Las partes convienen que el EMPLEADOR pagará al TRABAJADOR el salario aquí pactado, las prestaciones, vacaciones, indemnizaciones, liquidaciones, reliquidaciones y en general todo pago que se cause a su favor, a través de consignación que se le efectuará a dicho TRABAJADOR en la cuenta de ${datosBancarios.tipo_cuenta} No. ${datosBancarios.numero_cuenta} del banco ${datosBancarios.nombre_banco} de su titularidad o través de cheque, lo cual es autorizado y aceptado expresamente por el TRABAJADOR con la firma del presente documento.
PARÁGRAFO SEGUNDO. En consideración a que toda liquidación y pago de salarios y prestaciones sociales exige varios días para obtener los datos e informes necesarios y así mismo, implica su revisión, realizar, aprobar la liquidación definitiva, girar los cheques correspondientes, etc. y en algunos casos es necesario hacer la entrega del cargo mediante acta, las partes reconocen que la liquidación final de salarios y prestaciones sociales puede requerir algunos días para su elaboración y revisión. En todo caso, el EMPLEADOR realizará el pago dentro del término legal contemplado en el artículo 65 del código sustantivo del trabajo.
PARÁGRAFO TERCERO. PAGOS QUE NO CONSTITUYEN SALARIO: Para los efectos del Art. 128 del C. S. T, expresamente se conviene que los beneficios o auxilios habituales u ocasionales en dinero o especie, que considere otorgar el EMPLEADOR al TRABAJADOR por mera liberalidad, tales como suministro de alimentación, vivienda, celular, internet, dotación extralegal, auxilio educativo, auxilio de parqueadero o el monto que exceda lo que en cualquier tiempo hubieren valorado las partes por estos conceptos, o el suministro de los mismos a bajo precio, cualquier prima extralegal, de vacaciones, de servicios o navidad, gastos de telefonía celular o de cualquier otro medio de comunicación, los auxilios de vehículo o de moto sin que lo expresado configure obligación para el EMPLEADOR de conceder tales beneficios, no se tomarán en cuenta para la liquidación de las acreencias laborales que le correspondan al trabajador. De igual manera convienen las partes que tampoco constituye salario las bonificaciones, auxilios de alimentación, transporte o cualquier otro valor que le sea otorgado por la Cooperativa, a cualquier título al TRABAJADOR y durante la vigencia del presente contrato.`
                : `El salario laborado como contraprestación del servicio, será como se menciona en el inicio de este contrato, pagaderos de la siguiente forma: MENSUAL, pago dentro del cual queda comprendida la remuneración de los recargos, trabajo suplementario, descansos dominicales y festivos de que tratan los Capítulos I, II y III del Título VII del C.S.T. El pago anteriormente indicado se hará mediante consignación a la cuenta de nómina autorizada e informada por el trabajador para ello.
PARÁGRAFO PRIMERO. Las partes convienen que el EMPLEADOR pagará al TRABAJADOR el salario aquí pactado, las prestaciones, vacaciones, indemnizaciones, liquidaciones, reliquidaciones y en general todo pago que se cause a su favor, a través de consignación que se le efectuará a dicho TRABAJADOR en la cuenta de ${datosBancarios.tipo_cuenta} No. ${datosBancarios.numero_cuenta} del banco ${datosBancarios.nombre_banco} de su titularidad o través de cheque, lo cual es autorizado y aceptado expresamente por el TRABAJADOR con la firma del presente documento.
PARÁGRAFO SEGUNDO. En consideración a que toda liquidación y pago de salarios y prestaciones sociales exige varios días para obtener los datos e informes necesarios y así mismo, implica su revisión, realizar, aprobar la liquidación definitiva, girar los cheques correspondientes, etc. y en algunos casos es necesario hacer la entrega del cargo mediante acta, las partes reconocen que la liquidación final de salarios y prestaciones sociales puede requerir algunos días para su elaboración y revisión. En todo caso, el EMPLEADOR realizará el pago dentro del término legal contemplado en el artículo 65 del código sustantivo del trabajo.
PARÁGRAFO TERCERO. PAGOS QUE NO CONSTITUYEN SALARIO: Para los efectos del Art. 128 del C. S. T, expresamente se conviene que los beneficios o auxilios habituales u ocasionales en dinero o especie, que considere otorgar el EMPLEADOR al TRABAJADOR por mera liberalidad, tales como suministro de alimentación, vivienda, celular, internet, dotación extralegal, auxilio educativo, auxilio de parqueadero o el monto que exceda lo que en cualquier tiempo hubieren valorado las partes por estos conceptos, o el suministro de los mismos a bajo precio, cualquier prima extralegal, de vacaciones, de servicios o navidad, gastos de telefonía celular o de cualquier otro medio de comunicación, los auxilios de vehículo o de moto sin que lo expresado configure obligación para el EMPLEADOR de conceder tales beneficios, no se tomarán en cuenta para la liquidación de las acreencias laborales que le correspondan al trabajador. De igual manera convienen las partes que tampoco constituye salario las bonificaciones, auxilios de alimentación, transporte o cualquier otro valor que le sea otorgado por la Cooperativa, a cualquier título al TRABAJADOR y durante la vigencia del presente contrato.`,
            orden: 4
        },
        {
            titulo: 'QUINTA. HORARIO',
            contenido: confianzaManejo
                ? `El TRABAJADOR se someterá a la jornada laboral de acuerdo con las especificaciones dadas por EL EMPLEADOR.`
                : `El TRABAJADOR se someterá a la jornada laboral de acuerdo con las especificaciones dadas por EL EMPLEADOR, esto conforme a lo previsto en el Código Sustantivo del Trabajo, la Ley 2101 de 2021 y la Ley 2466 de 2025, y modificaciones sucesivas.`,
            orden: 5
        },
        {
            titulo: 'SEXTA. JORNADA',
            contenido: esDiscapacidad
                ? jornadaDiscapacidadContenido
                : confianzaManejo
                    ? `El cargo de ${cargo || 'el señalado en el encabezado'} es de dirección, confianza y manejo, lo que implica que EL TRABAJADOR tendrá la responsabilidad de tomar decisiones estratégicas que afecten directamente los intereses de la empresa. Debido a la naturaleza de sus funciones, EL TRABAJADOR no estará sujeto a la jornada laboral máxima ni al pago de horas extras.`
                    : `El TRABAJADOR estará sujeto a la jornada laboral establecida por el EMPLEADOR, de conformidad con lo dispuesto en el Código Sustantivo del Trabajo, la Ley 2101 de 2021 y demás normas concordantes.`,
            orden: 6
        },
        {
            titulo: 'SÉPTIMA. OBLIGACIONES DEL EMPLEADOR',
            contenido: esDiscapacidad
                ? obligacionesEmpleadorDiscapacidadContenido
                : `Son obligaciones de EL EMPLEADOR las establecidas en el Artículo 57 del Código Sustantivo del Trabajo y en el Reglamento Interno de Trabajo.`,
            orden: 7
        },
        {
            titulo: 'OCTAVA. OBLIGACIONES DEL TRABAJADOR',
            contenido: confianzaManejo
                ? `A partir de la fecha de iniciación indicada, el TRABAJADOR se compromete para con el EMPLEADOR a cumplir además de las obligaciones establecidas en la Ley y los reglamentos, memorandos, circulares y demás documentación que las contenga, especialmente las siguientes:
        1). Desarrollar y ejecutar estrategias de gestión del talento humano alineadas con los objetivos de la Cooperativa
        2). Supervisar y coordinar el equipo de ${cargo || 'el señalado en el encabezado'}
        3). Garantizar el cumplimiento de las políticas y procedimientos internos.
        4). Mantener la confidencialidad de la información sensible de la Cooperativa.
        5). Prestar sus servicios personalmente, en los sitios que le sean asignados por EL EMPLEADOR concurriendo y permaneciendo en ellos en excelente estado de presentación, observando todas y cada una de las órdenes y/o instrucciones que le sean impartidas por EL EMPLEADOR directamente o a través de sus representantes, cumpliendo con las funciones propias del cargo de ${cargo || 'XXXXXXXXXXXXX'}.
        6). Cumplir puntual y rigurosamente con el horario de trabajo que el EMPLEADOR o sus representantes le impongan, así como con las variaciones que del mismo se presenten de acuerdo con las necesidades del servicio y los instructivos de la Cooperativa
        7). Prestar en caso de emergencia, apremio o requerirlo el servicio, la colaboración que sea necesaria al EMPLEADOR o a los asociados y a las autoridades respectivas sin limitaciones de tiempo y/o lugar.
        8). No abandonar el puesto de trabajo y/o lugar donde se encuentre prestando el servicio que le haya sido asignado sin previa autorización de sus superiores y no retirarse de el sin haber sido debidamente reemplazado. Para tal efecto debe hacer entrega real y física de los elementos de trabajo que le hayan sido entregados para el cumplimiento de sus funciones, así como de los bienes y documentos que le hayan sido entregados.
        9). Informar al EMPLEADOR, directamente o por intermedio de sus superiores, cualquier anomalía o circunstancia que haya conocido en ejercicio de sus funciones o fuera de ellas y que le puedan evitar perjuicios al EMPLEADOR
        10). Cumplir estrictamente las obligaciones, deberes y prohibiciones que le imponen: los Art. 58, 60 del C. S. T. y demás normas legales vigentes aplicables que surjan de la naturaleza del cargo que desempeñe o que le sean consustanciales a él.
        11). En forma especial y de conformidad a lo establecido en el Numeral 2º del Art. 58 del C.S.T., a guardar absoluta reserva y confidencialidad de cualquier información, documento, hecho o circunstancia de que tenga conocimiento en razón a su actividad laboral a favor de los asociados y empleados del EMPLEADOR, quedándole por ello terminantemente prohibido comunicar con terceras personas las informaciones que tenga en cumplimiento de sus funciones como ${cargo || 'XXXXXXXXXXXXXXXXXX'}, así como dar a conocer sin razón legal alguna los documentos propiedad de los asociados o empleados que lleguen a sus manos
        12). A no atender durante las horas de trabajo asuntos u ocupaciones distintos a los que el EMPLEADOR o las personas autorizadas por éste le encomienden.
        13). Cuidar y manejar con esmero y atención las máquinas, herramientas, utensilios, materias primas, productos en proceso o terminados, instalaciones y demás bienes del establecimiento donde preste sus servicios y evitar todo daño o pérdida que cause perjuicios a su propietario.
        14). Cumplir el contrato de manera cuidadosa y diligente en el lugar, tiempo y condiciones que la Cooperativa le señale y de acuerdo con los horarios que le fijen conforme a las necesidades del servicio.
        15). Observar rigurosamente la disciplina interna establecida por el empleador, o por las personas autorizadas por ésta.
        16). Guardar estricta reserva de todo lo que llegue a su conocimiento por razón de su oficio y cuya comunicación pudiera causar perjuicio a la Cooperativa, o las demás agencias, socios, donde trabajen.
        17). Acatar el reglamento de trabajo del EMPLEADOR.
        18). Guardar rigurosa moral, buenas costumbres, disciplina y buen comportamiento con sus superiores, compañeros y personal de la Cooperativa y el público en general, como también mantener una relación de trabajo con sus superiores, compañeros y demás regida por la cordialidad, el respeto mutuo, la tolerancia, todo en pro de una sana convivencia y la conservación de un adecuado ambiente laboral.
        19). Abstenerse de disponer de información o material de trabajo del EMPLEADOR sin permiso de este.
        20). Abstenerse de tomar alimentos en sitio de trabajo no autorizado y de fumar en cualquiera de las instalaciones de la Cooperativa.
        21). Dar aviso de inmediato al EMPLEADOR cuando por cualquier circunstancia no pudiere concurrir al trabajo. La enfermedad debe comprobarse mediante certificado médico expedido únicamente por profesionales de la E.P.S o A.R.L. a la cual se encuentre afiliado el TRABAJADOR.
        22). Aceptar los traslados de lugar de trabajo que disponga el EMPLEADOR.
        23). Observar y cumplir las normas sobre salud ocupacional y demás disposiciones reglamentarias.
        24). Mantener actualizados los datos de residencia, teléfonos, contactos, direcciones electrónicas, a fin de que la empresa pueda hacerle llegar cualquier comunicación relacionada con su relación laboral. El incumplimiento a esta obligación exime al EMPLEADOR de toda responsabilidad derivada de la especial regulación contemplada la Ley 789 de 2002 y demás normas concordantes.
        25). Dar información oportuna al Comité de Convivencia Laboral, sobre cualquier presunta conducta de acoso laboral descrito en el Reglamento Interno de Trabajo que se iniciare en su contra por parte de cualquiera de los trabajadores de la Cooperativa
        26). Portar siempre el carné de la empresa en lugar visible, la perdida y/o hurto de este deberá ser informada al EMPLEADOR y a las autoridades competentes y su reexpedición generará llamado de atención según corresponda el caso, si la misma acción de ocasiona de forma recurrente generará suspensión. Cumplir las normas, reglamentos e instrucciones del SISTEMA DE GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO SG-SST del EMPLEADOR y asistir periódicamente a los programas de promoción y prevención adelantados por las administradoras de riesgos laborales y por el área de Salud Ocupacional.
        27). Suministrar al EMPLEADOR información clara, veraz y completa sobre su estado de salud y/o estado de gestación.
        28). Procurar el cuidado integral de su salud.
        29). Utilizar los EPP siempre en el desarrollo de sus tareas, revisándolos antes de iniciar labores y verificando que se encuentren en perfecto estado para su uso.
        30). Informar al EMPLEADOR de manera inmediata verbalmente y por escrito la ocurrencia de accidentes e incidentes que le sobrevengan por o con ocasión del trabajo.
        31). Cuidar y mantener en perfecto estado de limpieza y orden los elementos de protección personal asignados, atendiendo las indicaciones del Área de salud ocupacional.
        32). Informar oportunamente al empleador del estado de embarazo o lactancia de su cónyuge, compañero permanente o pareja, carente de vínculo laboral, en el marco de su derecho a la intimidad y libre desarrollo de la personalidad, con el fin de dar cumplimiento a la sentencia C-005 de 2017.
        33). Reportar en forma inmediata y por escrito la pérdida o hurto de cualquiera de los elementos asignados al EMPLEADOR, con el fin de que se efectúe la reposición.
        34). EL TRABAJADOR se obliga a presentarse en las instalaciones del EMPLEADOR, cuando por alguna razón no se le permita ingresar a las instalaciones donde presta sus servicios y/o lugar habitual de trabajo; se acuerda entre las partes que al omitir esta obligación se aplicaran las sanciones prescritas en el Reglamento Interno de Trabajo y/o el C.S.T.
            PARÁGRAFO PRIMERO: Se entiende integrado al presente contrato que una obligación especial del trabajador es cumplir con todas las disposiciones del Reglamento Interno de Trabajo de EL TRABAJADOR, el Manual SARLAFT "Sistema de Administración de Riesgos de Lavado de Activos y Financiación del Terrorismo" y demás normas laborales establecidas por EL EMPLEADOR y la Ley, las cuales EL TRABAJADOR declara conocer a satisfacción.`
                : `A partir de la fecha de iniciación indicada, el TRABAJADOR se compromete para con el EMPLEADOR a cumplir además de las obligaciones establecidas en la Ley y los reglamentos, memorandos, circulares y demás documentación que las contenga, especialmente las siguientes:
        1). Desarrollar y ejecutar estrategias alineadas con los objetivos de la Cooperativa
        2). Ejecutar las funciones propias del cargo asignado, cumpliendo con los lineamientos establecidos por el EMPLEADOR
        3). Garantizar el cumplimiento de las políticas y procedimientos internos.
        4). Mantener la confidencialidad de la información sensible de la Cooperativa.
        5). Prestar sus servicios personalmente, en los sitios que le sean asignados por EL EMPLEADOR concurriendo y permaneciendo en ellos en excelente estado de presentación, observando todas y cada una de las órdenes y/o instrucciones que le sean impartidas por EL EMPLEADOR directamente o a través de sus representantes, cumpliendo con las funciones propias del cargo de ${cargo || 'XXXXXXXXXXXXX'}.
        6). Cumplir puntual y rigurosamente con el horario de trabajo que el EMPLEADOR o sus representantes le impongan, así como con las variaciones que del mismo se presenten de acuerdo con las necesidades del servicio y los instructivos de la Cooperativa
        7). Prestar en caso de emergencia, apremio o requerirlo el servicio, la colaboración que sea necesaria al EMPLEADOR o a los asociados y a las autoridades respectivas sin limitaciones de tiempo y/o lugar.
        8). No abandonar el puesto de trabajo y/o lugar donde se encuentre prestando el servicio que le haya sido asignado sin previa autorización de sus superiores y no retirarse de el sin haber sido debidamente reemplazado. Para tal efecto debe hacer entrega real y física de los elementos de trabajo que le hayan sido entregados para el cumplimiento de sus funciones, así como de los bienes y documentos que le hayan sido entregados.
        9). Informar al EMPLEADOR, directamente o por intermedio de sus superiores, cualquier anomalía o circunstancia que haya conocido en ejercicio de sus funciones o fuera de ellas y que le puedan evitar perjuicios al EMPLEADOR
        10). Cumplir estrictamente las obligaciones, deberes y prohibiciones que le imponen: los Art. 58, 60 del C. S. T. y demás normas legales vigentes aplicables que surjan de la naturaleza del cargo que desempeñe o que le sean consustanciales a él.
        11). En forma especial y de conformidad a lo establecido en el Numeral 2º del Art. 58 del C.S.T., a guardar absoluta reserva y confidencialidad de cualquier información, documento, hecho o circunstancia de que tenga conocimiento en razón a su actividad laboral a favor de los asociados y empleados del EMPLEADOR, quedándole por ello terminantemente prohibido comunicar con terceras personas las informaciones que tenga en cumplimiento de sus funciones como ${cargo || 'XXXXXXXXXXXXXXXXXX'}, así como dar a conocer sin razón legal alguna los documentos propiedad de los asociados o empleados que lleguen a sus manos
        12). A no atender durante las horas de trabajo asuntos u ocupaciones distintos a los que el EMPLEADOR o las personas autorizadas por éste le encomienden.
        13). Cuidar y manejar con esmero y atención las máquinas, herramientas, utensilios, materias primas, productos en proceso o terminados, instalaciones y demás bienes del establecimiento donde preste sus servicios y evitar todo daño o pérdida que cause perjuicios a su propietario.
        14). Cumplir el contrato de manera cuidadosa y diligente en el lugar, tiempo y condiciones que la Cooperativa le señale y de acuerdo con los horarios que le fijen conforme a las necesidades del servicio.
        15). Observar rigurosamente la disciplina interna establecida por el empleador, o por las personas autorizadas por ésta.
        16). Guardar estricta reserva de todo lo que llegue a su conocimiento por razón de su oficio y cuya comunicación pudiera causar perjuicio a la Cooperativa, o las demás agencias, socios, donde trabajen.
        17). Acatar el reglamento de trabajo del EMPLEADOR.
        18). Guardar rigurosa moral, buenas costumbres, disciplina y buen comportamiento con sus superiores, compañeros y personal de la Cooperativa y el público en general, como también mantener una relación de trabajo con sus superiores, compañeros y demás regida por la cordialidad, el respeto mutuo, la tolerancia, todo en pro de una sana convivencia y la conservación de un adecuado ambiente laboral.
        19). Abstenerse de disponer de información o material de trabajo del EMPLEADOR sin permiso de este.
        20). Abstenerse de tomar alimentos en sitio de trabajo no autorizado y de fumar en cualquiera de las instalaciones de la Cooperativa.
        21). Dar aviso de inmediato al EMPLEADOR cuando por cualquier circunstancia no pudiere concurrir al trabajo. La enfermedad debe comprobarse mediante certificado médico expedido únicamente por profesionales de la E.P.S o A.R.L. a la cual se encuentre afiliado el TRABAJADOR.
        22). Aceptar los traslados de lugar de trabajo que disponga el EMPLEADOR.
        23). Observar y cumplir las normas sobre salud ocupacional y demás disposiciones reglamentarias.
        24). Mantener actualizados los datos de residencia, teléfonos, contactos, direcciones electrónicas, a fin de que la empresa pueda hacerle llegar cualquier comunicación relacionada con su relación laboral. El incumplimiento a esta obligación exime al EMPLEADOR de toda responsabilidad derivada de la especial regulación contemplada la Ley 789 de 2002 y demás normas concordantes.
        25). Dar información oportuna al Comité de Convivencia Laboral, sobre cualquier presunta conducta de acoso laboral descrito en el Reglamento Interno de Trabajo que se iniciare en su contra por parte de cualquiera de los trabajadores de la Cooperativa
        26). Portar siempre el carné de la empresa en lugar visible, la perdida y/o hurto de este deberá ser informada al EMPLEADOR y a las autoridades competentes y su reexpedición generará llamado de atención según corresponda el caso, si la misma acción de ocasiona de forma recurrente generará suspensión. Cumplir las normas, reglamentos e instrucciones del SISTEMA DE GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO SG-SST del EMPLEADOR y asistir periódicamente a los programas de promoción y prevención adelantados por las administradoras de riesgos laborales y por el área de Salud Ocupacional.
        27). Suministrar al EMPLEADOR información clara, veraz y completa sobre su estado de salud y/o estado de gestación.
        28). Procurar el cuidado integral de su salud.
        29). Utilizar los EPP siempre en el desarrollo de sus tareas, revisándolos antes de iniciar labores y verificando que se encuentren en perfecto estado para su uso.
        30). Informar al EMPLEADOR de manera inmediata verbalmente y por escrito la ocurrencia de accidentes e incidentes que le sobrevengan por o con ocasión del trabajo.
        31). Cuidar y mantener en perfecto estado de limpieza y orden los elementos de protección personal asignados, atendiendo las indicaciones del Área de salud ocupacional.
        32). Informar oportunamente al empleador del estado de embarazo o lactancia de su cónyuge, compañero permanente o pareja
        33). Reportar en forma inmediata y por escrito la pérdida o hurto de cualquiera de los elementos asignados al EMPLEADOR, con el fin de que se efectúe la reposición.
        34). EL TRABAJADOR se obliga a presentarse en las instalaciones del EMPLEADOR, cuando por alguna razón no se le permita ingresar a las instalaciones donde presta sus servicios y/o lugar habitual de trabajo; se acuerda entre las partes que al omitir esta obligación se aplicaran las sanciones prescritas en el Reglamento Interno de Trabajo y/o el C.S.T.
            PARÁGRAFO PRIMERO: Se entiende integrado al presente contrato que una obligación especial del trabajador es cumplir con todas las disposiciones del Reglamento Interno de Trabajo de EL TRABAJADOR, el Manual SARLAFT "Sistema de Administración de Riesgos de Lavado de Activos y Financiación del Terrorismo" y demás normas laborales establecidas por EL EMPLEADOR y la Ley, las cuales EL TRABAJADOR declara conocer a satisfacción.`,
            orden: 8
        },
        {
            titulo: 'NOVENA. CLÁUSULA DE CONFIDENCIALIDAD Y RESERVA.',
            contenido: `EL TRABAJADOR tiene la obligación de preservar la reserva de la información suministrada; por tanto, se compromete a utilizarla exclusivamente en desarrollo del ejercicio de su cargo y no divulgará esta información a personas que no sean funcionarios ni directivos de la Cooperativa, que requieran conocer de esta información por razón de sus funciones. La confidencialidad se mantendrá respecto de la información que ostente la calidad de reservada y que haya sido suministrada por la Cooperativa o calificada su calidad de tal por parte de este último, en forma verbal o escrita por sí o por medio de divisiones, subsidiarias, matrices, filiales, directores o empleados, individualmente o en conjunto. Para los efectos anteriores se entenderá como reservada toda la información escrita o verbal que sea entregada al EL TRABAJADOR por parte de la Cooperativa, sus clientes o sus proveedores de información. La información a que hace referencia la presente cláusula de Confidencialidad es suministrada por la Cooperativa, sus clientes o sus colaboradores, debido a las tareas que debe cumplir EL TRABAJADOR dentro del ejercicio de su cargo. En consecuencia, EL TRABAJADOR reconoce como de propiedad de la Cooperativa la información verbal o escrita que le sea suministrada y guardará confidencialidad respecto de esta en los términos de la presente cláusula de Confidencialidad.
    PARÁGRAFO PRIMERO. EL TRABAJADOR declara que ha asumido un deber de confidencialidad en relación con la información reservada suministrada por la Cooperativa, sus clientes o sus proveedores de información, obligándose a lo siguiente:
    a) Dar la información reservada un manejo y uso prudente, diligente y adecuado, y la cláusula de confidencialidad.
    b) Garantizar que las personas que tengan acceso a la información conozcan de su carácter confidencial. En consecuencia, se obliga a mantener mecanismos internos adecuados para proteger la confidencialidad de esta.
    c) A no divulgar, revelar, extraer, exhibir, comunicar, utilizar o emplear, directa o indirectamente, y mantener en reserva la información confidencial, salvo que por solicitud expresa de la COOPERATIVA o por disposición legal competente debe darla a conocer. Igual obligación existirá respecto de la información proveniente de los asociados de la Cooperativa.
    d) Utilizar la información únicamente para los fines establecidos en el presente contrato de trabajo.
    e) A devolver la información suministrada por la Cooperativa el mismo día de la terminación del presente contrato.
    f) A destruir cualquier copia o registro electrónico que hayan elaborado con base en la información confidencial suministrada, hecho que deberá certificar mediante constancia escrita.
    g) A utilizar adecuadamente los manuales, materiales, el software y, en general, toda la información y documentación que tenga acceso en desarrollo de sus labores.
    h) No divulgar Los planes de negocio, estrategias comerciales, políticas de mercadeo, listas de asociados y proveedores, contratos, convenios, alianzas y demás documentos relacionados con la actividad comercial de la Cooperativa.
    i) No divulgar Los datos personales de los empleados, directivos, asociados y demás personas vinculadas a la Cooperativa que sean necesarios para el desarrollo de las funciones y obligaciones de EL EMPLEADO.
    j) No divulgar Los diseños, patentes, marcas, modelos, software y demás documentos relacionados con la propiedad intelectual e industrial de la Cooperativa.
    PARÁGRAFO SEGUNDO. La presente cláusula de Confidencialidad estará vigente durante todo el término de duración del presente contrato y se mantendrá de manera indefinida según lo especificado por la Ley 1581 de 2012 y sus decretos reglamentarios y con base el Principio de confidencialidad: Todas las personas que intervengan en el Tratamiento de datos personales que no tengan la naturaleza de públicos están obligadas a garantizar la reserva de la información, inclusive después de finalizada su relación con alguna de las labores que comprende el Tratamiento, pudiendo sólo realizar suministro o comunicación de datos personales cuando ello corresponda al desarrollo de las actividades autorizadas en la presente ley y en los términos de la misma.
    PARÁGRAFO TERCERO. EL TRABAJADOR será responsable ante la Cooperativa por los perjuicios que sean ocasionados por el incumplimiento de las obligaciones derivadas del presente acuerdo de confidencialidad establecida en el presente documento.
    PARÁGRAFO CUARTO. El incumplimiento de las obligaciones de confidencialidad por parte del TRABAJADOR constituirá falta grave y dará lugar a las acciones legales correspondientes para la obtención de la reparación integral de los perjuicios que se llegaren a causar al EMPLEADOR o a terceros, previa demostración de la responsabilidad del TRABAJADOR conforme a la ley.
    PARÁGRAFO QUINTO. En el evento en que el TRABAJADOR revele la información a que se hace referencia en la presente cláusula su conducta será considerada como falta grave y por lo tanto constitutiva de justa causa para dar por terminado el contrato de trabajo unilateralmente por parte del EMPLEADOR, sin perjuicio de que el TRABAJADOR deba resarcir al EMPLEADOR o a terceras personas los perjuicios que les cause por la violación de la presente cláusula de confidencialidad.
    PARÁGRAFO SEXTO. HABEAS DATA. El EMPLEADO autoriza de manera previa, expresa e informada al EMPLEADOR para que, directamente o a través de sus empleados, asesores y/o terceros encargados del tratamiento de datos (I.) a realizar cualquier operación que tenga una finalidad lícita, tales como la recolección, almacenamiento, uso, circulación, suspensión, transferencia, y transmisión (el "Tratamiento") sobre sus datos personales, entendidos como cualquier información vinculada o que pueda asociarse al EMPLEADO (los "Datos Personales") para el cumplimiento de los fines de EMPLEADOR que incluyen pero no se limitan a la afiliación del empleado en la cooperativa, en las entidades del sistema general de seguridad social y parafiscales, archivo y procesamiento de nómina, archivos sobre antecedentes disciplinarios y contractuales, reporte ante autoridades administrativas, laborales, fiscales o judiciales, de centrales de riesgo (Trasunion y Datacredito) así como el cumplimiento de obligaciones legales y contractuales del EMPLEADOR con terceros, la debida ejecución del Contrato, el cumplimiento de las políticas internas del EMPLEADOR, la verificación del cumplimiento de las obligaciones del EMPLEADO, la administración de sus sistemas de información y comunicaciones, la generación de copias y archivos de seguridad de la información en los equipos proporcionados por el EMPLEADOR. (II.) EL EMPLEADO conoce el carácter facultativo de entregar o no al EMPLEADOR sus datos sensibles. EL EMPLEADO reconoce y acepta con la suscripción del presente contrato que el Tratamiento de sus datos Personales efectuado por fuera del territorio colombiano puede regirse para algunos efectos por leyes extranjeras. (III) EL EMPLEADO reconoce que ha sido informado de los derechos que le asisten en su calidad de titular de Datos Personales, entre los que se encuentran los siguientes: i) conocer, actualizar y rectificar sus Datos Personales frente al EMPLEADOR o quienes por cuenta de éste realicen el Tratamiento de sus Datos Personales; ii) solicitar prueba de autorización otorgada al EMPLEADOR salvo cuando la ley no lo requiera; iii) previa solicitud, ser informado sobre el uso que se ha dado a sus Datos Personales, por EL EMPLEADOR o quienes por cuenta de éste realicen el Tratamiento de sus Datos Personales; iv) presentar ante las autoridades competentes quejas por violaciones al régimen legal colombiano de protección de datos personales; V) revocar la presente autorización y/o solicitar la suspensión de sus Datos Personales cuando la autoridad competente determine que EL EMPLEADOR incurrió en conductas contrarias a la ley y a la Constitución; y vi) acceder en forma gratuita a sus Datos Personales que hayan sido objeto de Tratamiento. (iv) Para los fines estipulados en la ley, EL EMPLEADOR puede contactar al EMPLEADO a la dirección electrónica proporcionado por este para la atención de los asuntos relativos a sus Datos Personales. EL EMPLEADOR podrá reemplazar o designar a esta persona notificándolo por escrito a EL EMPLEADO.
    PARAGRAFO DECIMO PRIMERO. El Trabajador, mediante la firma del presente documento, autoriza de manera expresa, libre y voluntaria a la Cooperativa, sus agencias, filiales y sociedades asociadas, a realizar grabaciones audiovisuales y/o capturas de imagen, sonido o video en cualquier formato o medio magnético, tanto dentro de las instalaciones de la Cooperativa como en los eventos que ésta organice o en los que participe. Dichas grabaciones podrán ser utilizadas con fines internos o externos, incluyendo, pero no limitándose a la capacitación, promoción de la imagen corporativa, difusión en redes sociales, material publicitario, o cualquier otro propósito lícito relacionado con la actividad empresarial de la Cooperativa. La presente autorización incluye la cesión de derechos de imagen y voz del Trabajador, sin que este pueda exigir contraprestación económica alguna por su uso. El Trabajador declara estar informado de que la utilización de dichas grabaciones se realizará conforme a la normativa vigente sobre protección de datos personales y privacidad. Esta autorización permanecerá vigente durante toda la relación laboral del Trabajador con la Cooperativa, y hasta 10 años posterior a la finalización de la misma, salvo que el Trabajador revoque expresamente su consentimiento por escrito.`,
            orden: 9
        },
        {
            titulo: 'DÉCIMA. DOTACIÓN',
            contenido: confianzaManejo
                ? `EL TRABAJADOR se obliga a destinar el vestido y el calzado de labor suministrado a la realización de las labores contratadas por EL EMPLEADOR, quedando totalmente prohibido el uso de logos, marcas, o cualquier insignia representativa de la Cooperativa, clientes y proveedores para otros fines diferentes a los contratados; si no lo hiciere así EL EMPLEADOR quedará eximido de realizar el suministro de la dotación de vestido y calzado de labor del periodo siguiente, de conformidad con lo establecido en el Artículo 233 del C.S.T. sin perjuicio de las sanciones disciplinarias que interpongan.
PARÁGRAFO. Las disposiciones contenidas en la presente cláusula solo serán aplicables en los eventos en que el TRABAJADOR tenga derecho a la dotación de calzado y vestido de labor conforme a lo dispuesto en los artículos 230 y siguientes del Código Sustantivo del Trabajo y demás normas que los modifiquen, adicionen o sustituyan.`
                : `EL TRABAJADOR se obliga a destinar el vestido y el calzado de labor suministrado a la realización de las labores contratadas por EL EMPLEADOR, quedando totalmente prohibido el uso de logos, marcas, o cualquier insignia representativa de la Cooperativa, clientes y proveedores para otros fines diferentes a los contratados; si no lo hiciere así EL EMPLEADOR quedará eximido de realizar el suministro de la dotación de vestido y calzado de labor del periodo siguiente, de conformidad con lo establecido en el Artículo 233 del C.S.T. sin perjuicio de las sanciones disciplinarias que interpongan.`,
            orden: 10
        },
        {
            titulo: 'DÉCIMA PRIMERA. ACREDITACIÓN DE INCAPACIDADES',
            contenido: `Cuando se trate de acreditar incapacidades para la inasistencia al trabajo por causa de enfermedad o accidente, sólo será admitida como prueba la certificación expedida por la EPS o ARL a la cual se encuentra afiliado el TRABAJADOR o por médicos debidamente vinculados a la EPS o ARL, documento que el TRABAJADOR se compromete a entregar en el área de Talento Humano a más tardar el segundo (2) día hábil después de la fecha de iniciación de la incapacidad.
PARÁGRAFO PRIMERO. El trabajador se obliga a entregar en original la incapacidad emitida por la EPS al área de Talento Humano, para que esta pueda reconocer y efectuar el respectivo pago. Hasta tanto el trabajador no allegue la incapacidad en original emitida por la EPS, no se procederá con el reconocimiento del subsidio por incapacidad.`,
            orden: 11
        },
        {
            titulo: 'DÉCIMA SEGUNDA. MODIFICACIÓN DE LAS CONDICIONES LABORALES',
            contenido: esDiscapacidad
                ? modificacionCondicionesDiscapacidadContenido
                : `El TRABAJADOR acepta desde ahora expresamente todas las modificaciones de sus condiciones laborales determinadas por el EMPLEADOR en ejercicio de su poder subordinante, tales como los turnos y jornadas de trabajo, el lugar de prestación de servicio, el cargo u oficio y/o funciones y la forma de remuneración, siempre que tales modificaciones no afecten su honor, dignidad o sus derechos mínimos, ni impliquen desmejoras sustanciales o graves perjuicios para él, de conformidad con lo dispuesto por el Art. 23 del C.S.T. modificado por el Art. 1º de la Ley 50/90. Los gastos que se originen con el traslado de lugar de prestación del servicio serán cubiertos por el EMPLEADOR, de conformidad con el numeral 8º del Art. 57 de C.S.T.
PARÁGRAFO PRIMERO. El presente contrato queda sujeto a las disposiciones legales que regulan las relaciones entre EL EMPLEADOR y EL TRABAJADOR y las que, por virtud de acuerdo entre los contratantes, constituyan modificaciones las cuales en la medida en que se produzcan se consideran incorporadas al mismo. De igual manera surtirán el mismo efecto las modificaciones que se hagan al Reglamento Interno de Trabajo de EL EMPLEADOR, quien a la suscripción de este documento deja constancia de conocer sus textos.`,
            orden: 12
        },
        {
            titulo: 'DÉCIMA TERCERA. CLÁUSULA DE TECNOLOGÍA E INFORMÁTICA',
            contenido: `1. Los equipos de computación y el software, propiedad del EMPLEADOR están destinados para propósitos propios de la organización.
                        2. En ninguna circunstancia se permite que los empleados instalen software aplicativo personal en equipos de la empresa.
                        3. Se prohíbe estrictamente el uso de los equipos y software instalados en él, propiedad de la empresa para crear, bajar de Internet o distribuir material sexual, ofensivo o inapropiado.
                        4. El TRABAJADOR debe manejar con el debido cuidado los equipos, por lo tanto, está prohibido comer o beber en los sitios de trabajo y tener productos similares cerca de ellos.
                        5. El TRABAJADOR no está facultado para enviar correos electrónicos en forma indiscriminada a todo el personal de la empresa, clientes o amigos sin autorización de la Dirección General.
                        6. El TRABAJADOR es responsable de daños del equipo por usos inapropiado, por lo tanto, se deben tomar las precauciones necesarias y evitar que otras personas utilicen el equipo asignado sin autorización ya que podrían instalar, borrar, dañar o copiar software o archivos no permitidos.`,
            orden: 13
        },
        {
            titulo: 'DÉCIMA CUARTA. TERMINACIÓN UNILATERAL',
            contenido: (() => {
                let base = confianzaManejo
                    ? `Los contratantes señalan como faltas graves de EL TRABAJADOR, además de las establecidas por el Artículos 62 del Código Sustantivo del Trabajo, modificado por el Artículo 7 del Decreto 2.351 de 1965, sus disposiciones reglamentarias y el Reglamento Interno de Trabajo, las siguientes, que de común acuerdo se califican como graves, cuyo acaecimiento dará lugar a la terminación por parte de EL EMPLEADOR del contrato de trabajo con justa causa, sin que haya lugar a indemnización alguna en favor de EL TRABAJADOR:
                            1) Por violación a cualquiera de las estipulaciones del presente contrato
                            2) La inasistencia injustificada por una sola vez de EL TRABAJADOR al cumplimiento de sus labores o el abandono de las mismas sin autorización superior o sin justa causa comprobada a juicio de la Cooperativa.
                            3) Por incurrir en cualquier negligencia que ponga en peligro su seguridad y la de las demás personas, máquinas, materias primas y todos los objetos relacionados con la labor que se compromete a ejecutar el TRABAJADOR.
                            4) Presentarse en los lugares o sitios designados para ejercer sus funciones o en las instalaciones de la Cooperativa habiendo ingerido licor, o bajo el efecto de narcóticos y/o cualquier otra droga enervante, o consumirlos durante el desempeño de sus funciones o el entregar el turno a quien se presente en tales condiciones sin informar en forma inmediata a la Cooperativa de tal anomalía. siendo este un interés legítimo del empleador para que se dé una prestación adecuada de la labor contratada, por lo tanto, remitirá o practicará los exámenes médicos ó pruebas que determinen el estado del trabajador cuando se presenta a laborar bajo la influencia de bebidas alcohólicas, de narcóticos y/o cualquier otra droga enervante, para determinar el grado de afectación de la labor desarrollada, en concordancia con la sentencia 636 de 2016.
                            5) El no tratar, razonablemente, de impedir la ejecución de actos delictuosos o en detrimento del EMPLEADOR o de la persona a quien éste presta sus servicios o el que teniendo conocimiento de los mismos no dar aviso al EMPLEADOR o a sus representantes en forma inmediata
                            6) Concurrir, con el uniforme, prendas y insignias en establecimientos dedicados al expendio de bebidas embriagantes, sitios de dudosa reputación tales como bares, night clubs, prostíbulos, billares, fiestas sociales, o cualquier otro lugar donde se expendan bebidas alcohólicas, o en aquellos lugares donde les esté prohibido según las disposiciones legales
                            7) Negarse a aceptar traslados que el EMPLEADOR o sus representantes dispongan para la prestación de sus servicios cuando los cambios obedecen a las necesidades del servicio.
                            8) Desacatar o incumplir las instrucciones específicas que le sean impartidas para la prestación de sus servicios en los lugares asignados para su desempeño tales como: abstenerse de fumar, no contestar los reportes que se le hagan vía teléfono o por cualquier otro medio previamente determinado, el uso abusivo, personalísimo o temerario de los elementos asignados para la prestación del servicio como computadores, teléfonos, dotación, insignias, llaves, fotocopiadoras, y demás implementos o instrumentos, etc., que sean de propiedad del EMPLEADOR, o que le hayan sido confiados por el usuario del servicio en el lugar donde desempeña sus funciones ò no asistir sin justificación alguna a cualquier tipo de citación hecha por el EMPLEADOR a las instalaciones de la empresa
                            9) El no uso de los equipos de protección personal asignados según el sitio de trabajo o dentro de la prestación de su servicio, así como el desobedecer las órdenes e incumplir las normas y políticas de salud ocupacional y/o seguridad industrial.
                            10) El Solicitar créditos, préstamos de dinero o de cualquier otro bien a los asociados o personas que tengan vínculo directo con la Cooperativa
                            11) El recibir visitas personales o el trato confianzudo o excesivo con las personas durante el cumplimiento de la jornada laboral.
                            12) Por encontrar en poder del TRABAJADOR o en lugar destinado a guardar sus elementos de trabajo, sin autorización alguna, herramientas, materias primas, objetos de producción y demás elementos que no le pertenecen.
                            13) Por ordenar, incitar, realizar o participar en cualquier cese ilegal en el trabajo.
                            14) El incumplimiento por parte del TRABAJADOR de las instrucciones e indicaciones que le imparta el EMPLEADOR o sus representantes para la ejecución de las labores ejecutadas al servicio de este.
                            15) La ocurrencia de cualquier acto de violencia, injuria, malos tratamientos o irrespeto injustificado por parte de EL TRABAJADOR hacia sus superiores, funcionarios de la Cooperativa o a terceros, dentro de las instalaciones de la Cooperativa o de las instalaciones donde ejerza su actividad o fuera de ellas, pero en este último caso en cumplimiento de sus funciones
                            16) Negociar la información de la Cooperativa para beneficio personal o de terceros, o bienes materiales de propiedad del EMPLEADOR.
                            17) Autorizar o ejecutar sin ser de su competencia, actividades que afecten los intereses del EMPLEADOR.
                            18) Valerse del nombre del EMPLEADOR o de las labores encomendadas por este para emprender, respaldar o acreditar negocios particulares o actividades comerciales personales.
                            19) Presentar cuentas de gastos ficticios o reportar como cumplidas tareas no efectuadas.
                            20) El uso indebido de papelería, documentos o similares en las labores que desempeñe y que sean suministrados por el EMPLEADOR.
                            21) La violación a las especiales obligaciones y prohibiciones contempladas en el presente contrato.
                            22) El no aceptar las asignaciones de trabajo.
                            23) Revelar secretos, fórmulas, sistemas, procedimientos y demás datos reservados de la Cooperativa.
                            24) No utilización por parte del TRABAJADOR del equipo de seguridad y elementos de trabajo asignados o suministrados por la Cooperativa que ponga en peligro su integridad, o la de sus compañeros.
                            25) Por la revelación de secretos, fórmulas, sistemas, procedimientos y demás datos reservados del empleador, aún por primera vez.
                            26) Solicitar dádivas, o préstamos de dinero a los asociados o compañeros de labor.
                            27) Todo acto inmoral o delictuoso que cometa el TRABAJADOR durante el desempeño de sus labores en contra de la Cooperativa, EMPLEADOR o sus compañeros de trabajo.
                            28) La alteración, modificación, ocultamiento o simulación de los informes de trabajo reportados por sus representantes.
                            29) La omisión por parte del TRABAJADOR de cualquier información requerida por la empresa.
                            30) Por dejar de marcar su tarjeta de control, timbrar la de otro TRABAJADOR o sustituir a este en cualquier irregularidad o sin autorización previa.
                            31) Por la sustracción de cualquier objeto que no le pertenezca.
                            32) Por abandonar el sitio de trabajo, sin permiso de las personas que tienen a su cargo la disciplina, salvo cuando el desplazamiento responda a las gestiones propias de su cargo de dirección y manejo
                            33) Por la no asistencia a una sesión completa de la jornada de trabajo o más, sin excusa suficiente a juicio de la Cooperativa.
                            34) Por la pugnacidad, desavenencia o falta de entendimiento del TRABAJADOR con algunas de las personas que laboran en la misma Cooperativa y que a juicio de los directivos de este, pueda lesionar la marcha armónica de las labores.
                            35) Retirar de las oficinas archivos, documentos, elementos o dar a conocer cualquier documento, sin autorización expresa para ello.
                            36) No cumplir con las normas del SISTEMA DE GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO SG-SST del EMPLEADOR.
                            37) Las partes califican como falta grave a las obligaciones y deberes del TRABAJADOR, la modificación o uso indebido de la información contenida en el comprobante de pago o en certificaciones laborales.
                            38) El incumplimiento por parte del TRABAJADOR a las normas de administración y protección de datos en perjuicio del EMPLEADOR.
                            39) La extralimitación de funciones que afecten o pongan en peligro los intereses de EL EMPLEADOR.
                            40) La violación de la reserva de aspectos confidenciales puestos bajo la responsabilidad de EL TRABAJADOR o conocidos por éste debido a su cargo.
                            41) La realización de actos que en cualquier forma entorpezcan o incidan negativamente en el normal desarrollo de las actividades patronales o en perjuicios de terceros.
                            42) O la ocurrencia de faltantes o descuadres en dinero o el extravío, destrucción, deterioro o pérdida de documentos o elementos bajo la responsabilidad o en poder de EL TRABAJADOR, siempre que no se dé una causa justificada a juicio de EL EMPLEADOR.
                            43) El uso indebido por acción, omisión, error, negligencia o descuido de la firma autorizada, que incida negativamente contra los intereses de Cooperativa, o los ponga en peligro.
                            ${punto44Original}
                            45) callar u ocultar errores en la liquidación de los pagos que reciba con el fin de obtener un provecho.
                            46) Asimismo el incurrir en las faltas que se califiquen como graves en manuales, instructivos, memorandos, reglamentos y demás documentos que contengan reglamentaciones, circulares normativas y demás documentos relacionados.
                            47) Expresamente se califican como faltas graves en este acto, la violación a las obligaciones contenidas en el presente contrato, el reglamento interno de trabajo, circulares normativas, políticas, anexos, términos de referencia, memorandos, los cuales hacen parte integral de este contrato.
                            48) Se consideran faltas graves las establecidas por parte del EMPLEADOR en reglamentos y demás documentos que contengan reglamentaciones, órdenes, instrucciones o prohibiciones de carácter general o particular, pactos, convenciones colectivas, laudos arbitrales y las que expresamente convengan calificar así en escritos que formaran parte integrante del presente contrato.
                            ${punto49Original}
                            50) No dar cumplimiento a las normas contenidas en el Reglamento Interno de Trabajo o por disposición expresa de la Cooperativa, en calidad de EMPLEADOR.
                            51) El incumplimiento al horario de trabajo, teniendo claridad el trabajador que el retardo injustificado es falta grave. En consecuencia, la ocurrencia de cualquiera de estos hechos referidos, faculta al EMPLEADOR para dar por terminado su contrato de trabajo por justa causa de conformidad con el Reglamento Interno de Trabajo y las normas disciplinarias.
                            52) Suministrar información o documentación falsa u omitir información en el proceso de selección o contratación, que pueda generarle un perjuicio al EMPLEADOR.
                            53) El incumplimiento de cualquiera de las obligaciones y prohibiciones especiales establecidas por el Artículo 58 y 60 del Código Sustantivo del Trabajo.
                            54) La realización de actividades en contravención a órdenes superiores o de reglamento, de carácter culposo, o doloso que atenten o incidan negativamente contra los intereses de EL EMPLEADOR o de terceros.
                            55) El grave incumplimiento por parte del TRABAJADOR de las instrucciones, reglamentos y determinaciones de prevención de riesgos, adoptados en forma general o específica, y que se encuentren dentro de los programas de salud ocupacional del EMPLEADOR.
                            PARÁGRAFO PRIMERO. Terminado el contrato por cualquier motivo, es responsabilidad del TRABAJADOR hacer entrega de su cargo a través de un ACTA DE FINALIZACIÓN, en la cual se detallen los asuntos pendientes y se sugieran las acciones que se deban ejecutar para el normal desarrollo de la responsabilidad del cargo. Adicionalmente deberá devolver los bienes, valores, productos y documentos de propiedad de la empresa que le hayan sido confiados, lo mismo que el carnet que lo acredita como empleado
                            PARÁGRAFO SEGUNDO. TERMINACIÓN INTEMPESTIVA DEL CONTRATO DE TRABAJO POR PARTE DEL TRABAJADOR: Para todos los efectos legales en los términos del Art.6º de la Ley 50 de 1990 se considerará terminación intempestiva del contrato de trabajo por parte del TRABAJADOR, la falta de este al trabajo sin permiso o sin justa causa comprobada a juicio de la Cooperativa, caso en el cual EL EMPLEADOR solamente se limitará a aceptar dicha terminación y proceder al pago de las prestaciones sociales correspondientes.
                            PARÁGRAFO TERCERO: De igual manera el contrato de trabajo termina por mandato legal en los términos del Art. 5º Literal I) de la Ley 50 de 1990, cuando el TRABAJADOR no regrese a su labor al desaparecer la causa de suspensión del contrato.`
                    : `Los contratantes señalan como faltas graves de EL TRABAJADOR, además de las establecidas por el Artículos 62 del Código Sustantivo del Trabajo, sus disposiciones reglamentarias y el Reglamento Interno de Trabajo, las siguientes, que de común acuerdo se califican como graves, cuyo acaecimiento dará lugar a la terminación por parte de EL EMPLEADOR del contrato de trabajo con justa causa, sin que haya lugar a indemnización alguna en favor de EL TRABAJADOR:
                            1) Por violación a cualquiera de las estipulaciones del presente contrato
                            2) La inasistencia injustificada por una sola vez de EL TRABAJADOR al cumplimiento de sus labores o el abandono de las mismas sin autorización superior o sin justa causa comprobada a juicio de la Cooperativa.
                            3) Por incurrir en cualquier negligencia que ponga en peligro su seguridad y la de las demás personas, máquinas, materias primas y todos los objetos relacionados con la labor que se compromete a ejecutar el TRABAJADOR.
                            4) Presentarse en los lugares o sitios designados para ejercer sus funciones o en las instalaciones de la Cooperativa habiendo ingerido licor, o bajo el efecto de narcóticos y/o cualquier otra droga enervante, o consumirlos durante el desempeño de sus funciones o el entregar el turno a quien se presente en tales condiciones sin informar en forma inmediata a la Cooperativa de tal anomalía. siendo este un interés legítimo del empleador para que se dé una prestación adecuada de la labor contratada, por lo tanto, remitirá o practicará los exámenes médicos ó pruebas que determinen el estado del trabajador cuando se presenta a laborar bajo la influencia de bebidas alcohólicas, de narcóticos y/o cualquier otra droga enervante, para determinar el grado de afectación de la labor desarrollada.
                            5) El no tratar, razonablemente, de impedir la ejecución de actos delictuosos o en detrimento del EMPLEADOR o de la persona a quien éste presta sus servicios o el que teniendo conocimiento de los mismos no dar aviso al EMPLEADOR o a sus representantes en forma inmediata
                            6) Concurrir, con el uniforme, prendas y insignias en establecimientos dedicados al expendio de bebidas embriagantes, sitios de dudosa reputación tales como bares, night clubs, prostíbulos, billares, fiestas sociales, o cualquier otro lugar donde se expendan bebidas alcohólicas, o en aquellos lugares donde les esté prohibido según las disposiciones legales
                            7) Negarse a aceptar traslados que el EMPLEADOR o sus representantes dispongan para la prestación de sus servicios cuando los cambios obedecen a las necesidades del servicio.
                            8) Desacatar o incumplir las instrucciones específicas que le sean impartidas para la prestación de sus servicios en los lugares asignados para su desempeño tales como: abstenerse de fumar, no contestar los reportes que se le hagan vía teléfono o por cualquier otro medio previamente determinado, el uso abusivo, personalísimo o temerario de los elementos asignados para la prestación del servicio como computadores, teléfonos, dotación, insignias, llaves, fotocopiadoras, y demás implementos o instrumentos, etc., que sean de propiedad del EMPLEADOR, o que le hayan sido confiados por el usuario del servicio en el lugar donde desempeña sus funciones ò no asistir sin justificación alguna a cualquier tipo de citación hecha por el EMPLEADOR a las instalaciones de la empresa
                            9) El no uso de los equipos de protección personal asignados según el sitio de trabajo o dentro de la prestación de su servicio, así como el desobedecer las órdenes e incumplir las normas y políticas de salud ocupacional y/o seguridad industrial.
                            10) El Solicitar créditos, préstamos de dinero o de cualquier otro bien a los asociados o personas que tengan vínculo directo con la Cooperativa
                            11) El recibir visitas personales o el trato confianzudo o excesivo con las personas durante el cumplimiento de la jornada laboral.
                            12) Por encontrar en poder del TRABAJADOR o en lugar destinado a guardar sus elementos de trabajo, sin autorización alguna, herramientas, materias primas, objetos de producción y demás elementos que no le pertenecen.
                            13) Por ordenar, incitar, realizar o participar en cualquier cese ilegal en el trabajo.
                            14) El incumplimiento por parte del TRABAJADOR de las instrucciones e indicaciones que le imparta el EMPLEADOR o sus representantes para la ejecución de las labores ejecutadas al servicio de este.
                            15) La ocurrencia de cualquier acto de violencia, injuria, malos tratamientos o irrespeto injustificado por parte de EL TRABAJADOR hacia sus superiores, funcionarios de la Cooperativa o a terceros, dentro de las instalaciones de la Cooperativa o de las instalaciones donde ejerza su actividad o fuera de ellas, pero en este último caso en cumplimiento de sus funciones
                            16) Negociar la información de la Cooperativa para beneficio personal o de terceros, o bienes materiales de propiedad del EMPLEADOR.
                            17) Autorizar o ejecutar sin ser de su competencia, actividades que afecten los intereses del EMPLEADOR.
                            18) Valerse del nombre del EMPLEADOR o de las labores encomendadas por este para emprender, respaldar o acreditar negocios particulares o actividades comerciales personales.
                            19) Presentar cuentas de gastos ficticios o reportar como cumplidas tareas no efectuadas.
                            20) El uso indebido de papelería, documentos o similares en las labores que desempeñe y que sean suministrados por el EMPLEADOR.
                            21) La violación a las especiales obligaciones y prohibiciones contempladas en el presente contrato.
                            22) El no aceptar las asignaciones de trabajo.
                            23) Revelar secretos, fórmulas, sistemas, procedimientos y demás datos reservados de la Cooperativa.
                            24) No utilización por parte del TRABAJADOR del equipo de seguridad y elementos de trabajo asignados o suministrados por la Cooperativa que ponga en peligro su integridad, o la de sus compañeros.
                            25) Por la revelación de secretos, fórmulas, sistemas, procedimientos y demás datos reservados del empleador, aún por primera vez.
                            26) Solicitar dádivas, o préstamos de dinero a los asociados o compañeros de labor.
                            27) Todo acto inmoral o delictuoso que cometa el TRABAJADOR durante el desempeño de sus labores en contra de la Cooperativa, EMPLEADOR o sus compañeros de trabajo.
                            28) La alteración, modificación, ocultamiento o simulación de los informes de trabajo reportados por sus representantes.
                            29) La omisión por parte del TRABAJADOR de cualquier información requerida por la empresa.
                            30) Por dejar de marcar su tarjeta de control, timbrar la de otro TRABAJADOR o sustituir a este en cualquier irregularidad o sin autorización previa.
                            31) Por la sustracción de cualquier objeto que no le pertenezca.
                            32) Por abandonar el sitio de trabajo, sin permiso de las personas que tiene a su cargo la disciplina
                            33) Por la no asistencia a una sesión completa de la jornada de trabajo o más, sin excusa suficiente a juicio de la Cooperativa.
                            34) Por la pugnacidad, desavenencia o falta de entendimiento del TRABAJADOR con algunas de las personas que laboran en la misma Cooperativa y que a juicio de los directivos de este, pueda lesionar la marcha armónica de las labores.
                            35) Retirar de las oficinas archivos, documentos, elementos o dar a conocer cualquier documento, sin autorización expresa para ello.
                            36) No cumplir con las normas del SISTEMA DE GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO SG-SST del EMPLEADOR.
                            37) Las partes califican como falta grave a las obligaciones y deberes del TRABAJADOR, la modificación o uso indebido de la información contenida en el comprobante de pago o en certificaciones laborales.
                            38) El incumplimiento por parte del TRABAJADOR a las normas de administración y protección de datos en perjuicio del EMPLEADOR.
                            39) La extralimitación de funciones que afecten o pongan en peligro los intereses de EL EMPLEADOR.
                            40) La violación de la reserva de aspectos confidenciales puestos bajo la responsabilidad de EL TRABAJADOR o conocidos por éste debido a su cargo.
                            41) La realización de actos que en cualquier forma entorpezcan o incidan negativamente en el normal desarrollo de las actividades patronales o en perjuicios de terceros.
                            42) O la ocurrencia de faltantes o descuadres en dinero o el extravío, destrucción, deterioro o pérdida de documentos o elementos bajo la responsabilidad o en poder de EL TRABAJADOR, siempre que no se dé una causa justificada a juicio de EL EMPLEADOR.
                            43) El uso indebido por acción, omisión, error, negligencia o descuido de la firma autorizada, que incida negativamente contra los intereses de Cooperativa, o los ponga en peligro.
                            ${punto44Original}
                            45) callar u ocultar errores en la liquidación de los pagos que reciba con el fin de obtener un provecho.
                            46) Asimismo el incurrir en las faltas que se califiquen como graves en manuales, instructivos, memorandos, reglamentos y demás documentos que contengan reglamentaciones, circulares normativas y demás documentos relacionados.
                            47) Expresamente se califican como faltas graves en este presente contrato, el reglamento interno de trabajo, circulares normativas, políticas, anexos, términos de referencia, memorandos, los cuales hacen parte integral de este contrato.
                            48) Se consideran faltas graves las establecidas por parte del EMPLEADOR en reglamentos y demás documentos que contengan reglamentaciones, órdenes, instrucciones o prohibiciones de carácter general o particular, pactos, convenciones colectivas, laudos arbitrales y las que expresamente convengan calificar así en escritos que formaran parte integrante del presente contrato.
                            ${punto49Original}
                            50) No dar cumplimiento a las normas contenidas en el Reglamento Interno de Trabajo o por disposición expresa de la Cooperativa, en calidad de EMPLEADOR.
                            51) El incumplimiento al horario de trabajo, teniendo claridad el trabajador que el retardo injustificado es falta grave. En consecuencia, la ocurrencia de cualquiera de estos hechos referidos, faculta al EMPLEADOR para dar por terminado su contrato de trabajo por justa causa de conformidad con el Reglamento Interno de Trabajo y las normas disciplinarias.
                            52) Suministrar información o documentación falsa u omitir información en el proceso de selección o contratación, que pueda generarle un perjuicio al EMPLEADOR.
                            53) El incumplimiento de cualquiera de las obligaciones y prohibiciones especiales establecidas por el Artículo 58 y 60 del Código Sustantivo del Trabajo.
                            54) La realización de actividades en contravención a órdenes superiores o de reglamento, de carácter culposo, o doloso que atenten o incidan negativamente contra los intereses de EL EMPLEADOR o de terceros.
                            55) El grave incumplimiento por parte del TRABAJADOR de las instrucciones, reglamentos y determinaciones de prevención de riesgos, adoptados en forma general o específica, y que se encuentren dentro de los programas de salud ocupacional del EMPLEADOR.
                            PARÁGRAFO PRIMERO. Terminado el contrato por cualquier motivo, es responsabilidad del TRABAJADOR hacer entrega de su cargo a través de un ACTA DE FINALIZACIÓN, en la cual se detallen los asuntos pendientes y se sugieran las acciones que se deban ejecutar para el normal desarrollo de la responsabilidad del cargo. Adicionalmente deberá devolver los bienes, valores, productos y documentos de propiedad de la empresa que le hayan sido confiados, lo mismo que el carnet que lo acredita como empleado
                            PARÁGRAFO SEGUNDO. TERMINACIÓN INTEMPESTIVA DEL CONTRATO DE TRABAJO POR PARTE DEL TRABAJADOR: Se considerará terminación intempestiva del contrato de trabajo por parte del TRABAJADOR, la falta de este al trabajo sin permiso o sin justa causa comprobada a juicio de la Cooperativa, caso en el cual EL EMPLEADOR solamente se limitará a aceptar dicha terminación y proceder al pago de las prestaciones sociales correspondientes.
                            PARÁGRAFO TERCERO: De igual manera el contrato de trabajo termina por mandato legal en los términos del Art. 5º Literal I) de la Ley 50 de 1990, cuando el TRABAJADOR no regrese a su labor al desaparecer la causa de suspensión del contrato.`;

                // ✅ Solo se tocan los puntos 44 y 49 cuando esDiscapacidad es true; el resto del texto queda intacto
                if (esDiscapacidad) {
                    base = base
                        .replace(punto44Original, punto44Discapacidad)
                        .replace(punto49Original, punto49Discapacidad);

                    base = base.replace(
                        'PARÁGRAFO TERCERO: De igual manera el contrato de trabajo termina por mandato legal en los términos del Art. 5º Literal I) de la Ley 50 de 1990, cuando el TRABAJADOR no regrese a su labor al desaparecer la causa de suspensión del contrato.',
                        `PARÁGRAFO TERCERO: De igual manera el contrato de trabajo termina por mandato legal en los términos del Art. 5º Literal I) de la Ley 50 de 1990, cuando el TRABAJADOR no regrese a su labor al desaparecer la causa de suspensión del contrato.
                        PARÁGRAFO CUARTO JUSTA CAUSA OBJETIVA. En el evento en que el TRABAJADOR incurra en una falta grave calificada como justa causa de despido en la ley, el Reglamento Interno de Trabajo o el presente contrato, EL EMPLEADOR adelantará el debido proceso disciplinario garantizando el derecho a la defensa. De comprobarse la falta, se solicitará autorización previa al inspector del trabajo en los eventos en que la ley o la jurisprudencia vigentes lo exijan; en los demás casos, la terminación con justa causa comprobada procederá previo agotamiento del procedimiento disciplinario previsto en el artículo 115 del C.S.T., modificado por la Ley 2466 de 2025, con los ajustes razonables de comunicación que garanticen la comprensión recíproca y el debido proceso del TRABAJADOR.`
                    );
                }
                return base;
            })(),
            orden: 14
        },
        {
            titulo: 'DÉCIMA QUINTA. PARTE EN LA RELACIÓN LABORAL',
            contenido: `El TRABAJADOR acepta y reconoce que la relación laboral emanada de los servicios a que se refiere el presente contrato solo existe entre él como TRABAJADOR y La Cooperativa, como EMPLEADORA y por consiguiente todas las obligaciones que surjan o tengan relación con la prestación de los servicios personales del TRABAJADOR estará a cargo de esta Cooperativa.`,
            orden: 15
        },
        {
            titulo: 'DÉCIMA SEXTA. OBLIGACIÓN DE INFORMAR CAMBIO DE DOMICILIO Y ACTUALIZAR DATOS',
            contenido: `El TRABAJADOR para todos los efectos se compromete a informar al EMPLEADOR cualquier cambio en su dirección de residencia, teléfonos, contactos, teniéndose en todo caso como suya la dirección registrada en este contrato o la que el TRABAJADOR haya informado con posterioridad por medio escrito. Toda comunicación o notificación que el EMPLEADOR deba hacer al TRABAJADOR por virtud del desarrollo, ejecución o terminación de este contrato, se considera legal y válida si se hace a la última dirección de residencia que el TRABAJADOR haya registrado o que se le entregue personalmente en las instalaciones de la Cooperativa, en este último caso dejando el TRABAJADOR constancia por medio de su firma de haberla recibido. El incumplimiento a esta obligación exime al EMPLEADOR de toda responsabilidad derivada de la especial regulación contemplada la Ley 789 de 2002 y demás normas concordantes.`,
            orden: 16
        },
        {
            titulo: 'DÉCIMA SEPTIMA. EFICACIA',
            contenido: confianzaManejo
                ? `El presente contrato sustituye las condiciones del contrato anterior en cuanto a cargo, funciones, remuneración, como trabajador de dirección, confianza y manejo, manteniéndose la continuidad de la relación laboral para todos los efectos legales. De la misma manera las partes dejan expresa constancia de su acuerdo bilateral y consensual de regir la relación laboral en todas las circunstancias por las normas establecidas en la legislación laboral para los contratos sin que les pueda ser aplicable ninguna otra norma diferente.`
                : tipoContrato === 'INDEFINIDO' && (esAscenso || esCambioModalidad)
                    ? `El presente contrato sustituye las condiciones del contrato anterior únicamente en cuanto a su modalidad, manteniéndose la continuidad de la relación laboral para todos los efectos legales. De la misma manera las partes dejan expresa constancia de su acuerdo bilateral y consensual de regir la relación laboral en todas las circunstancias por las normas establecidas, Este contrato se rige por la Constitución Política, el Código Sustantivo del Trabajo, la Ley 2466 de 2025 y demás normas laborales vigentes.`
                    : `El presente contrato regula la relación laboral entre las partes durante su vigencia, sin perjuicio de los derechos causados con anterioridad en caso de existir una vinculación previa, este contrato se rige por la Constitución Política, el Código Sustantivo del Trabajo, la Ley 2466 de 2025 y demás normas laborales vigentes.`,
            orden: 17
        },
        {
            titulo: 'DÉCIMA OCTAVA. LUGAR DE PRESTACIÓN DEL SERVICIO',
            contenido: `EL TRABAJADOR es contratado para prestar sus servicios en el lugar mencionado en el encabezado de este contrato, pero el EMPLEADOR podrá asignarle otras funciones y trasladarlo a cualquiera de las oficinas o agencias establecidas o que se establezcan en esta u otras ciudades del país en forma temporal o definitiva de acuerdo con la necesidad o conveniencia del servicio.`,
            orden: 18
        },
        {
            titulo: 'DECIMA NOVENA. DISPOSICIONES VARIAS',
            contenido: `Frente a los temas no mencionados anteriormente se establecen las siguientes disposiciones:

                        NOTIFICACIONES: Las partes aceptan de manera expresa que cualquiera de los datos personales suministrados en la parte superior del presente contrato son medios aptos, idóneos y aceptados por cada una de ellas para efectos de notificaciones, siendo el correo electrónico personal o corporativo de EL TRABAJADOR el medio más expedito por el cual el TRABAJADOR recibirá comunicaciones, notificaciones, citaciones a descargos, notificación de terminación del contrato y las que llegase a formular el EMPLEADOR. En el evento de requerirse el reenvió de una documentación firmada o suscrita por EL TRABAJADOR, con destino y a solicitud del EMPLEADOR, se entenderá aceptada y/o notificada por el solo hecho de ser enviada al correo electrónico del TRABAJADOR. El TRABAJADOR se obliga a actualizar por escrito los datos que hayan variado con relación a los aportados al momento de su ingreso a más tardar dentro de los diez (10) días hábiles siguientes a la fecha en la que se genera la novedad en la información. De manera expresa, libre y voluntaria el TRABAJADOR acepta y autoriza al EMPLEADOR para que le sea remitido y notificado al correo electrónico que éste informó y que se consignó en la parte superior del presente contrato y/o que de manera escrita actualice posteriormente de conformidad con lo establecido en las Cláusulas, cualquier tipo de información o comunicación relacionada con el contrato de trabajo incluyendo la finalización o terminación de éste.

                        PARÁGRAFO PRIMERO: Domicilio Contractual: Para los efectos de este Contrato, las partes aceptan y reconocen como domicilio contractual la ciudad o municipio especificado en el cuadro de datos inicial.

                        PARÁGRAFO SEGUNDO. El trabajador manifiesta que ha sido informado sobre el carácter reservado de la información relacionada con su estado de salud y su historia clínica, en los términos del artículo 34 de la Ley 23 de 1981 y demás normas concordantes. En tal sentido, autoriza de manera previa, expresa e informada a COOPSERP COLOMBIA para tratar sus datos personales sensibles relacionados con su estado de salud, exclusivamente para fines asociados al cumplimiento de obligaciones legales y contractuales en el marco de la relación laboral, particularmente en materia de seguridad y salud en el trabajo, evaluación de aptitud laboral, gestión de incapacidades y demás actividades estrictamente necesarias. En todo caso, COOPSERP COLOMBIA se obliga a garantizar la confidencialidad, seguridad y uso restringido de dicha información, conforme a la Ley 1581 de 2012 y demás normas aplicables, circunscribiendo el acceso a la historia clínica completa únicamente a los eventos expresamente autorizados por la ley.
                        ${esDiscapacidad ? `
                        PARÁGRAFO TERCERO: EL TRABAJADOR aportará al EMPLEADOR la certificación de discapacidad expedida por el Ministerio de Salud y Protección Social o la entidad competente, con el único propósito de acreditar dicha condición para efectos del cumplimiento de obligaciones legales, reportes estadísticos o requerimientos de las autoridades competentes. EL TRABAJADOR declara que la información suministrada será veraz, completa y actualizada, y se compromete a informar oportunamente cualquier modificación relacionada con su condición de discapacidad. EL EMPLEADOR reportará el presente contrato al Ministerio del Trabajo dentro de los quince (15) días siguientes a su celebración, a través del sitio electrónico dispuesto para el efecto, información sobre la cual se mantendrá reserva. Asimismo, en caso de contar con adjudicación de apoyos transitorios o permanentes y/o con la implementación de salvaguardas de conformidad con la Ley 1996 de 2019, informará tal circunstancia al EMPLEADOR y allegará los documentos que la acrediten, exclusivamente para facilitar la formalización y ejecución de los actos jurídicos relacionados con la presente relación laboral.

                        CONSTANCIA DE ACCESIBILIDAD. Las partes dejan constancia de que el contenido del presente contrato fue leído y explicado al TRABAJADOR con los ajustes razonables de comunicación necesarios para garantizar su plena comprensión, y de que este manifestó entenderlo y aceptarlo, actuando con plena capacidad legal en los términos de la Ley 1996 de 2019 y, de ser el caso, con los apoyos formalizados que hubiere informado.`
                    : ''}`,
            orden: 19
        }
    ];

    // ==================== CLAUSULAS ESPECÍFICAS ====================
    let clausulasEspecificas = [];

    // --- TÉRMINO INDEFINIDO ---
    if (tipoContrato === 'INDEFINIDO') {
        clausulasEspecificas = [
            {
                titulo: 'CONTINUIDAD LABORAL',
                contenido: `Las partes dejan expresa constancia de que el presente contrato a término indefinido no constituye una nueva relación laboral autónoma, sino que corresponde a la continuidad de la relación laboral previamente existente entre el TRABAJADOR y el EMPLEADOR, la cual se encontraba regida por un contrato de trabajo a término fijo. En consecuencia, para todos los efectos legales, incluidos, pero sin limitarse a antigüedad, prestaciones sociales, vacaciones, indemnizaciones y demás derechos laborales, se entenderá que la vinculación del TRABAJADOR ha sido continua, sin solución de continuidad entre el contrato anterior y el presente, en aplicación de lo dispuesto en el Código Sustantivo del Trabajo y la jurisprudencia aplicable.`,
                orden: 0
            },
            {
                titulo: 'SEGUNDA. DURACIÓN DEL CONTRATO',
                contenido: `Este contrato se entiende celebrado a término indefinido, y por lo tanto durará mientras subsistan las causas que le dieron origen y la materia del trabajo.`,
                orden: 2
            },
            {
                titulo: 'TERCERA. PERIODO DE PRUEBA',
                contenido: (esAscenso || esCambioModalidad)
                    ? `Las partes acuerdan que no habrá lugar a período de prueba, por cuanto el presente contrato no constituye una nueva vinculación laboral sino la continuidad de la relación de trabajo existente entre EL EMPLEADOR y EL TRABAJADOR, quien asume un nuevo cargo como consecuencia de un ascenso o cambio del cargo dentro de la Cooperativa, en consecuencia, se mantendrá para todos los efectos legales la antigüedad laboral previamente reconocida, sin solución de continuidad.`
                    : `Las partes acuerdan establecer un período de prueba de dos (2) meses, el cual iniciará a partir de la firma del presente contrato, de conformidad con lo establecido en el artículo 78 del Código Sustantivo del Trabajo. Durante este lapso, cualquiera de las partes podrá dar por terminado el contrato unilateralmente en cualquier momento, sin previo aviso y sin que haya lugar al pago de indemnización alguna.`,
                orden: 3
            },
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
- Fase lectiva: salud y riesgos laborales, pagados en su totalidad por la empresa.
- Fase práctica: salud, pensión y riesgos laborales, pagado conforme al régimen de trabajadores dependientes.
Formación dual
- Afiliación y cotización al sistema general de seguridad social en salud, pensión y riesgos laborales, así como el derecho a prestaciones, auxilios, y demás derechos propios de un contrato de trabajo.
Estudiante universitario
- La afiliación al sistema de seguridad social depende la etapa: fase lectiva se surte la afiliación a salud y riesgos laborales; para fase práctica, salud, pensiones y riesgos laborales, así como el, así como el derecho a prestaciones, auxilios, y demás derechos propios de un contrato de trabajo.`,
                orden: 6
            },
            {
                titulo: 'SÉPTIMA – DERECHOS LABORALES EN LA ETAPA PRÁCTICA',
                contenido: `Durante la etapa práctica o durante toda la formación dual, EL APRENDIZ tendrá derecho al reconocimiento y pago a cargo de la EMPRESA PATROCINADORA de todas las prestaciones, auxilios y demás derechos propios del contrato laboral, incluyendo:
- Prima de servicios
- Cesantías e intereses
- Vacaciones
- Dotación
- Auxilio de transporte
- Subsidio familiar
- Pago de horas extra, nocturnas y en días festivos (cuando aplique)`,
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
        const fechaInicioFormateada = formatearFechaLarga(fechaInicio);
        const fechaFinFormateada = formatearFechaLarga(fechaFin);
        let diasPrueba = '';
        if (terminoInicial) {
            const match = terminoInicial.match(/(\d+)/);
            if (match) {
                const diasTotales = parseInt(match[1]);
                let quintaParte = Math.ceil(diasTotales / 5);
                quintaParte = Math.min(quintaParte, 60);
                diasPrueba = `${quintaParte} días`;
            }
        }

        const duracionContratoBase = `El presente contrato se celebra a término fijo por el término de ${terminoInicial || 'XXXXXXXXX'}, contados a partir del día ${fechaInicioFormateada} hasta el día ${fechaFinFormateada}. De conformidad con el artículo 46 del Código Sustantivo del Trabajo, modificado por la Ley 2466 de 2025, el presente contrato podrá ser prorrogado por acuerdo de las partes o renovarse automáticamente cuando ninguna de ellas manifieste por escrito su intención de darlo por terminado con una antelación no inferior a treinta (30) días calendario a la fecha de su vencimiento. La renovación automática se efectuará por un término igual al inicialmente pactado o al de su prórroga, según corresponda, sin que la duración total del contrato, incluidas sus prórrogas, exceda de cuatro (4) años.`;

        const duracionContratoDiscapacidad = `${duracionContratoBase}
PARÁGRAFO ÚNICO. ADVERTENCIA DE TEMPORALIDAD Y NOTA DE CONDICIÓN MÉDICA PREEXISTENTE: Las partes declaran de manera expresa, libre e inequívoca las siguientes condiciones especiales que rigen el presente vínculo:
a) CONOCIMIENTO PREVIO Y NOTA DE LA CONDICIÓN: EL EMPLEADOR manifiesta que conoce plenamente y desde el inicio de la relación laboral la condición médica y/o discapacidad del TRABAJADOR descrita en el cabezote, la cual se encuentra debidamente soportada con el Certificado de Discapacidad legal. La condición de discapacidad se acredita exclusivamente mediante el Certificado de Discapacidad expedido conforme a la Resolución 1197 de 2024 del Ministerio de Salud y Protección Social, sin que se consigne en este contrato diagnóstico ni detalle clínico alguno; dicha información sensible reposará únicamente en la historia clínica ocupacional, bajo custodia del médico del trabajo (Resolución 1843 de 2025). La evaluación médica ocupacional de ingreso servirá de línea de base con el fin de vigilar médicamente que las labores asignadas no generen un agravamiento o aumento de la situación de salud del trabajador.
b) PACTO DE TEMPORALIDAD: Ambas partes aceptan que la necesidad que da origen a este contrato es estrictamente temporal y limitada al plazo pactado. En consecuencia, la llegada de la fecha de vencimiento acordada se pacta de común acuerdo como una CAUSA OBJETIVA DE TERMINACIÓN del vínculo laboral, de carácter estrictamente contractual y desligada por completo de la condición de discapacidad del TRABAJADOR, por lo que la no renovacion o terminacion del contrato al vencimiento de su plazo es consecuencia directa del pacto temporalidad.`;

        clausulasEspecificas = [
            {
                titulo: 'SEGUNDA. DURACIÓN DEL CONTRATO',
                contenido: esDiscapacidad ? duracionContratoDiscapacidad : duracionContratoBase,
                orden: 2
            },
            {
                titulo: 'TERCERA. PERIODO DE PRUEBA',
                contenido: (esAscenso || esCambioModalidad)
                    ? `Las partes acuerdan que no habrá lugar a período de prueba, por cuanto el presente contrato no constituye una nueva vinculación laboral sino la continuidad de la relación de trabajo existente entre EL EMPLEADOR y EL TRABAJADOR, quien asume un nuevo cargo como consecuencia de un ascenso o cambio del cargo dentro de la Cooperativa, en consecuencia, se mantendrá para todos los efectos legales la antigüedad laboral previamente reconocida, sin solución de continuidad.`
                    : `Las partes acuerdan como periodo de prueba el término de ${diasPrueba || 'XXXXXXXXX'}, el cual no podrá exceder la quinta parte del término inicialmente pactado ni ser superior a dos (2) meses, conforme al artículo 76 del Código Sustantivo del Trabajo.`,
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

            const estadoContrato = data.estado || 'ACTIVO';

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
                    practica_fin,
                    numero_cuenta_bancaria,
                    nombre_banco,
                    tipo_cuenta,
                    es_discapacitado,
                    numero_certificado_discapacidad,
                    fecha_expedicion_discapacidad
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                estadoContrato,
                data.numero_grupo || null,
                data.centro_formacion || null,
                data.especialidad || null,
                data.instituto_formacion || null,
                data.otro_instituto || null,
                data.usuario_creacion || 'SISTEMA',
                data.electiva_inicio || null,
                data.electiva_fin || null,
                data.practica_inicio || null,
                data.practica_fin || null,
                data.numero_cuenta_bancaria || null,
                data.nombre_banco || null,
                data.tipo_cuenta || 'AHORROS',
                data.es_discapacitado || null,
                data.numero_certificado_discapacidad || null,
                data.fecha_expedicion_discapacidad || null
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

            // ============ DATOS DEL FUNCIONARIO ============
            const funcionarioData = {
                numero_cuenta: data.numero_cuenta_bancaria || null,
                nombre_banco: data.nombre_banco || null,
                tipo_cuenta: data.tipo_cuenta || 'AHORROS'
            };

            const esDiscapacitado = data.es_discapacitado || false;

            // 2. Insertar cláusulas según tipo de contrato
            const clausulas = obtenerClausulasPorTipo(
                data.tipo_contrato,
                data.fecha_inicio,
                data.fecha_fin,
                data.termino_inicial,
                data.cargo,
                datosAprendiz,
                funcionarioData,
                data.confianzaManejo || data.confianza_manejo || false,
                data.esAscenso || false,
                data.esCambioModalidad || false,
                esDiscapacitado
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
            c.motivo_anulado,
            c.fecha_modificacion,
            c.es_discapacitado,
            c.numero_certificado_discapacidad,
            c.fecha_expedicion_discapacidad,

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

    cambiarModalidadAIndefinido: async (idContrato, idPosicion, usuarioCreacion, nuevoNumeroContrato, confianzaManejo = false, esAscenso = false, esCambioModalidad = true) => {
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
                    usuario_creacion,
                    numero_cuenta_bancaria,
                    nombre_banco,
                    tipo_cuenta
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                usuarioCreacion,
                contratoActual[0].numero_cuenta_bancaria || 'ERROR',
                contratoActual[0].nombre_banco || 'ERROR',
                contratoActual[0].tipo_cuenta || 'AHORROS'
            ];

            const [resultadoInsert] = await connection.query(queryNuevoContrato, valoresNuevoContrato);
            const nuevoContratoId = resultadoInsert.insertId;

            // 6. INSERTAR CLÁUSULAS DEL CONTRATO INDEFINIDO
            const datosAprendiz = {};

            const funcionarioData = {
                numero_cuenta: contratoActual[0].numero_cuenta_bancaria || 'ERROR',
                nombre_banco: contratoActual[0].nombre_banco || 'ERROR',
                tipo_cuenta: contratoActual[0].tipo_cuenta || 'AHORROS'
            };

            const clausulas = obtenerClausulasPorTipo(
                'INDEFINIDO',
                fechaInicio,
                null,
                null,
                posicion[0].nombre_cargo,
                datosAprendiz,
                funcionarioData,
                confianzaManejo,
                esAscenso,
                esCambioModalidad
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

    anular: async (id, data) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { motivo, usuario_anulacion } = data;

            // Obtener el contrato para verificar su estado actual
            const [contrato] = await connection.query(
                'SELECT estado FROM contratos WHERE id_contrato = ?',
                [id]
            );

            if (!contrato[0]) {
                throw new Error('Contrato no encontrado');
            }

            // Actualizar el contrato a estado ANULADO con motivo
            await connection.query(`
            UPDATE contratos 
            SET estado = 'ANULADO',
                motivo_anulado = ?,
                fecha_modificacion = NOW()
            WHERE id_contrato = ?
        `, [
                motivo || 'Anulado por el usuario',
                id
            ]);

            await connection.commit();

            return {
                id_contrato: id,
                estado: 'ANULADO',
                motivo: motivo || 'Anulado por el usuario',
                fecha_anulacion: new Date()
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