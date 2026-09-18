const pool = require('../config/ConectDb');
const { v4: uuidv4 } = require('uuid');

const PersonaModel = {
    // Devuelve una persona con su contacto principal ya "aplanado"
    async obtenerCompleta(id) {
        const [personas] = await pool.query('SELECT * FROM personas WHERE id = ?', [id]);
        if (personas.length === 0) return null;

        const [contactos] = await pool.query(
            `SELECT nombre_contacto, telefono_contacto, direccion
       FROM contactos_emergencia
       WHERE persona_id = ?
       ORDER BY es_principal DESC LIMIT 1`,
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
            discapacidad: p.discapacidad,
            medicamento: p.medicamento,
            foto: p.foto,
            creadoEn: p.creado_en,
            contacto: contactos[0] || {
                nombreContacto: null,
                telefonoContacto: null,
                direccion: null,
            },
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
            gestante, discapacidad, medicamento, foto,
        } = datos;

        await conn.query(
            `INSERT INTO personas
        (id, cedula, nombre, apellidos, tipo_sangre, fecha_nacimiento,
         gestante, discapacidad, medicamento, foto)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                id, cedula, nombre, apellidos,
                tipoSangre || null,
                fechaNacimiento || null,
                gestante === 'true' || gestante === true,
                discapacidad || 'Ninguna',
                medicamento || null,
                foto || null,
            ]
        );
        return id;
    },

    async crearContacto(personaId, { nombreContacto, telefonoContacto, direccion }, conn = pool) {
        await conn.query(
            `INSERT INTO contactos_emergencia
        (persona_id, nombre_contacto, telefono_contacto, direccion)
       VALUES (?,?,?,?)`,
            [personaId, nombreContacto || null, telefonoContacto || null, direccion || null]
        );
    },

    async listar() {
        const [rows] = await pool.query(
            'SELECT id, cedula, nombre, apellidos, foto, creado_en FROM personas ORDER BY creado_en DESC'
        );
        return rows;
    },

    async obtenerIdPorCedula(cedula) {
        const [rows] = await pool.query('SELECT id FROM personas WHERE cedula = ?', [cedula]);
        return rows.length ? rows[0].id : null;
    },

    async actualizar(id, campos) {
        const mapaColumnas = {
            tipoSangre: 'tipo_sangre',
            fechaNacimiento: 'fecha_nacimiento',
        };
        const columnasPermitidas = [
            'cedula', 'nombre', 'apellidos', 'tipoSangre', 'fechaNacimiento',
            'gestante', 'discapacidad', 'medicamento', 'foto',
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
