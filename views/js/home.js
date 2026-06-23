document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-novo-post');
    const feedContainer = document.getElementById('feed-posts');
    const inputArquivo = document.getElementById('post-imagem-arquivo');
    const textoNomeArquivo = document.getElementById('nome-arquivo-selecionado');

    // Variáveis do Modal (CORRIGIDO: Alterado de 'modal' para 'modalCriarPost')
    const modalCriarPost = document.getElementById('modal-criar-post');
    const btnAbrirModal = document.getElementById('btn-abrir-modal-post');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    // =======================================================
    // CONTROLE DE ABERTURA E FECHAMENTO DO MODAL
    // =======================================================
    if (btnAbrirModal && modalCriarPost) {
        btnAbrirModal.addEventListener('click', (e) => {
            e.preventDefault();
            modalCriarPost.style.display = 'flex'; // Abre o modal centralizado
        });
    }

    if (btnFecharModal && modalCriarPost) {
        btnFecharModal.addEventListener('click', () => {
            modalCriarPost.style.display = 'none'; // Fecha no botão X
        });
    }

    // Fecha o modal se o usuário clicar na parte escura de fora dele
    if (modalCriarPost) {
        modalCriarPost.addEventListener('click', (e) => {
            if (e.target === modalCriarPost) {
                modalCriarPost.style.display = 'none';
            }
        });
    }

    // =======================================================
    // GERENCIAMENTO DE SESSÃO
    // =======================================================
    const urlParams = new URLSearchParams(window.location.search);
    let idArtista = urlParams.get('id');

    if (!idArtista || idArtista === 'undefined' || idArtista === 'null') {
        idArtista = sessionStorage.getItem('idArtistaLogado') ||
            sessionStorage.getItem('id_artista') ||
            sessionStorage.getItem('idUsuario');
    }

    const idLogadoReal = idArtista ? parseInt(idArtista) : 1;

    if (idArtista) {
        sessionStorage.setItem('id_artista', idArtista);
        window.history.replaceState(null, '', `home.html?id=${idArtista}`);
        document.querySelectorAll('.sidebar a').forEach(link => {
            const hrefOriginal = link.getAttribute('href');
            if (hrefOriginal && !hrefOriginal.includes('?id=')) {
                link.href = `${hrefOriginal}?id=${idArtista}`;
            }
        });
    }

    let nomeUsuarioLogado = "artista";
    const dadosLocais = localStorage.getItem('usuarioLogado');
    if (dadosLocais) {
        try {
            const usuarioObj = JSON.parse(dadosLocais);
            nomeUsuarioLogado = usuarioObj.nome || usuarioObj.username || "artista";
        } catch (e) {
            console.error("Erro ao ler dados do localStorage", e);
        }
    }

    // =======================================================
    // CARREGAMENTO DINÂMICO DO FEED HÍBRIDO
    // =======================================================
    async function carregarFeedBanco() {
        if (!feedContainer) return;

        feedContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Carregando publicações...</p>';

        try {
            const resposta = await fetch(`http://localhost:3000/api/postagens/feed/${idLogadoReal}`);
            if (!resposta.ok) throw new Error("Erro na requisição do feed.");

            const postagens = await resposta.json();

            if (!postagens || postagens.length === 0) {
                feedContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Nenhuma publicação encontrada.</p>';
                return;
            }

            feedContainer.innerHTML = '';

            postagens.forEach(post => {
                const novoPostElemento = document.createElement('article');
                novoPostElemento.classList.add('post');

                const coracaoInicial = post.usuario_ja_curtiu === 1 ? '❤️' : '🤍';
                const classeCurtido = post.usuario_ja_curtiu === 1 ? 'curtido' : '';

                const ehMeuPost = post.id_artista == idLogadoReal;
                const botaoDeletarHtml = ehMeuPost
                    ? `<button class="btn-deletar" title="Excluir publicação" style="background: none; border: none; color: #ff3b30; font-size: 22px; cursor: pointer; padding: 0 5px;">&times;</button>`
                    : '';

                novoPostElemento.innerHTML = `
                    <header class="post-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="user-info" style="cursor: pointer;">
                            <div class="avatar-small"></div>
                            <strong>${post.nome_artista || 'Artista'}</strong>
                            ${post.prioridade_seguindo === 1 ? '<span style="background: #007bff; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 10px; font-weight: 600;">Seguindo</span>' : ''}
                        </div>
                        ${botaoDeletarHtml}
                    </header>
                    
                    <div class="post-image">
                        <img src="${post.imagem_post}" alt="Foto postada">
                    </div>

                    <div class="post-actions">
                        <div class="interaction-group">
                            <button class="like-btn ${classeCurtido}">
                                <span class="icone-coracao">${coracaoInicial}</span>
                            </button>
                            <div class="likes-count">
                                <span class="numero-likes">${post.total_likes || 0}</span> curtidas
                            </div>
                        </div>
                    </div>

                    <div class="post-content">
                        <p><strong>${post.nome_artista || 'Artista'}</strong> ${post.legenda || ''}</p>
                    </div>

                    <div class="comments-section">
                        <div class="comments-list"></div>
                        <form class="comment-form">
                            <input type="text" class="comment-input" placeholder="Adicione um comentário..." required>
                            <button type="submit" class="btn-comment-post">Publicar</button>
                        </form>
                    </div>
                `;

                if (ehMeuPost) {
                    const btnDel = novoPostElemento.querySelector('.btn-deletar');
                    btnDel.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const confirmar = confirm("Tem certeza que deseja excluir permanentemente esta publicação?");
                        if (!confirmar) return;

                        try {
                            const respostaDel = await fetch(`http://localhost:3000/api/postagens/${post.id_post}`, {
                                method: 'DELETE'
                            });

                            if (respostaDel.ok) {
                                novoPostElemento.remove();
                                if (feedContainer.children.length === 0) {
                                    feedContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Nenhuma publicação encontrada.</p>';
                                }
                            } else {
                                alert("Erro ao deletar postagem no servidor.");
                            }
                        } catch (err) {
                            console.error("Erro ao deletar post:", err);
                        }
                    });
                }

                configurarInteracoesDoCard(novoPostElemento, post.id_post);

                novoPostElemento.querySelector('.user-info').addEventListener('click', () => {
                    window.location.href = `/views/pages/perfil-publico.html?id=${post.id_artista}`;
                });

                feedContainer.appendChild(novoPostElemento);
            });

        } catch (error) {
            console.error("⚠️ Erro ao carregar feed:", error);
            feedContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Não foi possível carregar o feed.</p>';
        }
    }

    // =======================================================
    // LÓGICA ASSÍNCRONA DE INTERAÇÕES
    // =======================================================
    async function configurarInteracoesDoCard(elementoPost, idPost) {
        const botaoLike = elementoPost.querySelector('.like-btn');
        const iconeCoracao = elementoPost.querySelector('.icone-coracao');
        const displayLikes = elementoPost.querySelector('.numero-likes');

        const formComentario = elementoPost.querySelector('.comment-form');
        const inputComentario = elementoPost.querySelector('.comment-input');
        const listaComentarios = elementoPost.querySelector('.comments-list');

        if (idPost) {
            try {
                const resComments = await fetch(`http://localhost:3000/api/postagens/${idPost}/comentarios`);
                if (resComments.ok) {
                    const comentarios = await resComments.json();
                    comentarios.forEach(c => {
                        const pComentario = document.createElement('p');
                        pComentario.classList.add('comment-item');
                        pComentario.innerHTML = `<strong>${c.nome_artista}</strong> ${c.texto}`;
                        listaComentarios.appendChild(pComentario);
                    });
                }
            } catch (err) {
                console.error("Erro ao carregar comentários do post:", idPost, err);
            }
        }

        // --- LÓGICA DE CURTIR (BLINDADA CONTRA NEGATIVOS) ---
        botaoLike.addEventListener('click', async () => {
            if (!idPost) return alert("Salve o post primeiro para poder curtir!");

            // Previne spam de cliques repetidos
            if (botaoLike.dataset.processando === "true") return;
            botaoLike.dataset.processando = "true";

            try {
                const resposta = await fetch('http://localhost:3000/api/postagens/curtir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_post: idPost, id_artista: idLogadoReal })
                });

                if (resposta.ok) {
                    const resultado = await resposta.json();
                    let atualLikes = parseInt(displayLikes.textContent) || 0;

                    if (resultado.curtido) {
                        atualLikes++;
                        iconeCoracao.textContent = '❤️';
                        botaoLike.classList.add('curtido');
                    } else {
                        atualLikes = Math.max(0, atualLikes - 1);
                        iconeCoracao.textContent = '🤍';
                        botaoLike.classList.remove('curtido');
                    }
                    displayLikes.textContent = atualLikes;
                } else {
                    console.error("Erro na resposta de curtida:", resposta.status);
                }
            } catch (err) {
                console.error("Erro ao processar curtida:", err);
            } finally {
                // Libera o botão para o próximo clique
                botaoLike.dataset.processando = "false";
            }
        });

        formComentario.addEventListener('submit', async (e) => {
            e.preventDefault();
            const textoComentario = inputComentario.value.trim();
            if (textoComentario === '' || !idPost) return;

            try {
                const resposta = await fetch('http://localhost:3000/api/postagens/comentar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_post: idPost,
                        id_artista: idLogadoReal,
                        texto: textoComentario
                    })
                });

                if (resposta.ok) {
                    const novoComentario = document.createElement('p');
                    novoComentario.classList.add('comment-item');
                    novoComentario.innerHTML = `<strong>${nomeUsuarioLogado}</strong> ${textoComentario}`;

                    listaComentarios.appendChild(novoComentario);
                    inputComentario.value = '';
                } else {
                    alert("Não foi possível enviar o comentário.");
                }
            } catch (err) {
                console.error("Erro ao enviar comentário:", err);
            }
        });
    }

    carregarFeedBanco();

    // =======================================================
    // ENVIO DE NOVAS POSTAGENS
    // =======================================================
    if (!form || !feedContainer) return;

    inputArquivo.addEventListener('change', () => {
        if (inputArquivo.files.length > 0) {
            textoNomeArquivo.textContent = inputArquivo.files[0].name;
        } else {
            textoNomeArquivo.textContent = "Nenhum arquivo selecionado";
        }
    });

    form.dataset.enviando = "false";

    form.onsubmit = function (event) {
        event.preventDefault();

        if (form.dataset.enviando === "true") return;

        const legendaTexto = document.getElementById('post-legenda').value;
        const arquivo = inputArquivo.files[0];
        const botaoSubmeter = form.querySelector('button[type="submit"]');

        if (!arquivo) {
            alert("Por favor, selecione uma imagem!");
            return;
        }

        form.dataset.enviando = "true";
        if (botaoSubmeter) {
            botaoSubmeter.disabled = true;
            botaoSubmeter.textContent = "Publicando...";
            botaoSubmeter.style.opacity = "0.5";
        }

        const leitor = new FileReader();

        leitor.onload = async function (e) {
            if (form.dataset.requestDisparada === "true") return;
            form.dataset.requestDisparada = "true";

            const urlImagemConvertida = e.target.result;

            try {
                const resposta = await fetch('http://localhost:3000/api/postagens/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_artista: idLogadoReal,
                        imagem_post: urlImagemConvertida,
                        legenda: legendaTexto
                    })
                });

                if (!resposta.ok) throw new Error("Erro ao salvar publicação.");

                const dadosResultado = await resposta.json();

                const novoPostElemento = document.createElement('article');
                novoPostElemento.classList.add('post');

                novoPostElemento.innerHTML = `
                    <header class="post-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="user-info">
                            <div class="avatar-small"></div>
                            <strong>${nomeUsuarioLogado}</strong>
                        </div>
                        <button class="btn-deletar" title="Excluir publicação" style="background: none; border: none; color: #ff3b30; font-size: 22px; cursor: pointer; padding: 0 5px;">&times;</button>
                    </header>
                    <div class="post-image">
                        <img src="${urlImagemConvertida}" alt="Foto postada">
                    </div>
                    <div class="post-actions">
                        <div class="interaction-group">
                            <button class="like-btn">
                                <span class="icone-coracao">🤍</span>
                            </button>
                            <div class="likes-count">
                                <span class="numero-likes">0</span> curtidas
                            </div>
                        </div>
                    </div>
                    <div class="post-content">
                        <p><strong>${nomeUsuarioLogado}</strong> ${legendaTexto}</p>
                    </div>
                    <div class="comments-section">
                        <div class="comments-list"></div>
                        <form class="comment-form">
                            <input type="text" class="comment-input" placeholder="Adicione um comentário..." required>
                            <button type="submit" class="btn-comment-post">Publicar</button>
                        </form>
                    </div>
                `;

                const botaoDeletar = novoPostElemento.querySelector('.btn-deletar');
                botaoDeletar.addEventListener('click', async () => {
                    const confirmar = confirm("Tem certeza que deseja excluir esta publicação?");
                    if (!confirmar) return;

                    try {
                        const respostaDel = await fetch(`http://localhost:3000/api/postagens/${dadosResultado.id_post}`, {
                            method: 'DELETE'
                        });
                        if (respostaDel.ok) novoPostElemento.remove();
                    } catch (err) {
                        console.error(err);
                    }
                });

                configurarInteracoesDoCard(novoPostElemento, dadosResultado.id_post);

                const avisoVazio = feedContainer.querySelector('p');
                if (avisoVazio && (avisoVazio.textContent.includes("Nenhuma publicação") || avisoVazio.textContent.includes("O feed está vazio"))) {
                    feedContainer.innerHTML = '';
                }

                feedContainer.prepend(novoPostElemento);

                form.reset();
                textoNomeArquivo.textContent = "Nenhum arquivo selecionado";

                if (modalCriarPost) {
                    modalCriarPost.style.display = 'none';
                }

            } catch (error) {
                console.error(error);
                alert("Não foi possível publicar sua arte.");
            } finally {
                form.dataset.enviando = "false";
                form.dataset.requestDisparada = "false";
                if (botaoSubmeter) {
                    botaoSubmeter.disabled = false;
                    botaoSubmeter.textContent = "Publicar";
                    botaoSubmeter.style.opacity = "1";
                }
            }
        };

        leitor.readAsDataURL(arquivo);
    };
});