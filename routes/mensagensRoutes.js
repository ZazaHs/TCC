const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // 1. POST - Enviar Mensagem (Mantendo seu padrão 'conteudo')
    router.post('/', (req, res) => {
        const { id_remetente, id_destinatario, conteudo } = req.body;
        const sql = "INSERT INTO mensagens (id_remetente, id_destinatario, conteudo) VALUES (?, ?, ?)";
        db.query(sql, [id_remetente, id_destinatario, conteudo], (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(201).json({ message: "Mensagem enviada!" });
        });
    });

    // 2. GET - Histórico de mensagens entre DOIS artistas (Corrige o sumiço de mensagens)
    // Rota: http://localhost:3000/api/mensagens/historico/:remetente/:destinatario
    router.get('/historico/:remetente/:destinatario', (req, res) => {
        const { remetente, destinatario } = req.params;
        
        // Pega as mensagens que o remetente mandou pro destinatário ENQUANTO pega as que o destinatário mandou de volta
        const sql = `
            SELECT * FROM mensagens 
            WHERE (id_remetente = ? AND id_destinatario = ?)
               OR (id_remetente = ? AND id_destinatario = ?)
            ORDER BY data_envio ASC
        `;

        db.query(sql, [remetente, destinatario, destinatario, remetente], (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(200).json(result);
        });
    });

    // 3. GET - Listar todos os OUTROS artistas para preencher a área de contatos
    // Rota: http://localhost:3000/api/mensagens/contatos/:id_logado
    router.get('/contatos/:id_logado', (req, res) => {
        const idLogado = req.params.id_logado;
        const sql = 'SELECT id_artista, nome, foto_perfil, biografia FROM artistas WHERE id_artista != ?';
        
        db.query(sql, [idLogado], (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(200).json(result);
        });
    });

    return router;
};