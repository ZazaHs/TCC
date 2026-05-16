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
                return res.status(401).json({ error: 'Usuario ou senha incorretos.' });
            }

            const artista = results[0];

            if (senha.trim() !== artista.senha.trim()) {
                return res.status(401).json({ error: 'Usuario ou senha incorretos.' });
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
    // 2. NOVA ROTA: CADASTRO (POST /auth/cadastro)
    // ==========================================
    router.post('/cadastro', (req, res) => {
        const { nome, email, senha, biografia } = req.body;

        // Validação dos campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        // PASSO 1: Verificar se o e-mail já existe no banco
        const checkEmailSql = 'SELECT id_artista FROM artistas WHERE email = ?';

        db.query(checkEmailSql, [email], (err, results) => {
            if (err) {
                console.error('Erro ao verificar e-mail:', err);
                return res.status(500).json({ error: 'Erro interno ao verificar dados.' });
            }

            // Se retornar alguma linha, o e-mail já está em uso
            if (results.length > 0) {
                return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
            }

            // PASSO 2: Se o e-mail estiver livre, insere o novo artista
            const insertSql = 'INSERT INTO artistas (nome, email, senha, biografia) VALUES (?, ?, ?, ?)';
            const bioValor = biografia || ''; // Se não mandarem bio, salva vazio

            db.query(insertSql, [nome, email, senha, bioValor], (err, result) => {
                if (err) {
                    console.error('Erro ao cadastrar artista:', err);
                    return res.status(500).json({ error: 'Erro interno ao salvar o cadastro.' });
                }

                // Retorna 201 (Created) com o ID gerado pelo banco
                res.status(201).json({
                    message: 'Artista cadastrado com sucesso!',
                    id_artista: result.insertId
                });
            });
        });
    });

    return router;
};