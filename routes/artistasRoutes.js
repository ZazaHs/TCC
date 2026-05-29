const express = require('express');
const router = express.Router();

module.exports = (db) => {
    
    // 1. SUA ROTA JÁ EXISTENTE: Listar todos os artistas
    router.get('/', (req, res) => {
        const sql = "SELECT * FROM artistas";
        db.query(sql, (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(200).json(result);
        });
    });

    // 2. NOVA ROTA: Buscar dados de um perfil específico + verificar se o usuário logado já o segue
    // Rota que o perfil-publico.js chama
    router.get('/perfil-publico/:id_visitado/:id_logado', (req, res) => {
        const { id_visitado, id_logado } = req.params;

        const sql = `
            SELECT id_artista, nome, foto_perfil, biografia,
            (SELECT COUNT(*) FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?) AS seguindo
            FROM artistas WHERE id_artista = ?`;

        db.query(sql, [id_logado, id_visitado, id_visitado], (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.length === 0) return res.status(404).json({ error: "Artista não encontrado" });
            res.status(200).json(result[0]); // Retorna apenas o artista encontrado
        });
    });

    // 3. NOVA ROTA: Buscar apenas as postagens de um artista específico (Feed Individual)
    router.get('/postagens/artista/:id_artista', (req, res) => {
        const id_artista = req.params.id_artista;
        
        const sql = `
            SELECT p.*, a.nome AS artista_nome, a.foto_perfil AS artista_foto 
            FROM postagens p 
            JOIN artistas a ON p.id_artista = a.id_artista 
            WHERE p.id_artista = ? 
            ORDER BY p.data_criacao DESC`;
        
        db.query(sql, [id_artista], (err, results) => {
            if (err) return res.status(500).json(err);
            res.status(200).json(results); // Retorna a lista de posts dele
        });
    });

    return router;
};