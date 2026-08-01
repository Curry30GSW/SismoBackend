const crypto = require('crypto');

/**
 * Genera: {id_documento}{tipo_abrev}{hash6}
 * Ejemplo: 142CONT-A3F7K2
 */
const PREFIJOS = {
    CONTRATO: 'CONT',
    ASCENSO: 'ASCE',
    ENCARGATURA: 'ENCAR',
    PRORROGA: 'PROR',
    NO_PRORROGA: 'NPROR',
    TRASLADO: 'ADTR',
    OTRO_SI_APRENDIZ: 'OTRO',
    CAMBIO_MODALIDAD: 'NOMBR',
};

function generarCodigo(tipoDocumento, idDocumento) {
    const prefijo = PREFIJOS[tipoDocumento] || 'DOC';
    const hash = crypto
        .createHash('sha256')
        .update(`${tipoDocumento}-${idDocumento}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`)
        .digest('hex')
        .toUpperCase()
        .slice(0, 8);

    return `${idDocumento}${prefijo}${hash}`;
    // Resultado: 142CONTA3F7K2B9
}

module.exports = { generarCodigo, PREFIJOS };