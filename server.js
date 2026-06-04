const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); // ✅ ADICIONADO: Necessário para o path.join funcionar sem travar o servidor

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir arquivos estáticos (CSS, JS, Imagens, HTMLs) diretamente da pasta raiz/views
app.use(express.static(path.join(__dirname))); 

// Configuração da Conexão com o MySQL (Clever Cloud)
const db = mysql.createConnection({
    host: 'bm12c3vl3xtvh9kizaif-mysql.services.clever-cloud.com',
    user: 'u0ehyx8dioi7dbbw',
    password: 'eLZvJVunXIqJ0dFnGyvX', 
    port: 3306,
    database: 'bm12c3vl3xtvh9kizaif'
});

// Conectar ao Banco
db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco na nuvem:', err.message);
        return;
    }
    console.log('🚀 Conectado ao banco da Clever Cloud com sucesso!');
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
const authRoutes = require('./routes/authRoutes'); 
const postagensRoutes = require('./routes/postagensRoutes')(db);
const pesquisaRoutes = require('./routes/pesquisaRoutes'); 

// ==========================================
// ATIVAÇÃO DAS ROTAS (Endpoints da API)
// ==========================================
app.use('/api/postagens', postagensRoutes);

app.use('/artistas', artistasRoutes(db));
app.use('/portfolio', portfolioRoutes(db));
app.use('/seguidores', seguidoresRoutes(db));
app.use('/avaliacoes', avaliacoesRoutes(db));
app.use('/commissions', commissionsRoutes(db));
app.use('/mensagens', mensagensRoutes(db));
app.use('/categorias', categoriasRoutes(db));
app.use('/midias-perfil', midiasPerfilRoutes(db));
app.use('/api', favoritosRoutes(db));
app.use('/auth', authRoutes(db)); // ✅ Rota que o perfil.js consome!
app.use('/api/pesquisa', pesquisaRoutes(db)); 

// ==========================================
// ROTAS DE REDIRECIONAMENTO DE PÁGINAS (HTML)
// ==========================================

// Atalho direto para abrir o app na home ou login se acessar a raiz http://localhost:3000/
// ==========================================
// ROTAS DE REDIRECIONAMENTO DE PÁGINAS (HTML)
// ==========================================

// 1. Rota para a raiz exata (http://localhost:3000/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'home.html'));
});

// 2. Rota coringa para Express moderno (Captura qualquer outra sub-rota que não seja de API)
// Usamos uma RegExp nativa do JavaScript (.*) que o Express aceita perfeitamente
app.get(/^(?!\/(artistas|portfolio|seguidores|avaliacoes|commissions|mensagens|categorias|midias-perfil|api|auth)).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'home.html'));
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR 
// ==========================================
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n⭐ Amnesia Backend Ativo!`);
    console.log(`🔗 Servidor rodando em http://localhost:${PORT}`);
});