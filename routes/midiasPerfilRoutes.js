const express = require('express');
const router = express.Router();

module.exports = (db) => {
    
    // 1. Rota POST (Postar nova mídia)
    router.post('/', (req, res) => {
        // Recebe o ID do artista e os dados do corpo da requisição
        const { id_artista, tipo_midia, titulo, url_arquivo } = req.body;
        
        if (!id_artista || !url_arquivo) {
            return res.status(400).json({ error: "Os campos id_artista e url_arquivo são obrigatórios!" });
        }

        // Aqui está a correção: usamos 'artista_id' que é o nome real da sua coluna no banco
        const sql = "INSERT INTO midiasperfil (artista_id, tipo_midia, titulo, url_arquivo) VALUES (?, ?, ?, ?)";
        
        db.query(sql, [id_artista, tipo_midia || 'imagem', titulo, url_arquivo], (err, result) => {
            if (err) {
                console.error("Erro ao inserir mídia:", err);
                return res.status(500).json(err);
            }
            res.status(201).json({ message: "Mídia inserida com sucesso!", id_midia: result.insertId });
        });
    });

    // 2. Rota GET (Listar mídias de um artista específico)
    router.get('/:id_artista', (req, res) => {
        const id = req.params.id_artista; 
        console.log("Buscando mídias para o artista ID:", id);

        // Ajustado aqui também para buscar por 'artista_id'
        const sql = "SELECT * FROM midiasperfil WHERE artista_id = ?";
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Erro no GET MidiasPerfil:", err);
                return res.status(500).json(err);
            }
            res.status(200).json(result);
        });
    });

    return router;
};