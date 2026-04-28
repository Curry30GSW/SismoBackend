const asociacionesModel = require('../../models/plantaCargos/asociacionesModel');

const limpiarEspacios = (data) => {
    if (!data || data.length === 0) return data;

    return data.map(item => {
        const itemLimpio = {};

        for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'string') {
                itemLimpio[key] = value.trim();
            } else {
                itemLimpio[key] = value;
            }
        }

        return itemLimpio;
    });
};

const obtenerAsociacionesNetas = async (req, res) => {
    try {
        const { mes, anio } = req.query;

        // Preparar opciones para el modelo
        const options = {};
        if (mes && anio) {
            options.mes = parseInt(mes);
            options.anio = parseInt(anio);
        }

        // Llamar al modelo con las opciones
        let data = await asociacionesModel.getAsociacionesNetas(options);

        // Limpiar espacios en blanco
        data = limpiarEspacios(data);

        // 🔥 Calcular el período que realmente se consultó (mes vencido)
        let periodoConsultado;
        if (mes && anio) {
            const mesVencido = asociacionesModel.calcularMesVencido(parseInt(mes), parseInt(anio));
            periodoConsultado = {
                mes_solicitado: parseInt(mes),
                anio_solicitado: parseInt(anio),
                mes_consultado: mesVencido.mes,
                anio_consultado: mesVencido.anio,
                nombreLibreria: asociacionesModel.getNombreLibreria(mesVencido.mes, mesVencido.anio)
            };
        } else {
            const mesVencidoActual = asociacionesModel.getMesVencidoActual();
            periodoConsultado = {
                mes_consultado: mesVencidoActual.mes,
                anio_consultado: mesVencidoActual.anio,
                nombreLibreria: mesVencidoActual.nombreLibreria,
                mensaje: 'Consulta automática del mes vencido'
            };
        }

        res.json({
            ok: true,
            data,
            total: data.length,
            periodo: periodoConsultado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            message: 'Error al obtener asociaciones netas',
            error: error.message
        });
    }
};

module.exports = {
    obtenerAsociacionesNetas
};