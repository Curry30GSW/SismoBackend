const fs = require('fs');
const path = require('path');
const pool = require('../config/ConectDb');
const PersonaModel = require('../models/personaModel');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');


function renombrarFoto(file, cedula) {
    if (!file) return null;

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cedulaLimpia = String(cedula).replace(/[^a-zA-Z0-9_-]/g, '');
    const nuevoNombre = `foto-${cedulaLimpia}${ext}`;
    const rutaVieja = path.join(UPLOAD_DIR, file.filename);
    const rutaNueva = path.join(UPLOAD_DIR, nuevoNombre);

    try {
        if (fs.existsSync(rutaNueva)) {
            fs.unlinkSync(rutaNueva);
        }
        fs.renameSync(rutaVieja, rutaNueva);
        return `/uploads/${nuevoNombre}`;
    } catch (err) {
        console.error('[renombrarFoto]', err);
        return `/uploads/${file.filename}`;
    }
}


const personaController = {
    // POST /
    async crear(req, res) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const {
                cedula, nombre, apellidos, tipoSangre, fechaNacimiento,
                gestante, semanasGestacion, discapacidad, medicamento,
                direccion,
            } = req.body;

            let contactos = [];
            try {
                contactos = JSON.parse(req.body.contactos || '[]');
            } catch {
                contactos = [];
            }

            if (!Array.isArray(contactos) || contactos.length < 3) {
                await conn.rollback();
                return res.status(400).json({ message: 'Debe registrar al menos 3 contactos.' });
            }

            // 👇 Renombrar la foto a foto-<cedula>.<ext>
            const rutaFoto = renombrarFoto(req.file, cedula);

            // 1. Crear la persona
            const id = await PersonaModel.crear(
                {
                    cedula, nombre, apellidos, tipoSangre, fechaNacimiento,
                    gestante, semanasGestacion, discapacidad, medicamento,
                    direccion,
                    foto: rutaFoto,
                },
                conn
            );

            // 2. Crear todos los contactos
            await PersonaModel.crearContactos(id, contactos, conn);

            await conn.commit();

            const persona = await PersonaModel.obtenerCompleta(id);
            return res.status(201).json(persona);
        } catch (err) {
            await conn.rollback();
            console.error('[persona.crear]', err);
            return res.status(500).json({ message: 'Error al crear la persona.' });
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

            if (req.file) {
                let cedula = campos.cedula;
                if (!cedula) {
                    const actual = await PersonaModel.obtenerCompleta(req.params.id);
                    cedula = actual?.cedula;
                }
                campos.foto = renombrarFoto(req.file, cedula);
            }

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


    async registrarPublico(req, res) {
        const conn = await pool.getConnection();
        try {
            // Validar clave de activación
            const claveEsperada = process.env.CLAVE_REGISTRO_PUBLICO;
            const claveRecibida = req.body.clave || req.query.clave;

            if (!claveEsperada) {
                return res.status(500).json({
                    message: 'El registro público no está configurado.',
                });
            }

            if (claveRecibida !== claveEsperada) {
                return res.status(403).json({
                    message: 'Link de registro inválido o expirado.',
                });
            }

            await conn.beginTransaction();

            const {
                cedula, nombre, apellidos, tipoSangre, fechaNacimiento,
                gestante, semanasGestacion, discapacidad, medicamento,
                direccion,
            } = req.body;

            // Validar campos mínimos
            if (!cedula || !nombre || !apellidos) {
                await conn.rollback();
                return res.status(400).json({
                    message: 'Cédula, nombre y apellidos son obligatorios.',
                });
            }

            // Verificar que no exista
            const yaExiste = await PersonaModel.existePorCedula(cedula, conn);
            if (yaExiste) {
                await conn.rollback();
                return res.status(409).json({
                    message: 'Ya existe una persona registrada con esa cédula.',
                });
            }

            // Parsear contactos
            let contactos = [];
            try {
                contactos = JSON.parse(req.body.contactos || '[]');
            } catch {
                contactos = [];
            }

            if (!Array.isArray(contactos) || contactos.length < 3) {
                await conn.rollback();
                return res.status(400).json({
                    message: 'Debe registrar al menos 3 contactos de emergencia.',
                });
            }

            // Foto
            let rutaFoto = null;
            if (req.file) {
                const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
                const cedulaLimpia = String(cedula).replace(/[^a-zA-Z0-9_-]/g, '');
                const nuevoNombre = `foto-${cedulaLimpia}${ext}`;
                const rutaVieja = path.join(UPLOAD_DIR, req.file.filename);
                const rutaNueva = path.join(UPLOAD_DIR, nuevoNombre);

                try {
                    if (fs.existsSync(rutaNueva)) fs.unlinkSync(rutaNueva);
                    fs.renameSync(rutaVieja, rutaNueva);
                    rutaFoto = `/uploads/${nuevoNombre}`;
                } catch {
                    rutaFoto = `/uploads/${req.file.filename}`;
                }
            }

            // Crear persona
            const id = await PersonaModel.crear(
                {
                    cedula, nombre, apellidos, tipoSangre, fechaNacimiento,
                    gestante, semanasGestacion, discapacidad, medicamento,
                    direccion,
                    foto: rutaFoto,
                },
                conn
            );

            await PersonaModel.crearContactos(id, contactos, conn);
            await conn.commit();

            const persona = await PersonaModel.obtenerCompleta(id);
            return res.status(201).json({
                success: true,
                message: 'Registro exitoso',
                persona,
            });
        } catch (err) {
            await conn.rollback();
            console.error('[persona.registrarPublico]', err);

            // Manejo de cédula duplicada
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    message: 'Ya existe una persona registrada con esa cédula.',
                });
            }

            return res.status(500).json({ message: 'Error al registrar la persona.' });
        } finally {
            conn.release();
        }
    },
};

module.exports = personaController;