const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // 1. ROTA: Criar uma nova publicação (POST -> http://localhost:3000/api/postagens)
    router.post('/', (req, res) => {
        const { id_artista, legenda, imagem_post } = req.body;

        if (!id_artista || !imagem_post) {
            return res.status(400).json({ error: 'O ID do artista e a imagem são obrigatórios.' });
        }

        const query = 'INSERT INTO postagens (id_artista, legenda, imagem_post) VALUES (?, ?, ?)';
        
        db.query(query, [id_artista, legenda, imagem_post], (err, result) => {
            if (err) {
                console.error('Erro ao salvar a postagem no banco:', err);
                return res.status(500).json({ error: 'Erro interno ao salvar a publicação.' });
            }
            res.status(201).json({ message: 'Publicação criada com sucesso!' });
        });
    });

    // 2. ROTA: Carregar todas as postagens no feed (GET -> http://localhost:3000/api/postagens)
    router.get('/', (req, res) => {
        const query = `
            SELECT p.*, a.nome AS artista_nome, a.foto_perfil AS artista_foto 
            FROM postagens p 
            JOIN artistas a ON p.id_artista = a.id_artista 
            ORDER BY p.data_criacao DESC
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Erro ao buscar postagens no banco:', err);
                return res.status(500).json({ error: 'Erro interno ao carregar o feed.' });
            }
            res.json(results);
        });
    });


    // 3. ROTA: Apagar uma publicação específica (DELETE -> http://localhost:3000/api/postagens/:id)
    router.delete('/:id', (req, res) => {
        const idPost = req.params.id;
        const { id_artista } = req.body; // Recebe o ID de quem está tentando apagar por segurança

        if (!id_artista) {
            return res.status(400).json({ error: 'ID do artista é obrigatório para confirmar a exclusão.' });
        }

        // Primeiro, verifica se o post realmente pertence ao artista que está tentando apagar
        const verificarQuery = 'SELECT id_artista FROM postagens WHERE id_post = ?';
        
        db.query(verificarQuery, [idPost], (err, results) => {
            if (err) {
                console.error('Erro ao verificar dono do post:', err);
                return res.status(500).json({ error: 'Erro interno no servidor.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Publicação não encontrada.' });
            }

            // Se o ID do dono do post for diferente do ID de quem está logado, bloqueia
            if (results[0].id_artista !== parseInt(id_artista)) {
                return res.status(403).json({ error: 'Você não tem permissão para apagar a publicação de outro artista.' });
            }

            // Se estiver tudo certo, deleta o post
            const deletarQuery = 'DELETE FROM postagens WHERE id_post = ?';
            db.query(deletarQuery, [idPost], (err, result) => {
                if (err) {
                    console.error('Erro ao deletar postagem:', err);
                    return res.status(500).json({ error: 'Erro ao tentar excluir a publicação.' });
                }
                res.json({ message: 'Publicação excluída com sucesso!' });
            });
        });
    });
    return router;
};