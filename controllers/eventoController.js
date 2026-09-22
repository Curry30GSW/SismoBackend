const EventoModel = require('../models/eventoModel');
const PersonaModel = require('../models/personaModel');
const pool = require('../config/ConectDb');

const eventoController = {
    // POST /  (admin)
    async crear(req, res) {
        try {
            const { nombre, descripcion, magnitud } = req.body;
            if (!nombre) return res.status(400).json({ error: 'El nombre del evento es obligatorio' });

            const evento = await EventoModel.crear({ nombre, descripcion, magnitud });
            res.status(201).json(evento);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al crear el evento' });
        }
    },

    async listar(req, res) {
        try {
            res.json(await EventoModel.listar());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar eventos' });
        }
    },

    async listarActivos(req, res) {
        try {
            res.json(await EventoModel.listarActivos());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar eventos activos' });
        }
    },

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

    // ─────────────────────────────────────────────────────────────
    // 🔓 ENDPOINTS PÚBLICOS (sin login, accesibles por token)
    // ─────────────────────────────────────────────────────────────

    // GET /publico/:token
    // Devuelve la info del evento para la página pública
    async obtenerPorToken(req, res) {
        try {
            const evento = await EventoModel.obtenerPorToken(req.params.token);
            if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
            if (!evento.activo || !evento.activoReporte) {
                return res.status(400).json({ error: 'Este evento ya está cerrado' });
            }

            res.json({
                id: evento.id,
                nombre: evento.nombre,
                descripcion: evento.descripcion,
                magnitud: evento.magnitud,
                fecha: evento.fecha,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener el evento' });
        }
    },

    // POST /publico/:token/reportar
    // Body: { cedula, estado, comentario?, ubicacion?, detalle? }
    async reportarPublico(req, res) {
        try {
            const evento = await EventoModel.obtenerPorToken(req.params.token);
            if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
            if (!evento.activo || !evento.activoReporte) {
                return res.status(400).json({ error: 'Este evento ya está cerrado' });
            }

            const { cedula, estado, comentario, ubicacion, detalle } = req.body;

            if (!cedula) {
                return res.status(400).json({ error: 'La cédula es obligatoria' });
            }

            if (estado !== 'bien' && estado !== 'necesita_ayuda') {
                return res.status(400).json({ error: 'Estado inválido' });
            }

            if (estado === 'necesita_ayuda' && (!ubicacion || !detalle)) {
                return res.status(400).json({
                    error: 'Si necesitas ayuda, indica tu ubicación y describe tu situación',
                });
            }

            const persona = await PersonaModel.buscarPorCedulaSimple(cedula);
            if (!persona) {
                return res.status(404).json({
                    error: 'No encontramos tu cédula en el sistema. Contacta a un administrador.',
                });
            }

            await EventoModel.reportar(
                evento.id,
                persona.id,
                estado,
                comentario,
                ubicacion,
                detalle
            );

            res.json({
                success: true,
                persona: {
                    nombre: persona.nombre,
                    apellidos: persona.apellidos,
                },
                estado,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al registrar el reporte' });
        }
    },

    // ─────────────────────────────────────────────────────────────
    // ADMIN
    // ─────────────────────────────────────────────────────────────

    async reportar(req, res) {
        try {
            const { cedula, personaId, estado, comentario, ubicacion, detalle } = req.body;

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

            await EventoModel.reportar(
                req.params.id,
                persona.id,
                estadoFinal,
                comentario,
                ubicacion,
                detalle
            );

            res.json({
                personaId: persona.id,
                cedula: persona.cedula,
                nombre: persona.nombre,
                apellidos: persona.apellidos,
                estado: estadoFinal,
                comentario: comentario || '',
                ubicacion: ubicacion || '',
                detalle: detalle || '',
                fecha: new Date().toISOString(),
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al registrar el reporte' });
        }
    },

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