module.exports = {
    apps: [
        {
            name: 'apitth',
            script: './server.js',
            instances: 1,                    // Para desarrollo, 1 es suficiente
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,                   // Importante: false en producción
            max_memory_restart: '1G',
            restart_delay: 5000,
            kill_timeout: 3000,             // Tiempo para cerrar conexiones
            listen_timeout: 3000,           // Tiempo para escuchar

            // Variables de entorno por defecto
            env: {
                NODE_ENV: 'production',
                PORT: 5008
            },

            // Entorno de desarrollo
            env_development: {
                NODE_ENV: 'development',
                PORT: 5019
            },

            // Entorno de producción (RECOMENDADO)
            env_production: {
                NODE_ENV: 'production',
                PORT: 5008
            },

            // Logs
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,

            // Merge logs
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};