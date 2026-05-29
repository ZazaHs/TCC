const express = require('express');
const router = express.Router();

module.exports = (db) => {
    
    // 1. ROTA ATUALIZADA: Seguir / Deixar de Seguir (Sistema de Alternância inteligente)
    router.post('/seguir', (req, res) => {
        const { id_seguidor, id_seguido } = req.body;

        // Primeiro, verifica se essa conexão já existe no banco
        const checkSql = "SELECT * FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?";
        
        db.query(checkSql, [id_seguidor, id_seguido], (err, results) => {
            if (err) return res.status(500).json(err);

            if (results.length > 0) {
                // Se o registro já existe, significa que o usuário quer DEIXAR de seguir
                const deleteSql = "DELETE FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?";
                db.query(deleteSql, [id_seguidor, id_seguido], (err) => {
                    if (err) return res.status(500).json(err);
                    return res.status(200).json({ status: "nao_seguindo", message: "Deixou de seguir este artista!" });
                });
            } else {
                // Se não existe, significa que ele quer COMEÇAR a seguir
                const insertSql = "INSERT INTO seguidores (id_seguidor, id_seguido) VALUES (?, ?)";
                db.query(insertSql, [id_seguidor, id_seguido], (err) => {
                    if (err) return res.status(500).json(err);
                    return res.status(201).json({ status: "seguindo", message: "Agora você está seguindo este artista!" });
                });
            }
        });
    });

    // 2. NOVA ROTA: Verificar status atual (Usada pelo front-end para renderizar os botões corretos)
    // Rota: http://localhost:3000/api/seguidores/status/:id_logado/:id_visitado
    router.get('/status/:id_logado/:id_visitado', (req, res) => {
        const { id_logado, id_visitado } = req.params;
        
        const sql = "SELECT COUNT(*) as ja_segue FROM seguidores WHERE id_seguidor = ? AND id_seguido = ?";
        
        db.query(sql, [id_logado, id_visitado], (err, result) => {
            if (err) return res.status(500).json(err);
            // Retorna true se o count for maior que 0, ou false se for 0
            const seguindo = result[0].ja_segue > 0;
            res.status(200).json({ seguindo: seguindo });
        });
    });

    // 3. SUA ROTA MANTIDA: Contar seguidores de um artista (Útil para o perfil)
    router.get('/contar/:id', (req, res) => {
        const id = req.params.id; // Lembrar de declarar com const ou let aqui!
        const sql = "SELECT COUNT(*) as total_seguidores FROM seguidores WHERE id_seguido = ?";
        
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(200).json(result[0]);
        });
    });

    return router;
};