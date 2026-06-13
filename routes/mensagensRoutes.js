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

        // Agora garantimos que toda mensagem nova nasce como lida = 0
        const query = `
            INSERT INTO mensagens (id_remetente, id_destinatario, conteudo, lida) 
            VALUES (?, ?, ?, 0)
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
    // 2. LISTAR CONTATOS COM BOLINHA BASEADA NO BANCO
    // ========================================================
    router.get('/contatos/:idLogado', (req, res) => {
        let rawId = req.params.idLogado;
        if (typeof rawId === 'string' && rawId.includes(':')) {
            rawId = rawId.split(':')[0];
        }
        const idLogado = parseInt(rawId, 10);

        if (isNaN(idLogado)) {
            return res.status(400).json({ error: "ID de usuário inválido." });
        }

        // Buscamos se existe alguma mensagem daquele contato para você que ainda está com lida = 0
        const query = `
            SELECT DISTINCT
                a.id_artista, 
                a.nome, 
                a.foto_perfil, 
                a.biografia,
                IFNULL((
                    SELECT 1 FROM mensagens m 
                    WHERE m.id_remetente = a.id_artista 
                      AND m.id_destinatario = ? 
                      AND m.lida = 0 
                    LIMIT 1
                ), 0) AS tem_novas_mensagens
            FROM artistas a
            WHERE a.id_artista <> ? 
              AND (
                a.id_artista IN (SELECT id_seguido FROM seguidores WHERE id_seguidor = ?)
                OR
                a.id_artista IN (SELECT id_remetente FROM mensagens WHERE id_destinatario = ?)
              )
            ORDER BY tem_novas_mensagens DESC, a.nome ASC;
        `;

        db.query(query, [idLogado, idLogado, idLogado, idLogado], (err, results) => {
            if (err) {
                console.error("❌ ERRO NO MYSQL AO BUSCAR CONTATOS:", err.message); 
                return res.status(500).json({ error: "Erro interno no banco de dados." });
            }
            res.json(results);
        });
    });

    // ========================================================
    // 3. HISTÓRICO DE MENSAGENS (E MARCAR COMO LIDA)
    // ========================================================
    router.get('/historico/:remetente/:destinatario', (req, res) => {
        let { remetente, destinatario } = req.params;

        if (remetente.includes(':')) remetente = remetente.split(':')[0];
        if (destinatario.includes(':')) destinatario = destinatario.split(':')[0];

        // ASSIM QUE ABRE O CHAT: Atualiza todas as mensagens que o outro te mandou para lida = 1
        const queryUpdate = `
            UPDATE mensagens 
            SET lida = 1 
            WHERE id_remetente = ? AND id_destinatario = ? AND lida = 0
        `;

        db.query(queryUpdate, [destinatario, remetente], (err) => {
            if (err) console.error("❌ Erro ao atualizar status de lida:", err.message);
            
            // Depois de atualizar, busca o histórico completo para exibir na tela
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
                    return res.status(500).json({ error: "Erro ao buscar histórico." });
                }
                res.json(results);
            });
        });
    });

    return router;
};