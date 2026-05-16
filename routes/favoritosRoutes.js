const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // 1. ROTA PARA FAVORITAR UMA ARTE (POST)
    router.post('/favoritar', (req, res) => {
        const { id_artista, id_midia } = req.body;

        if (!id_artista || !id_midia) {
            return res.status(400).json({ error: 'id_artista e id_midia são obrigatórios.' });
        }

        const sql = 'INSERT INTO favoritos_artes (id_artista, id_midia) VALUES (?, ?)';
        
        db.query(sql, [id_artista, id_midia], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Você já favoritou esta arte.' });
                }
                console.error('Erro ao favoritar:', err);
                return res.status(500).json({ error: 'Erro interno ao favoritar arte.' });
            }
            res.status(201).json({ message: 'Arte favoritada com sucesso!', id_favorito: result.insertId });
        });
    });

    // 2. ROTA PARA DESFAVORITAR UMA ARTE (DELETE)
    // (Ajustada para usar a mesma URL /favoritar, mudando apenas o método)
    router.delete('/favoritar', (req, res) => {
        const { id_artista, id_midia } = req.body;

        if (!id_artista || !id_midia) {
            return res.status(400).json({ error: 'id_artista e id_midia são obrigatórios.' });
        }

        const sql = 'DELETE FROM favoritos_artes WHERE id_artista = ? AND id_midia = ?';

        db.query(sql, [id_artista, id_midia], (err, result) => {
            if (err) {
                console.error('Erro ao desfavoritar:', err);
                return res.status(500).json({ error: 'Erro interno ao desfavoritar arte.' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Favorito não encontrado para remover.' });
            }

            res.json({ message: 'Arte desfavoritada com sucesso!' });
        });
    });

    // 3. NOVA ROTA: LISTAR ARTES FAVORITAS DE UM ARTISTA (GET)
    router.get('/favoritos/:id_artista', (req, res) => {
        const { id_artista } = req.params; // Pega o ID direto da URL

        // SQL que junta a tabela de favoritos com a tabela de mídias para pegar os dados da foto
        const sql = `
            SELECT f.id AS id_favorito, f.data_favoritado, m.id_midia, m.titulo, m.url_arquivo, m.tipo_midia
            FROM favoritos_artes f
            INNER JOIN MidiasPerfil m ON f.id_midia = m.id_midia
            WHERE f.id_artista = ?
            ORDER BY f.data_favoritado DESC
        `;

        db.query(sql, [id_artista], (err, results) => {
            if (err) {
                console.error('Erro ao buscar favoritos:', err);
                return res.status(500).json({ error: 'Erro interno ao buscar favoritos.' });
            }
            
            // Retorna a lista de artes favoritadas (pode ser uma lista vazia [] se não tiver nenhuma)
            res.json(results);
        });
    });

    return router;
};