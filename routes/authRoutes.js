const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // ROTA DE LOGIN (POST)
    router.post('/login', (req, res) => {
        const { email, senha } = req.body;

        // LOG 1: Mostra no terminal o que chegou do Thunder Client
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

            // LOG 2: Mostra o que o banco de dados encontrou para esse email
            console.log('Resultado do Banco (Linhas encontradas):', results.length);
            if (results.length > 0) {
                console.log('Senha salva no Banco:', results[0].senha);
            }

            // Se não achar o email
            if (results.length === 0) {
                return res.status(401).json({ error: 'Usuario ou senha incorretos. (Email não encontrado)' });
            }

            const artista = results[0];

            // Compara a senha enviada com a do banco de dados (removendo espaços extras para garantir)
            if (senha.trim() !== artista.senha.trim()) {
                return res.status(401).json({ error: 'Usuario ou senha incorretos. (Senha não bate)' });
            }

            // Se tudo bater, faz o login
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

    return router;
};