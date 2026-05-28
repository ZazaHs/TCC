const express = require('express');
const router = express.Router();

// Exportamos uma função que recebe o 'db' do seu server.js
module.exports = (db) => {

    // ========================================================
    // 1. ENVIAR UMA MENSAGEM (POST /mensagens/)
    // ========================================================
    router.post('/', (req, res) => {
        const { id_remetente, id_destinatario, conteudo } = req.body;

        if (!id_remetente || !id_destinatario || !conteudo) {
            return res.status(400).json({ error: "Campos obrigatórios ausentes." });
        }

        const query = `
            INSERT INTO mensagens (id_remetente, id_destinatario, conteudo, lida) 
            VALUES (?, ?, ?, 0)
        `;

        db.query(query, [id_remetente, id_destinatario, conteudo], (err, result) => {
            if (err) {
                console.error("Erro ao enviar mensagem:", err);
                return res.status(500).json({ error: "Erro ao salvar mensagem no banco." });
            }
            res.status(201).json({ success: true, id_mensagem: result.insertId });
        });
    });

    // ========================================================
    // 2. LISTAR APENAS ARTISTAS QUE O USUÁRIO SEGUE (GET /mensagens/contatos/:idLogado)
    // ========================================================
    router.get('/contatos/:idLogado', (req, res) => {
        const idLogado = req.params.idLogado;

        // Query perfeita baseada nas tabelas reais do seu MySQL Workbench (id_seguidor e id_seguido)
        const query = `
            SELECT 
                a.id_artista, 
                a.nome, 
                a.foto_perfil, 
                a.biografia,
                IFNULL((
                    SELECT COUNT(*) 
                    FROM mensagens m2 
                    WHERE m2.id_remetente = a.id_artista 
                      AND m2.id_destinatario = ? 
                      AND m2.lida = 0
                ), 0) > 0 AS tem_novas_mensagens
            FROM artistas a
            INNER JOIN seguidores s ON s.id_seguido = a.id_artista
            WHERE s.id_seguidor = ? AND a.id_artista <> ?
            ORDER BY a.nome ASC;
        `;

        db.query(query, [idLogado, idLogado, idLogado], (err, results) => {
            if (err) {
                console.error("Erro ao buscar contatos no banco:", err);
                return res.status(500).json({ error: "Erro ao buscar lista de contatos." });
            }
            res.json(results);
        });
    });

    // ========================================================
    // 3. HISTÓRICO DE MENSAGENS (GET /mensagens/historico/:remetente/:destinatario)
    // ========================================================
    router.get('/historico/:remetente/:destinatario', (req, res) => {
        const { remetente, destinatario } = req.params;

        const queryUpdate = `
            UPDATE mensagens 
            SET lida = 1 
            WHERE id_remetente = ? AND id_destinatario = ? AND lida = 0
        `;

        db.query(queryUpdate, [destinatario, remetente], (err) => {
            if (err) console.error("Erro ao atualizar status de lida:", err);
            
            const querySelect = `
                SELECT id_mensagem, id_remetente, id_destinatario, conteudo, data_envio 
                FROM mensagens 
                WHERE (id_remetente = ? AND id_destinatario = ?) 
                   OR (id_remetente = ? AND id_destinatario = ?)
                ORDER BY data_envio ASC
            `;

            db.query(querySelect, [remetente, destinatario, destinatario, remetente], (err, results) => {
                if (err) {
                    console.error("Erro ao buscar histórico:", err);
                    return res.status(500).json({ error: "Erro ao buscar histórico de mensagens." });
                }
                res.json(results);
            });
        });
    });

    return router;
};