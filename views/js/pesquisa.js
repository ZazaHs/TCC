// SIMULAÇÃO DE BANCO DE DADOS INTEGRADA (Mantida como plano de contingência caso o servidor caia)
const bancoDeArtes = [
    { id_post: 1, imagem_post: '/views/media/Art/Mark-Variants.avif', tipo: 'normal', id_artista: 1 },
    { id_post: 2, imagem_post: '/views/media/Art/Cyberpunk.jpg', tipo: 'normal', id_artista: 2 },
    { id_post: 3, imagem_post: '/views/media/Art/Bleach.jpg', tipo: 'tall', id_artista: 3 }, 
    { id_post: 4, imagem_post: '/views/media/Art/Itachi.png', tipo: 'normal', id_artista: 4 },
    { id_post: 5, imagem_post: '/views/media/Art/One-piece.jpeg', tipo: 'normal', id_artista: 5 },
    { id_post: 6, imagem_post: '/views/media//Art/Death-note.png', tipo: 'normal', id_artista: 6 },
    { id_post: 7, imagem_post: '/views/media/Art/Samurai-cyberpunk.png', tipo: 'tall', id_artista: 7 }, 
    { id_post: 8, imagem_post: '/views/media/Art/Reze.jpg', tipo: 'normal', id_artista: 8 },
    { id_post: 9, imagem_post: '/views/media/Art/Naruto.jpg', tipo: 'normal', id_artista: 9 },
    { id_post: 10, imagem_post: '/views/media/Art/One-piece-Ace.jpg', tipo: 'normal', id_artista: 10 },
    { id_post: 11, imagem_post: '/views/media/Art/Jujutsu-Sukuna.png', tipo: 'normal', id_artista: 11 },
    { id_post: 12, imagem_post: '/views/media/Art/Chainsaw-man.png', tipo: 'tall', id_artista: 12 }
];

// ==========================================================================
// 1. FUNÇÃO ATUALIZADA: BUSCA AS IMAGENS DO ALGORITMO DIRETO DO MYSQL
// ==========================================================================
async function renderizarGridExplorar() {
    const gridContainer = document.querySelector('.explore-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '<p style="color: #888; padding: 20px;">Processando algoritmo de descoberta...</p>';

    // Recupera o ID do artista logado para o algoritmo filtrar e não mostrar seus próprios posts
    const urlParams = new URLSearchParams(window.location.search);
    let idLogado = urlParams.get('id') || sessionStorage.getItem('idArtistaLogado') || 
                   sessionStorage.getItem('id_artista') || sessionStorage.getItem('idUsuario') || 1;

    try {
        console.log(`📡 Solicitando feed explorar para o ID Logado: ${idLogado}`);
        const resposta = await fetch(`http://localhost:3000/api/postagens/explorar/${idLogado}`);
        
        if (!resposta.ok) throw new Error("Resposta inválida do servidor.");
        
        const postagensDoBanco = await resposta.json();
        console.log("🚀 Postagens recebidas pelo algoritmo (Novos artistas no topo):", postagensDoBanco);

        if (!postagensDoBanco || postagensDoBanco.length === 0) {
            throw new Error("Nenhuma postagem retornada pelo banco.");
        }

        // Limpa e renderiza os dados dinâmicos vindos da Clever Cloud
        gridContainer.innerHTML = '';
        montarCardsNoGrid(postagensDoBanco, gridContainer);

    } catch (error) {
        console.warn("⚠️ Back-end offline ou sem registros. Renderizando banco local de contingência...", error);
        
        // Ativa o plano B: Carrega as suas imagens estáticas se o banco falhar
        gridContainer.innerHTML = '';
        montarCardsNoGrid(bancoDeArtes, gridContainer);
    }
}

// FUNÇÃO AUXILIAR PARA GERAR OS CARDS (Evita repetição de código)
function montarCardsNoGrid(listaDeArtes, container) {
    listaDeArtes.forEach(arte => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        
        // Garante a captura correta do ID seja do banco local ou do MySQL real
        const idPostagem = arte.id_post || arte.id;

        // Mantém a proporção 'tall' se ela vier mapeada ou sorteia para criar o efeito mosaico (estilo Pinterest)
        if (arte.tipo === 'tall' || (idPostagem % 4 === 0)) {
            gridItem.classList.add('tall');
        }

        const img = document.createElement('img');
        // Blindagem de propriedades: aceita tanto a nomenclatura do banco local quanto do MySQL real
        img.src = arte.imagem_post || arte.imagem_url || arte.url;
        img.alt = arte.legenda || `Arte ID ${idPostagem}`;
        img.classList.add('art-image');

        img.addEventListener('click', () => {
            // Garante o envio do id do artista correto (MySQL) ou do plano B local para o modal abrir o perfil certo
            const idDoArtistaDono = arte.id_artista || arte.id_usuario || 1;
            abrirFotoEmTelaCheia(img.src, idDoArtistaDono);
        });

        gridItem.appendChild(img);
        container.appendChild(gridItem);
    });
}

// ==========================================================================
// 2. LÓGICA DE INTEGRAÇÃO DO COMPORTAMENTO DE PESQUISA REAL
// ==========================================================================
async function realizarPesquisa(termo) {
    const gridContainer = document.querySelector('.explore-grid');
    if (!gridContainer) return;

    if (!termo || termo.trim() === '') {
        renderizarGridExplorar();
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/pesquisa?q=${encodeURIComponent(termo)}`);
        if (!response.ok) throw new Error("Erro ao buscar resultados.");

        const dados = await response.json();
        renderizarResultadosPesquisa(dados, gridContainer);

    } catch (error) {
        console.error("Erro na busca:", error);
        gridContainer.innerHTML = '<p style="color: #ff3b30; padding: 20px;">Erro ao carregar resultados da pesquisa.</p>';
    }
}

// FUNÇÃO DE RENDERIZAÇÃO DE RESULTADOS VINDOS DA PESQUISA
function renderizarResultadosPesquisa(dados, container) {
    container.innerHTML = ''; 

    const { artistas, obras, tags } = dados;

    if ((!artistas || artistas.length === 0) && (!obras || obras.length === 0) && (!tags || tags.length === 0)) {
        container.innerHTML = '<p style="color: #666; padding: 20px;">Nenhum resultado encontrado.</p>';
        return;
    }

    const wrapperPesquisa = document.createElement('div');
    wrapperPesquisa.style = "width: 100%; display: flex; flex-direction: column; gap: 35px; text-align: left;";

    // --- RENDERIZANDO ARTISTAS ENCONTRADOS ---
    if (artistas && artistas.length > 0) {
        const divArtistas = document.createElement('div');
        divArtistas.innerHTML = `<h3 style="color: #fff; margin-bottom: 15px; font-size: 20px; border-bottom: 1px solid #333; padding-bottom: 5px;">Artistas</h3>`;
        
        const subGrid = document.createElement('div');
        subGrid.style = "display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;";

        artistas.forEach(artista => {
            const item = document.createElement('div');
            item.style = "background: #1a1a1a; padding: 15px; border-radius: 12px; cursor: pointer; text-align: center; border: 1px solid #222; transition: 0.2s;";
            item.innerHTML = `
                <img src="${artista.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">
                <h4 style="color: #fff; font-size: 16px; margin: 5px 0;">${artista.nome}</h4>
                <p style="color: #aaa; font-size: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${artista.biografia || ''}</p>
            `;
            
            item.addEventListener('click', () => {
                window.location.href = `/views/pages/perfil-publico.html?id=${artista.id_artista}`;
            });
            subGrid.appendChild(item);
        });
        divArtistas.appendChild(subGrid);
        wrapperPesquisa.appendChild(divArtistas);
    }

    // --- RENDERIZANDO OBRAS ENCONTRADAS ---
    if (obras && obras.length > 0) {
        const divObras = document.createElement('div');
        divObras.innerHTML = `<h3 style="color: #fff; margin-bottom: 15px; font-size: 20px; border-bottom: 1px solid #333; padding-bottom: 5px;">Obras</h3>`;

        const subGridObras = document.createElement('div');
        subGridObras.className = "explore-grid"; 
        subGridObras.style = "display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; grid-auto-rows: dense;";

        obras.forEach(obra => {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';

            const img = document.createElement('img');
            img.src = obra.imagem_post || obra.imagem_url || 'https://placehold.co/600x400/222/fff?text=Sem+Imagem';
            img.alt = obra.titulo || obra.legenda;
            img.classList.add('art-image');

            img.addEventListener('click', () => {
                const idDonoObra = obra.id_artista || obra.id_usuario || 1;
                abrirFotoEmTelaCheia(img.src, idDonoObra);
            });

            gridItem.appendChild(img);
            subGridObras.appendChild(gridItem);
        });

        divObras.appendChild(subGridObras);
        wrapperPesquisa.appendChild(divObras);
    }

    // --- RENDERIZANDO TAGS ENCONTRADAS ---
    if (tags && tags.length > 0) {
        const divTags = document.createElement('div');
        divTags.innerHTML = `<h3 style="color: #fff; margin-bottom: 15px; font-size: 20px; border-bottom: 1px solid #333; padding-bottom: 5px;">Tags e Estilos</h3>`;
        
        const tagBox = document.createElement('div');
        tagBox.style = "display: flex; flex-wrap: wrap; gap: 10px;";

        tags.forEach(tag => {
            const badge = document.createElement('span');
            badge.style = "background: #222; color: #007bff; padding: 8px 16px; border-radius: 20px; font-weight: 500; cursor: pointer; border: 1px solid #333; transition: 0.2s;";
            badge.textContent = `#${tag.nome_categoria}`;
            
            badge.addEventListener('click', () => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = tag.nome_categoria;
                    realizarPesquisa(tag.nome_categoria);
                }
            });
            tagBox.appendChild(badge);
        });
        divTags.appendChild(tagBox);
        wrapperPesquisa.appendChild(divTags);
    }

    container.appendChild(wrapperPesquisa);
}

// ==========================================================================
// 3. EXIBIÇÃO DE MODAL EM TELA CHEIA (CONEXÃO COM PERFIL PÚBLICO)
// ==========================================================================
function abrirFotoEmTelaCheia(urlDaImagem, idArtista) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    
    if (modal && modalImg) {
        modalImg.src = urlDaImagem;
        modal.style.display = 'flex';

        const botaoAntigo = modal.querySelector('.btn-visitar-perfil');
        if (botaoAntigo) botaoAntigo.remove();

        if (idArtista) {
            const btnPerfil = document.createElement('button');
            btnPerfil.className = 'btn-visitar-perfil';
            btnPerfil.textContent = 'Ver Perfil do Artista';
            
            btnPerfil.style = `
                position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
                background: rgba(0, 123, 255, 0.85); color: #fff; border: none;
                padding: 12px 24px; border-radius: 25px; font-weight: 600; cursor: pointer;
                font-size: 15px; transition: 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                backdrop-filter: blur(5px); z-index: 1001;
            `;

            btnPerfil.addEventListener('mouseenter', () => btnPerfil.style.background = '#007bff');
            btnPerfil.addEventListener('mouseleave', () => btnPerfil.style.background = 'rgba(0, 123, 255, 0.85)');

            btnPerfil.addEventListener('click', (e) => {
                e.stopPropagation(); 
                window.location.href = `/views/pages/perfil-publico.html?id=${idArtista}`;
            });

            modal.appendChild(btnPerfil);
        }
    }
}

function configurarEventosDoModal() {
    const modal = document.getElementById('image-modal');
    const botaoFechar = document.querySelector('.modal-close');

    if (!modal) return;

    if (botaoFechar) {
        botaoFechar.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// INICIALIZADOR DA PÁGINA
window.addEventListener('DOMContentLoaded', () => {
    renderizarGridExplorar();
    configurarEventosDoModal();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let timeoutBusca = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutBusca);
            const termo = e.target.value;
            
            timeoutBusca = setTimeout(() => {
                realizarPesquisa(termo);
            }, 400);
        });
    }
});