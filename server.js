const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração da Conexão com o MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Verifique se o seu usuário é 'root'
    password: 'isac',      // Coloque a senha do seu MySQL aqui (se tiver)
    database: 'banco_amnesia'
});

// Conectar ao Banco
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
        return;
    }
    console.log('Conectado ao banco_amnesia com sucesso!');
});


const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.get('/artistas', (req, res) => {
    const sql = "SELECT * FROM artistas";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(result);
    });
});