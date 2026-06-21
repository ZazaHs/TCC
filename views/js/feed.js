// views/js/feed.js
document.addEventListener('DOMContentLoaded', () => {
    const formNovoPost = document.getElementById('form-novo-post');
    const inputImagem = document.getElementById('post-imagem-arquivo');
    const nomeArquivoTxt = document.getElementById('nome-arquivo-selecionado');
    const feedContainer = document.getElementById('feed-posts');

    const idArtistaLogado = sessionStorage.getItem('idArtistaLogado');

    // 1. ATUALIZAR O NOME DO ARQUIVO SELECIONADO NA TELA
    if (inputImagem) {
        inputImagem.addEventListener('change', (e) => {
            const nomeArquivo = e.target.files[0]?.name || 'Nenhum arquivo selecionado';
            nomeArquivoTxt.textContent = nomeArquivo;
        });
    }

    // 2. ENVIAR UMA NOVA POSTAGEM PARA O BACK-END
    if (formNovoPost) {
        formNovoPost.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!idArtistaLogado) {
                alert('Erro: Faça login novamente.');
                return;
            }

            const legenda = document.getElementById('post-legenda').value;
            const arquivo = inputImagem.files[0];

            if (!arquivo) {
                alert('Selecione uma imagem.');
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(arquivo);
            reader.onloadend = async () => {
                const imagemBase64 = reader.result;

                try {
                    const response = await fetch('http://localhost:3000/api/postagens', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_artista: idArtistaLogado,
                            legenda: legenda,
                            imagem_post: imagemBase64
                        })
                    });

                    if (response.ok) {
                        alert('Arte publicada!');
                        formNovoPost.reset();
                        nomeArquivoTxt.textContent = 'Nenhum arquivo selecionado';
                        carregarFeed(); // Atualiza o feed na hora
                    } else {
                        alert('Falha ao publicar publicação.');
                    }
                } catch (error) {
                    console.error('Erro ao conectar com o servidor:', error);
                    alert('Erro ao conectar com o servidor.');
                }
            };
        });
    }

    // 3. CARREGAR E RENDERIZAR TODAS AS POSTAGENS NO FEED (VERSÃO ATUALIZADA COM LINK)
    async function carregarFeed() {
        if (!feedContainer) return;
        try {
            const response = await fetch('http://localhost:3000/api/postagens');
            const posts = await response.json();
            feedContainer.innerHTML = '';

            if (posts.length === 0) {
                feedContainer.innerHTML = '<p style="text-align:center; color: #888;">Nenhuma publicação ainda.</p>';
                return;
            }

            posts.forEach(post => {
                const fotoPerfil = post.artista_foto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                const postElement = document.createElement('article');
                postElement.classList.add('post-card');

                // Verifica se o post atual pertence ao usuário que está logado na sessão
                const ehDonoDoPost = post.id_artista === parseInt(idArtistaLogado);

                // ATUALIZAÇÃO AQUI: O nome do artista virou um link dinâmico para o perfil público dele
                postElement.innerHTML = `
                    <div class="post-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${fotoPerfil}" class="post-avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                            
                            <a href="/views/pages/perfil-publico.html?id=${post.id_artista}" class="link-artista" style="color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; transition: 0.2s;">
                                ${post.artista_nome}
                            </a>
                        </div>
                        
                        ${ehDonoDoPost ? `
                            <button class="btn-deletar-post" data-id="${post.id_post}" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 18px; padding: 5px;" title="Apagar Publicação">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                    <div class="post-body">
                        <p style="color: #ddd; margin-bottom: 10px;">${post.legenda}</p>
                        <img src="${post.imagem_post}" class="post-imagem" style="width: 100%; max-height: 500px; border-radius: 8px; object-fit: contain; background: #111;">
                    </div>
                    <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
                `;
                feedContainer.appendChild(postElement);
            });

            // Ativa os cliques das lixeiras após desenhar os cards na tela
            adicionarEventosDeExclusao();

        } catch (error) {
            console.error('Erro ao carregar o feed:', error);
        }
    }

    // 4. FUNÇÃO QUE ESCUTA O CLIQUE NO BOTÃO DE DELETAR
    function adicionarEventosDeExclusao() {
        const botoesDeletar = document.querySelectorAll('.btn-deletar-post');

        botoesDeletar.forEach(botao => {
            botao.removeEventListener('click', deletarHandler); // Evita duplicar cliques na memória
            botao.addEventListener('click', deletarHandler);
        });
    }

    async function deletarHandler(e) {
        // Garante pegar o botão mesmo se clicar direto no emoji de lixeira
        const botao = e.target.closest('.btn-deletar-post');
        const idPost = botao.getAttribute('data-id');

        const confirmar = confirm('Tem certeza que deseja apagar esta publicação da sua galeria?');

        if (confirmar) {
            try {
                const response = await fetch(`http://localhost:3000/api/postagens/${idPost}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_artista: idArtistaLogado })
                });

                if (response.ok) {
                    alert('Publicação excluída com sucesso!');
                    carregarFeed(); // Recarrega o feed na hora
                } else {
                    const erro = await response.json();
                    alert('Erro ao excluir: ' + erro.error);
                }
            } catch (error) {
                console.error('Erro na requisição de exclusão:', error);
                alert('Erro ao conectar com o servidor.');
            }
        }
    }

    // Inicializa carregando os posts na tela
    carregarFeed();
});