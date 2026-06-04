const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // ========================================================
    // ENDPOINT UNIFICADO DE PESQUISA (GET /api/pesquisa?q=termo)
    // ========================================================
    router.get('/', async (req, res) => {
        const termo = req.query.q;

        // Se não houver termo de busca, já retorna tudo vazio de cara
        if (!termo || termo.trim() === '') {
            return res.json({ artistas: [], obras: [], tags: [] });
        }

        const busca = `%${termo}%`;

        // Função auxiliar para transformar o db.query tradicional em Promise (evita travamentos)
        const executarQuery = (sql, params) => {
            return new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
        };

        try {
            // 1. BUSCAR NA TABELA DE ARTISTAS
            const queryArtistas = `
                SELECT id_artista, nome, foto_perfil, biografia 
                FROM artistas 
                WHERE nome LIKE ? OR biografia LIKE ?
                LIMIT 10
            `;
            const artistas = await executarQuery(queryArtistas, [busca, busca]);

            // 2. BUSCAR NA TABELA DE POSTAGENS (Ajustado com suas colunas reais do banco)
            let obras = [];
            try {
                // Usamos "AS" para renomear as colunas na saída do JSON, mantendo compatibilidade com seu JS
                const queryObras = `
                    SELECT 
                        id_post AS id_postagem, 
                        legenda AS titulo, 
                        imagem_post AS imagem_url, 
                        id_artista 
                    FROM postagens 
                    WHERE legenda LIKE ?
                    LIMIT 10
                `;
                obras = await executarQuery(queryObras, [busca]);
            } catch (errObra) {
                console.error("❌ Erro na tabela postagens:", errObra.message);
            }

            // 3. BUSCAR NA TABELA DE CATEGORIAS / TAGS
            let tags = [];
            try {
                const queryTags = `
                    SELECT id_categoria, nome_categoria 
                    FROM categorias 
                    WHERE nome_categoria LIKE ?
                    LIMIT 10
                `;
                tags = await executarQuery(queryTags, [busca]);
            } catch (errTag) {
                console.error("❌ Erro na tabela categorias:", errTag.message);
            }

            // Retorna o resultado estruturado com os 3 arrays separados para o frontend
            return res.json({
                artistas: artistas,
                obras: obras,
                tags: tags
            });

        } catch (error) {
            console.error("❌ ERRO CRÍTICO NA PESQUISA:", error.message);
            return res.status(500).json({ error: "Erro interno no servidor ao processar a pesquisa." });
        }
    });

    return router;
};