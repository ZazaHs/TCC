const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // ==========================================
    // 1. ROTA DE LOGIN (POST /auth/login)
    // ==========================================
    router.post('/login', (req, res) => {
        const { email, senha } = req.body;

        console.log('--- NOVA TENTATIVA DE LOGIN ---');
        console.log('Recebido no Body -> Email:', email, '| Senha:', senha);

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const sql = 'SELECT id_artista, nome, email, senha, biografia FROM artistas WHERE email = ?';

        db.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Erro no MySQL:', err);
                return res.status(500).json({ error: 'Erro interno no servidor.' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            const artista = results[0];

            if (senha.trim() !== artista.senha.trim()) {
                return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
            }

            res.json({
                message: 'Login realizado com sucesso!',
                user: {
                    id_artista: artista.id_artista,
                    nome: artista.nome,
                    email: artista.email,
                    biografia: artista.biografia
                }
            });
        });
    });

    // ==========================================
    // 2. ROTA DE CADASTRO (POST /auth/cadastro)
    // ==========================================
    router.post('/cadastro', (req, res) => {
        const { nome, email, senha, biografia } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        const checkEmailSql = 'SELECT id_artista FROM artistas WHERE email = ?';

        db.query(checkEmailSql, [email], (err, results) => {
            if (err) {
                console.error('Erro ao verificar e-mail:', err);
                return res.status(500).json({ error: 'Erro interno ao verificar dados.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
            }

            const insertSql = 'INSERT INTO artistas (nome, email, senha, biografia) VALUES (?, ?, ?, ?)';
            const bioValor = biografia || ''; 

            db.query(insertSql, [nome, email, senha, bioValor], (err, result) => {
                if (err) {
                    console.error('Erro ao cadastrar artista:', err);
                    return res.status(500).json({ error: 'Erro interno ao salvar o cadastro.' });
                }

                res.status(201).json({
                    message: 'Artista cadastrado com sucesso!',
                    id_artista: result.insertId
                });
            });
        });
    });

    // =======================================================
    // 3. BUSCAR DADOS DO PERFIL (GET /auth/perfil/:id)
    // =======================================================
    router.get('/perfil/:id', (req, res) => {
        const idArtista = req.params.id;
        const query = "SELECT id_artista, nome, email, biografia, foto_perfil FROM artistas WHERE id_artista = ?";

        db.query(query, [idArtista], (err, results) => {
            if (err) {
                console.error("Erro ao buscar perfil:", err);
                return res.status(500).json({ error: "Erro no banco de dados" });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "Artista não encontrado" });
            }
            
            res.json(results[0]);
        });
    });

    // =======================================================
    // 4. SALVAR ALTERAÇÕES (PUT /auth/atualizar-perfil)
    // =======================================================
    router.put('/atualizar-perfil', (req, res) => {
        const { id, nome, biografia, foto_perfil } = req.body;

        let query = "UPDATE artistas SET nome = ?, biografia = ? WHERE id_artista = ?";
        let dados = [nome, biografia, id];

        if (foto_perfil) {
            query = "UPDATE artistas SET nome = ?, biografia = ?, foto_perfil = ? WHERE id_artista = ?";
            dados = [nome, biografia, foto_perfil, id];
        }

        db.query(query, dados, (err, result) => {
            if (err) {
                console.error("Erro ao atualizar perfil no MySQL:", err);
                return res.status(500).json({ error: "Erro ao salvar no banco de dados." });
            }
            res.json({ message: "Perfil updated com sucesso!" });
        });
    });

    return router;
};