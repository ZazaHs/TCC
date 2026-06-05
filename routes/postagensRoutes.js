const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // =======================================================
    // 1. SALVAR NOVA POSTAGEM NO BANCO (POST /api/postagens/)
    // =======================================================
    router.post('/', (req, res) => {
        const { id_artista, imagem_post, legenda } = req.body;

        if (!id_artista || !imagem_post) {
            return res.status(400).json({ error: "ID do artista e imagem são obrigatórios para postar!" });
        }

        const query = "INSERT INTO postagens (imagem_post, legenda, id_artista) VALUES (?, ?, ?)";

        db.query(query, [imagem_post, legenda, id_artista], (err, result) => {
            if (err) {
                console.error("❌ Erro ao salvar postagem no MySQL:", err);
                return res.status(500).json({ error: "Erro interno ao salvar no banco de dados." });
            }
            res.status(201).json({ message: "Postagem criada com sucesso!", id_post: result.insertId });
        });
    });

    // =======================================================
    // 2. ROTA DO FEED DA HOME HÍBRIDO (Com contagem de Likes)
    // GET /api/postagens/feed/:id_usuario
    // =======================================================
    router.get('/feed/:id', (req, res) => {
        const idUsuario = req.params.id;

        const query = `
            SELECT p.id_post, p.imagem_post, p.legenda, p.id_artista, a.nome AS nome_artista,
                   (CASE WHEN p.id_artista IN (SELECT id_seguido FROM seguidores WHERE id_seguidor = ?) THEN 1 ELSE 0 END) AS prioridade_seguindo,
                   COUNT(c.id_curtida) AS total_likes,
                   MAX(CASE WHEN c.id_artista = ? THEN 1 ELSE 0 END) AS usuario_ja_curtiu
            FROM postagens p
            JOIN artistas a ON p.id_artista = a.id_artista
            LEFT JOIN curtidas c ON p.id_post = c.id_post
            WHERE p.id_artista != ?
            GROUP BY p.id_post
            ORDER BY prioridade_seguindo DESC, p.id_post DESC
        `;

        db.query(query, [idUsuario, idUsuario, idUsuario], (err, results) => {
            if (err) {
                console.error("❌ Erro no algoritmo do Feed:", err);
                return res.status(500).json({ error: "Erro interno ao carregar o feed." });
            }
            res.json(results);
        });
    });

    // =======================================================
    // 3. ROTA DO ALGORITMO DO EXPLORAR / DESCOBERTA
    // GET /api/postagens/explorar/:id_usuario
    // =======================================================
    router.get('/explorar/:id', (req, res) => {
        const idUsuario = req.params.id;

        // Algoritmo: Recomenda posts de outros artistas, dando destaque a quem tem menos seguidores
        const query = `
            SELECT p.id_post, p.imagem_post, p.legenda, p.id_artista, a.nome AS nome_artista,
                   (SELECT COUNT(*) FROM seguidores WHERE id_seguido = p.id_artista) AS total_seguidores
            FROM postagens p
            JOIN artistas a ON p.id_artista = a.id_artista
            WHERE p.id_artista != ?
            ORDER BY total_seguidores ASC, p.id_post DESC
            LIMIT 24
        `;

        db.query(query, [idUsuario], (err, results) => {
            if (err) {
                console.error("❌ Erro no algoritmo do Explorar:", err);
                return res.status(500).json({ error: "Erro interno no servidor ao processar o explorar." });
            }
            res.json(results);
        });
    });

    // =======================================================
    // 4. ALTERNAR CURTIDA (POST /api/postagens/curtir)
    // =======================================================
    router.post('/curtir', (req, res) => {
        const { id_post, id_artista } = req.body;

        const checkQuery = "SELECT * FROM curtidas WHERE id_post = ? AND id_artista = ?";
        db.query(checkQuery, [id_post, id_artista], (err, results) => {
            if (err) return res.status(500).json({ error: "Erro ao verificar curtida." });

            if (results.length > 0) {
                const deleteQuery = "DELETE FROM curtidas WHERE id_post = ? AND id_artista = ?";
                db.query(deleteQuery, [id_post, id_artista], (err) => {
                    if (err) return res.status(500).json({ error: "Erro ao remover curtida." });
                    return res.json({ curtido: false, message: "Curtida removida!" });
                });
            } else {
                const insertQuery = "INSERT INTO curtidas (id_post, id_artista) VALUES (?, ?)";
                db.query(insertQuery, [id_post, id_artista], (err) => {
                    if (err) return res.status(500).json({ error: "Erro ao salvar curtida." });
                    return res.json({ curtido: true, message: "Postagem curtida!" });
                });
            }
        });
    });

    // =======================================================
    // 5. SALVAR COMENTÁRIO (POST /api/postagens/comentar)
    // =======================================================
    router.post('/comentar', (req, res) => {
        const { id_post, id_artista, texto } = req.body;

        if (!texto || texto.trim() === '') {
            return res.status(400).json({ error: "O texto do comentário não pode ser vazio." });
        }

        const query = "INSERT INTO comentarios (id_post, id_artista, texto) VALUES (?, ?, ?)";
        db.query(query, [id_post, id_artista, texto], (err, result) => {
            if (err) {
                console.error("Erro ao salvar comentário:", err);
                return res.status(500).json({ error: "Erro ao salvar comentário no banco." });
            }
            res.status(201).json({ message: "Comentário salvo!", id_comentario: result.insertId });
        });
    });

    // =======================================================
    // 6. BUSCAR COMENTÁRIOS DE UM POST (GET /api/postagens/:id_post/comentarios)
    // =======================================================
    router.get('/:id/comentarios', (req, res) => {
        const idPost = req.params.id;
        const query = `
            SELECT c.texto, a.nome AS nome_artista 
            FROM comentarios c
            JOIN artistas a ON c.id_artista = a.id_artista
            WHERE c.id_post = ?
            ORDER BY c.id_comentario ASC
        `;

        db.query(query, [idPost], (err, results) => {
            if (err) return res.status(500).json({ error: "Erro ao buscar comentários." });
            res.json(results);
        });
    });

    // =======================================================
    // 7. BUSCAR POSTS ESPECÍFICOS DE UM ARTISTA (Perfil)
    // GET /api/postagens/artista/:id_artista
    // =======================================================
    router.get('/artista/:id', (req, res) => {
        const idArtista = req.params.id;
        const query = "SELECT * FROM postagens WHERE id_artista = ? ORDER BY id_post DESC";
        
        db.query(query, [idArtista], (err, results) => {
            if (err) return res.status(500).json({ error: "Erro ao buscar publicações do artista." });
            res.json(results);
        });
    });

    // =======================================================
    // 8. DELETAR UMA POSTAGEM (DELETE /api/postagens/:id)
    // =======================================================
    router.delete('/:id', (req, res) => {
        const idPost = req.params.id;
        const sql = "DELETE FROM postagens WHERE id_post = ?";
        db.query(sql, [idPost], (err, result) => {
            if (err) return res.status(500).json({ error: "Erro ao deletar postagem." });
            res.json({ message: "Postagem deletada com sucesso!" });
        });
    });

    return router;
};