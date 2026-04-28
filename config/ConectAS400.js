require('dotenv').config({
    path: `.env.${process.env.NODE_ENV || 'development'}`
});

const odbc = require('odbc');

const connectionString = `DSN=${process.env.ODBC_DSN};UID=${process.env.ODBC_USER};PWD=${process.env.ODBC_PASSWORD};CCSID=1208`;

let connection = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 5000;

const connectToAS400 = async () => {
    // Evitar múltiples conexiones simultáneas
    if (isConnecting) {
        console.log('⏳ Ya hay una conexión en proceso, esperando...');
        // Esperar a que termine la conexión actual
        await new Promise(resolve => setTimeout(resolve, 1000));
        return connection;
    }

    // Si ya hay conexión, retornarla
    if (connection) {
        try {
            // Verificar si la conexión sigue viva con una consulta simple
            await connection.query('SELECT 1 FROM SYSIBM.SYSDUMMY1');
            return connection;
        } catch (error) {
            console.log('⚠️ Conexión existente no responde, reconectando...');
            connection = null;
        }
    }

    isConnecting = true;

    try {
        console.log('🔄 Conectando a AS400...');
        connection = await odbc.connect(connectionString);
        reconnectAttempts = 0;
        console.log('✅ Conexión establecida con AS400');
        return connection;
    } catch (error) {
        console.error('❌ Error al conectar con AS400:', error.message);
        connection = null;
        throw error;
    } finally {
        isConnecting = false;
    }
};

const executeQueryAS400 = async (query, params = []) => {
    let retries = 0;
    const MAX_RETRIES = 2;

    while (retries <= MAX_RETRIES) {
        try {
            const conn = await connectToAS400();
            if (!conn) {
                throw new Error('No hay conexión disponible con AS400');
            }

            const result = await conn.query(query, params);
            return result;

        } catch (error) {
            console.error(`❌ Error al ejecutar la consulta (intento ${retries + 1}/${MAX_RETRIES + 1}):`, error.message);

            // Si es error de conexión, reiniciar la conexión
            const esErrorConexion = error.message.includes('Connection') ||
                error.message.includes('conexión') ||
                error.message.includes('Invalid handle') ||
                error.message.includes('SQLSTATE');

            if (esErrorConexion && retries < MAX_RETRIES) {
                console.log('🔁 Error de conexión, reiniciando conexión...');
                connection = null; // Forzar reconexión
                retries++;

                if (retries <= MAX_RETRIES) {
                    console.log(`⏳ Esperando ${RECONNECT_DELAY / 1000} segundos antes de reintentar...`);
                    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
                }
            } else {
                throw error;
            }
        }
    }

    throw new Error(`No se pudo ejecutar la consulta después de ${MAX_RETRIES + 1} intentos`);
};

const closeConnectionAS400 = async () => {
    if (connection) {
        try {
            await connection.close();
            console.log('🔌 Conexión AS400 cerrada correctamente');
            connection = null;
        } catch (error) {
            console.error('❌ Error al cerrar conexión AS400:', error.message);
        }
    }
};

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('🛑 Cerrando conexiones...');
    await closeConnectionAS400();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Cerrando conexiones por SIGTERM...');
    await closeConnectionAS400();
    process.exit(0);
});

module.exports = {
    connectToAS400,
    executeQueryAS400,
    closeConnectionAS400
};