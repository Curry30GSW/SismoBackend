const pool = require('../config/ConectDb');
const PersonaModel = require('../models/personaModel');

const personaController = {
    // POST /
    async crear(req, res) {
        const conn = await pool.getConnection();
        try {
            const {
                cedula, nombre, apellidos, tipoSangre, fechaNacimiento,
                gestante, discapacidad, medicamento,
                nombreContacto, telefonoContacto, direccion,
            } = req.body;

            if (!cedula || !nombre || !apellidos) {
                return res.status(400).json({ error: 'cedula, nombre y apellidos son obligatorios' });
            }

            if (await PersonaModel.existePorCedula(cedula, conn)) {
                return res.status(409).json({ error: 'Ya existe una persona registrada con esa cédula' });
            }

            await conn.beginTransaction();

            const fotoUrl = req.file ? `/uploads/${req.file.filename}` : null;

            const id = await PersonaModel.crear(
                {
                    cedula, nombre, apellidos, tipoSangre, fechaNacimiento,
                    gestante, discapacidad, medicamento, foto: fotoUrl,
                },
                conn
            );

            if (nombreContacto || telefonoContacto || direccion) {
                await PersonaModel.crearContacto(
                    id,
                    { nombreContacto, telefonoContacto, direccion },
                    conn
                );
            }

            await conn.commit();
            res.status(201).json(await PersonaModel.obtenerCompleta(id));
        } catch (err) {
            await conn.rollback();
            console.error(err);
            res.status(500).json({ error: 'Error al crear la persona' });
        } finally {
            conn.release();
        }
    },

    // GET /
    async listar(req, res) {
        try {
            res.json(await PersonaModel.listar());
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al listar personas' });
        }
    },

    // GET /:id  (ruta pública del QR)
    async obtener(req, res) {
        try {
            const persona = await PersonaModel.obtenerCompleta(req.params.id);
            if (!persona) return res.status(404).json({ error: 'Persona no encontrada' });
            res.json(persona);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener persona' });
        }
    },

    // GET /cedula/:cedula
    async obtenerPorCedula(req, res) {
        try {
            const id = await PersonaModel.obtenerIdPorCedula(req.params.cedula);
            if (!id) return res.status(404).json({ error: 'Persona no encontrada' });
            res.json(await PersonaModel.obtenerCompleta(id));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al buscar persona' });
        }
    },

    // PUT /:id
    async actualizar(req, res) {
        try {
            const campos = { ...req.body };
            if (req.file) campos.foto = `/uploads/${req.file.filename}`;
            if (campos.gestante !== undefined) {
                campos.gestante = campos.gestante === 'true' || campos.gestante === true;
            }

            const affected = await PersonaModel.actualizar(req.params.id, campos);
            if (affected === 0) return res.status(404).json({ error: 'Persona no encontrada' });

            res.json(await PersonaModel.obtenerCompleta(req.params.id));
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al actualizar persona' });
        }
    },

    // DELETE /:id
    async eliminar(req, res) {
        try {
            const affected = await PersonaModel.eliminar(req.params.id);
            if (affected === 0) return res.status(404).json({ error: 'Persona no encontrada' });
            res.json({ ok: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al eliminar persona' });
        }
    },
};

module.exports = personaController;