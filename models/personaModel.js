const pool = require('../config/ConectDb');
const { v4: uuidv4 } = require('uuid');

const PersonaModel = {
    // Devuelve una persona con TODOS sus contactos
    async obtenerCompleta(id) {
        const [personas] = await pool.query('SELECT * FROM personas WHERE id = ?', [id]);
        if (personas.length === 0) return null;

        const [contactos] = await pool.query(
            `SELECT nombre, telefono, parentesco
             FROM contactos_emergencia
             WHERE persona_id = ?
             ORDER BY id ASC`,
            [id]
        );

        const p = personas[0];
        return {
            id: p.id,
            cedula: p.cedula,
            nombre: p.nombre,
            apellidos: p.apellidos,
            tipoSangre: p.tipo_sangre,
            fechaNacimiento: p.fecha_nacimiento,
            gestante: !!p.gestante,
            semanasGestacion: p.semanas_gestacion ?? null,   // si agregas la columna
            tieneDiscapacidad: p.discapacidad && p.discapacidad !== 'NINGUNA',
            discapacidad: p.discapacidad,
            medicamento: p.medicamento,
            direccion: p.direccion ?? null,                   // si agregas la columna
            foto: p.foto,
            creadoEn: p.creado_en,
            contactos: contactos.map((c) => ({
                nombre: c.nombre,
                telefono: c.telefono,
                parentesco: c.parentesco ?? '',
            })),
        };
    },

    async existePorCedula(cedula, conn = pool) {
        const [rows] = await conn.query('SELECT id FROM personas WHERE cedula = ?', [cedula]);
        return rows.length > 0;
    },

    async crear(datos, conn = pool) {
        const id = uuidv4();
        const {
            cedula, nombre, apellidos, tipoSangre, fechaNacimiento,
            gestante, semanasGestacion, discapacidad, medicamento,
            direccion, foto,
        } = datos;

        const esGestante = gestante === 'true' || gestante === true;

        await conn.query(
            `INSERT INTO personas
         (id, cedula, nombre, apellidos, tipo_sangre, fecha_nacimiento,
          gestante, semanas_gestacion, discapacidad, medicamento, direccion, foto)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                id, cedula, nombre, apellidos,
                tipoSangre || null,
                fechaNacimiento || null,
                esGestante,
                esGestante && semanasGestacion ? Number(semanasGestacion) : null,
                discapacidad || 'NINGUNA',
                medicamento || 'NINGUNO',
                direccion || null,
                foto || null,
            ]
        );
        return id;
    },

    // 👇 Ahora inserta N contactos en una sola query
    async crearContactos(personaId, contactos, conn = pool) {
        if (!Array.isArray(contactos) || contactos.length === 0) return;

        const valores = contactos.map((c, i) => [
            personaId,
            c.nombre || null,
            c.telefono || null,
            c.parentesco || null,
        ]);

        await conn.query(
            `INSERT INTO contactos_emergencia
             (persona_id, nombre, telefono, parentesco)
             VALUES ?`,
            [valores]
        );
    },

    async listar() {
        const [rows] = await pool.query(
            `SELECT id, cedula, nombre, apellidos, foto, tipo_sangre, gestante,
                semanas_gestacion, discapacidad, medicamento, creado_en
         FROM personas
         ORDER BY creado_en DESC`
        );

        return rows.map((p) => ({
            id: p.id,
            cedula: p.cedula,
            nombre: p.nombre,
            apellidos: p.apellidos,
            foto: p.foto,
            tipoSangre: p.tipo_sangre,
            gestante: !!p.gestante,
            semanasGestacion: p.semanas_gestacion ?? null,
            discapacidad: p.discapacidad,
            medicamento: p.medicamento,
            creadoEn: p.creado_en,
        }));
    },

    async obtenerIdPorCedula(cedula) {
        const [rows] = await pool.query('SELECT id FROM personas WHERE cedula = ?', [cedula]);
        return rows.length ? rows[0].id : null;
    },

    async actualizar(id, campos) {
        const mapaColumnas = {
            tipoSangre: 'tipo_sangre',
            fechaNacimiento: 'fecha_nacimiento',
            semanasGestacion: 'semanas_gestacion',
        };
        const columnasPermitidas = [
            'cedula', 'nombre', 'apellidos', 'tipoSangre', 'fechaNacimiento',
            'gestante', 'semanasGestacion', 'discapacidad', 'medicamento',
            'direccion', 'foto',
        ];

        const sets = [];
        const valores = [];
        for (const clave of columnasPermitidas) {
            if (campos[clave] !== undefined) {
                sets.push(`${mapaColumnas[clave] || clave} = ?`);
                valores.push(campos[clave]);
            }
        }
        if (sets.length === 0) return 0;

        const [resultado] = await pool.query(
            `UPDATE personas SET ${sets.join(', ')} WHERE id = ?`,
            [...valores, id]
        );
        return resultado.affectedRows;
    },

    async eliminar(id) {
        // Los contactos se eliminan solos por ON DELETE CASCADE
        const [resultado] = await pool.query('DELETE FROM personas WHERE id = ?', [id]);
        return resultado.affectedRows;
    },

    async buscarPorIdSimple(id) {
        const [rows] = await pool.query(
            'SELECT id, cedula, nombre, apellidos FROM personas WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    async buscarPorCedulaSimple(cedula) {
        const [rows] = await pool.query(
            'SELECT id, cedula, nombre, apellidos FROM personas WHERE cedula = ?',
            [cedula]
        );
        return rows[0] || null;
    },

    async contarTodas() {
        const [{ total }] = (await pool.query('SELECT COUNT(*) AS total FROM personas'))[0];
        return total;
    },
};

module.exports = PersonaModel;