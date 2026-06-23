// views/js/perfil-publico.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. CAPTURAR OS IDS DA URL E DA SESSÃO
    const urlParams = new URLSearchParams(window.location.search);
    const idVisitado = urlParams.get('id');

    let idLogado = sessionStorage.getItem('idArtistaLogado') || sessionStorage.getItem('id_artista');

    console.log("ID do artista visitado:", idVisitado);
    console.log("ID do artista logado (Sessão):", idLogado);

    // Teste temporário caso não tenha feito login
    if (!idLogado) {
        console.warn("Aviso: idArtistaLogado está null no sessionStorage. Usando ID de teste temporário (2).");
        idLogado = 2;
    }

    // Elementos da tela
    const artistaNome = document.getElementById('artista-nome');
    const artistaBio = document.getElementById('artista-bio');
    const artistaFoto = document.getElementById('artista-foto');
    const btnSeguir = document.getElementById('btn-seguir');
    const btnMensagem = document.getElementById('btn-mensagem');
    const feedArtista = document.getElementById('feed-artista');

    if (!idVisitado) {
        alert('Erro: Nenhum artista foi selecionado.');
        window.location.href = '/views/pages/home.html';
        return;
    }

    if (idVisitado == idLogado) {
        window.location.href = '/views/pages/perfil.html';
        return;
    }

    // ========================================================
    // 2. BUSCAR DADOS DO PERFIL (NOME, FOTO, STATUS SEGUIDOR)
    // ========================================================
    async function carregarPerfil() {
        try {
            // CORREÇÃO: Removido o '/api' para bater com a linha 58 do seu server.js
            console.log(`Buscando perfil em: http://localhost:3000/artistas/perfil-publico/${idVisitado}/${idLogado}`);
            const response = await fetch(`http://localhost:3000/artistas/perfil-publico/${idVisitado}/${idLogado}`);

            if (!response.ok) {
                throw new Error(`Erro na rota do perfil: Status ${response.status}`);
            }

            const artista = await response.json();
            console.log("Dados do artista recebidos:", artista);

            if (artistaNome) artistaNome.textContent = artista.nome || 'Sem nome';
            if (artistaBio) artistaBio.textContent = artista.biografia || 'Nenhuma biografia disponível.';
            if (artistaFoto) {
                artistaFoto.src = artista.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                artistaFoto.style.display = 'block';
            }

            if (artista.seguindo > 0) {
                if (btnSeguir) {
                    btnSeguir.textContent = 'Seguindo';
                    btnSeguir.style.background = '#333';
                    btnSeguir.style.color = '#fff';
                }
                if (btnMensagem) btnMensagem.style.display = 'block';
            } else {
                if (btnSeguir) {
                    btnSeguir.textContent = 'Seguir';
                    btnSeguir.style.background = '#fff';
                    btnSeguir.style.color = '#000';
                }
                if (btnMensagem) btnMensagem.style.display = 'none';
            }

        } catch (error) {
            console.error('Erro crítico ao carregar dados do perfil:', error);
            if (artistaNome) artistaNome.textContent = "Erro ao carregar artista";
        }
    }

    // ========================================================
    // 3. BUSCAR PUBLICAÇÕES (FEED EXCLUSIVO DESTE ARTISTA)
    // ========================================================
    async function carregarFeedArtista() {
        try {
            // CORREÇÃO: Removido o '/api' para buscar na rota certa do artistasRoutes
            console.log(`Buscando feed em: http://localhost:3000/artistas/postagens/artista/${idVisitado}`);
            const response = await fetch(`http://localhost:3000/artistas/postagens/artista/${idVisitado}`);

            if (!response.ok) {
                throw new Error(`Erro na rota do feed: Status ${response.status}`);
            }

            const posts = await response.json();
            console.log("Posts recebidos do artista:", posts);

            if (!feedArtista) return;
            feedArtista.innerHTML = '';

            if (posts.length === 0) {
                feedArtista.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">Este artista ainda não fez nenhuma publicação.</p>';
                return;
            }

            posts.forEach(post => {
                const postElement = document.createElement('article');
                postElement.classList.add('post-card');
                postElement.style = "background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333;";

                postElement.innerHTML = `
                    <div class="post-body">
                        <p style="color: #ddd; margin-bottom: 12px; font-size: 15px;">${post.legenda || ''}</p>
                        ${post.imagem_post ? `<img src="${post.imagem_post}" style="width: 100%; max-height: 450px; border-radius: 8px; object-fit: contain; background: #111;">` : ''}
                    </div>
                `;
                feedArtista.appendChild(postElement);
            });

        } catch (error) {
            console.error('Erro crítico ao carregar feed do artista:', error);
            if (feedArtista) feedArtista.innerHTML = '<p style="color: red;">Não foi possível carregar as publicações.</p>';
        }
    }

    // ========================================================
    // 4. FUNCIONAMENTO DO BOTÃO SEGUIR / DEIXAR DE SEGUIR
    // ========================================================
    if (btnSeguir) {
        btnSeguir.addEventListener('click', async () => {
            try {
                // OBSERVAÇÃO: Na linha 60 do seu server.js está app.use('/seguidores', ...), então tiramos o /api daqui também
                const response = await fetch('http://localhost:3000/seguidores/seguir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_seguidor: idLogado, id_seguido: idVisitado })
                });

                if (response.ok) {
                    const resultado = await response.json();
                    console.log("Resultado da ação de seguir:", resultado);
                    carregarPerfil();
                } else {
                    console.error("Servidor rejeitou a requisição de seguir");
                }
            } catch (error) {
                console.error('Erro ao processar ação de seguir:', error);
            }
        });
    }

    // ========================================================
    // 5. FUNCIONAMENTO DO BOTÃO ENVIAR MENSAGEM
    // ========================================================
    if (btnMensagem) {
        btnMensagem.addEventListener('click', () => {
            sessionStorage.setItem('idConversaAtiva', idVisitado);
            window.location.href = '/views/pages/chat.html';
        });
    }

    carregarPerfil();
    carregarFeedArtista();
});