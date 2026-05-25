const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();

// Middlewares
app.use(cors());
// Procure essas linhas no seu servidor e mude para:
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração da Conexão com o MySQL
const db = mysql.createConnection({
    host: 'bm12c3vl3xtvh9kizaif-mysql.services.clever-cloud.com',
    user: 'u0ehyx8dioi7dbbw',
    password: 'eLZvJVunXIqJ0dFnGyvX', 
    port:3306,
    database: 'bm12c3vl3xtvh9kizaif'
});

// Conectar ao Banco
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco na nuvem:', err.message);
        return;
    }
    console.log('Conectado ao banco_amnesia na nuvem com sucesso!');
});

// ==========================================
// IMPORTAÇÃO DAS ROTAS
// ==========================================
const artistasRoutes = require('./routes/artistasRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const seguidoresRoutes = require('./routes/seguidoresRoutes');
const avaliacoesRoutes = require('./routes/avaliacoesRoutes');
const commissionsRoutes = require('./routes/commissionsRoutes');
const mensagensRoutes = require('./routes/mensagensRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const midiasPerfilRoutes = require('./routes/midiasPerfilRoutes');
const favoritosRoutes = require('./routes/favoritosRoutes');
const authRoutes = require('./routes/authRoutes'); // Rota de favoritos importada

// ==========================================
// ATIVAÇÃO DAS ROTAS (Uso dos endpoints passando o 'db')
// ==========================================
app.use('/artistas', artistasRoutes(db));
app.use('/portfolio', portfolioRoutes(db));
app.use('/seguidores', seguidoresRoutes(db));
app.use('/avaliacoes', avaliacoesRoutes(db));
app.use('/commissions', commissionsRoutes(db));


block: {
    app.use('/mensagens', mensagensRoutes(db));
}

app.use('/categorias', categoriasRoutes(db));
app.use('/midias-perfil', midiasPerfilRoutes(db));

// Aqui ativamos a sua rota de favoritos passando o banco de dados também!
app.use('/api', favoritosRoutes(db));
app.use('/auth', authRoutes(db));

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR (Sempre no final)
// ==========================================
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});