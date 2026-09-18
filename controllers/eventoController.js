const EventoModel = require('../models/eventoModel');
const PersonaModel = require('../models/personaModel');

const eventoController = {
    // POST /
    async crear(req, res) {
        try {
            const { nombre, descripcion, magnitud, ubicacion } = req.body;
            if (!nombre) return res.status(400).json({ error: 'El nombre del evento es obligatorio' });

            const evento = await EventoModel.crear({ nombre, descripcion, magnitud, ubicacion });
            res.status(201).json(evento);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al crear el evento' });
        }
    },

    // GET /
    async listar(req, res) {
        try {
            res.json(await EventoModel.listar());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar eventos' });
        }
    },

    // GET /activos
    async listarActivos(req, res) {
        try {
            res.json(await EventoModel.listarActivos());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar eventos activos' });
        }
    },

    // GET /:id
    async obtener(req, res) {
        try {
            const evento = await EventoModel.obtenerPorId(req.params.id);
            if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
            res.json(evento);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener evento' });
        }
    },

    // PUT /:id
    async actualizarActivo(req, res) {
        try {
            const affected = await EventoModel.actualizarActivo(req.params.id, req.body.activo);
            if (affected === 0) return res.status(404).json({ error: 'Evento no encontrado' });
            res.json(await EventoModel.obtenerPorId(req.params.id));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al actualizar evento' });
        }
    },

    // POST /:id/reportar
    async reportar(req, res) {
        try {
            const { cedula, personaId, estado, comentario } = req.body;

            const evento = await EventoModel.obtenerPorId(req.params.id);
            if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
            if (!evento.activo) return res.status(400).json({ error: 'Este evento ya está cerrado' });

            const persona = personaId
                ? await PersonaModel.buscarPorIdSimple(personaId)
                : await PersonaModel.buscarPorCedulaSimple(cedula);

            if (!persona) {
                return res.status(404).json({ error: 'No se encontró una persona con esa cédula' });
            }

            const estadoFinal = estado === 'necesita_ayuda' ? 'necesita_ayuda' : 'bien';

            await EventoModel.reportar(req.params.id, persona.id, estadoFinal, comentario);

            res.json({
                personaId: persona.id,
                cedula: persona.cedula,
                nombre: persona.nombre,
                apellidos: persona.apellidos,
                estado: estadoFinal,
                comentario: comentario || '',
                fecha: new Date().toISOString(),
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al registrar el reporte' });
        }
    },

    // GET /:id/resumen
    async resumen(req, res) {
        try {
            const evento = await EventoModel.obtenerPorId(req.params.id);
            if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

            const totalPersonas = await PersonaModel.contarTodas();
            const reportes = await EventoModel.obtenerReportes(req.params.id);
            const pendientes = await EventoModel.obtenerPendientes(req.params.id);

            res.json({
                evento: {
                    id: evento.id,
                    nombre: evento.nombre,
                    activo: evento.activo,
                    fecha: evento.fecha,
                },
                totalPersonas,
                totalReportados: reportes.length,
                reportadosBien: reportes.filter((r) => r.estado === 'bien').length,
                necesitanAyuda: reportes.filter((r) => r.estado === 'necesita_ayuda').length,
                reportes,
                pendientes,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener el resumen' });
        }
    },
};

module.exports = eventoController;