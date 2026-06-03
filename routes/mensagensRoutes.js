const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // ========================================================
    // 1. ENVIAR UMA MENSAGEM (POST /mensagens/)
    // ========================================================
    router.post('/', (req, res) => {
        const { id_remetente, id_destinatario, conteudo } = req.body;

        if (!id_remetente || !id_destinatario || !conteudo) {
            return res.status(400).json({ error: "Campos obrigatórios ausentes." });
        }

        // Removida a coluna 'lida' que causava erro no banco
        const query = `
            INSERT INTO mensagens (id_remetente, id_destinatario, conteudo) 
            VALUES (?, ?, ?)
        `;

        db.query(query, [id_remetente, id_destinatario, conteudo], (err, result) => {
            if (err) {
                console.error("❌ ERRO NO BANCO (POST /mensagens):", err.message);
                return res.status(500).json({ error: "Erro ao salvar mensagem no banco." });
            }
            res.status(201).json({ success: true, id_mensagem: result.insertId });
        });
    });

    // ========================================================
    // 2. LISTAR APENAS ARTISTAS QUE O USUÁRIO SEGUE (GET /mensagens/contatos/:idLogado)
    // ========================================================
    router.get('/contatos/:idLogado', (req, res) => {
        let rawId = req.params.idLogado;
        
        if (typeof rawId === 'string' && rawId.includes(':')) {
            rawId = rawId.split(':')[0];
        }

        const idLogado = parseInt(rawId, 10);

        if (isNaN(idLogado)) {
            console.error("❌ ID enviado é inválido:", req.params.idLogado);
            return res.status(400).json({ error: "ID de usuário inválido." });
        }

        // QUERY CORRIGIDA: Removida a coluna m2.lida que não existe no seu banco remoto
        const query = `
            SELECT 
                a.id_artista, 
                a.nome, 
                a.foto_perfil, 
                a.biografia,
                0 AS tem_novas_mensagens
            FROM artistas a
            INNER JOIN seguidores s ON s.id_seguido = a.id_artista
            WHERE s.id_seguidor = ? AND a.id_artista <> ?
            ORDER BY a.nome ASC;
        `;

        db.query(query, [idLogado, idLogado], (err, results) => {
            if (err) {
                console.error("❌ ERRO COMPLETO DO MYSQL REJEITANDO A QUERY:");
                console.error(err); 
                return res.status(500).json({ error: "Erro interno no banco de dados.", detalhe: err.message });
            }
            res.json(results);
        });
    });

    // ========================================================
    // 3. HISTÓRICO DE MENSAGENS (GET /mensagens/historico/:remetente/:destinatario)
    // ========================================================
    router.get('/historico/:remetente/:destinatario', (req, res) => {
        let { remetente, destinatario } = req.params;

        if (remetente.includes(':')) remetente = remetente.split(':')[0];
        if (destinatario.includes(':')) destinatario = destinatario.split(':')[0];

        // Removida a query de UPDATE que tentava alterar a coluna 'lida' inexistente
        const querySelect = `
            SELECT id_mensagem, id_remetente, id_destinatario, conteudo, data_envio 
            FROM mensagens 
            WHERE (id_remetente = ? AND id_destinatario = ?) 
               OR (id_remetente = ? AND id_destinatario = ?)
            ORDER BY data_envio ASC
        `;

        db.query(querySelect, [remetente, destinatario, destinatario, remetente], (err, results) => {
            if (err) {
                console.error("❌ Erro ao buscar histórico:", err.message);
                return res.status(500).json({ error: "Erro ao buscar histórico de mensagens." });
            }
            res.json(results);
        });
    });

    return router;
};