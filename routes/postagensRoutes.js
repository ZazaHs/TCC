const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // ==========================================
    // 1. BUSCAR POSTAGENS DO ARTISTA (GET /artistas/postagens/artista/:id)
    // ==========================================
    router.get('/artista/:id', (req, res) => {
        const idArtista = req.params.id;
        const query = "SELECT id_postagem, imagem_post, legenda FROM postagens WHERE id_artista = ? ORDER BY id_postagem DESC";

        db.query(query, [idArtista], (err, results) => {
            if (err) {
                console.error("Erro ao buscar postagens:", err);
                return res.status(500).json({ error: "Erro ao buscar publicações." });
            }
            res.json(results);
        });
    });

    // =======================================================
    // 2. DELETAR UMA POSTAGEM (DELETE /artistas/postagens/:id)
    // =======================================================
    router.delete('/:id', (req, res) => {
        const idPost = req.params.id;
        const sql = "DELETE FROM postagens WHERE id_postagem = ?";

        db.query(sql, [idPost], (err, result) => {
            if (err) {
                console.error("❌ Erro ao deletar do MySQL:", err);
                return res.status(500).json({ error: "Erro interno ao remover do banco de dados." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "A postagem não foi encontrada ou já foi excluída." });
            }

            console.log(`🗑️ Postagem ${idPost} deletada com sucesso da Clever Cloud!`);
            res.json({ message: "Postagem deletada com sucesso!" });
        });
    });

    return router;
};