document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-novo-post');
    const feedContainer = document.getElementById('feed-posts');
    const inputArquivo = document.getElementById('post-imagem-arquivo');
    const textoNomeArquivo = document.getElementById('nome-arquivo-selecionado');

    // =======================================================
    // BLINDAGEM DE ID E ATUALIZAÇÃO DA SIDEBAR (GERENCIAMENTO DE SESSÃO)
    // =======================================================
    const urlParams = new URLSearchParams(window.location.search);
    let idArtista = urlParams.get('id');

    // Varre a sessão se não encontrar na URL
    if (!idArtista || idArtista === 'undefined' || idArtista === 'null') {
        idArtista = sessionStorage.getItem('idArtistaLogado') || 
                    sessionStorage.getItem('id_artista') || 
                    sessionStorage.getItem('idUsuario');
    }

    console.log("🏠 Home ativa gerenciando o Artista ID:", idArtista);

    if (idArtista) {
        // Salva de volta na sessão para garantir persistência
        sessionStorage.setItem('id_artista', idArtista);

        // Ajusta a barra de endereços para manter o visual limpo (?id=X)
        window.history.replaceState(null, '', `home.html?id=${idArtista}`);

        // Injeta o ID atualizado em todos os links da Sidebar dinamicamente ao carregar a página
        document.querySelectorAll('.sidebar a').forEach(link => {
            const hrefOriginal = link.getAttribute('href');
            if (hrefOriginal && !hrefOriginal.includes('?id=')) {
                link.href = `${hrefOriginal}?id=${idArtista}`;
            }
        });
    }

    // Tenta recuperar os dados completos salvos no localStorage para usar o nome real do artista
    let nomeUsuarioLogado = "seu_usuario";
    const dadosLocais = localStorage.getItem('usuarioLogado');
    if (dadosLocais) {
        try {
            const usuarioObj = JSON.parse(dadosLocales);
            nomeUsuarioLogado = usuarioObj.nome || usuarioObj.username || "artista";
        } catch (e) {
            console.error("Erro ao ler dados do localStorage", e);
        }
    }

    if (!form || !feedContainer) return;

    // EVENTO AUXILIAR: Mostra o nome do arquivo selecionado na tela
    inputArquivo.addEventListener('change', () => {
        if (inputArquivo.files.length > 0) {
            textoNomeArquivo.textContent = inputArquivo.files[0].name;
        } else {
            textoNomeArquivo.textContent = "Nenhum arquivo selecionado";
        }
    });

    // EVENTO PRINCIPAL: Envio do Formulário (Post)
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const legendaTexto = document.getElementById('post-legenda').value;
        const arquivo = inputArquivo.files[0];

        if (!arquivo) {
            alert("Por favor, selecione uma imagem!");
            return;
        }

        const leitor = new FileReader();

        leitor.onload = function(e) {
            const urlImagemConvertida = e.target.result; // Imagem convertida em Base64

            const novoPostElemento = document.createElement('article');
            novoPostElemento.classList.add('post');

            let totalLikes = 0;
            let jaCurtiu = false;

            // Substituído o 'seu_usuario' estático pela variável 'nomeUsuarioLogado' real
            novoPostElemento.innerHTML = `
                <header class="post-header">
                    <div class="user-info">
                        <div class="avatar-small"></div>
                        <strong>${nomeUsuarioLogado}</strong>
                    </div>
                    <button class="btn-deletar" title="Excluir publicação">&times;</button>
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

            // LÓGICA DE EXCLUIR O POST
            const botaoDeletar = novoPostElemento.querySelector('.btn-deletar');
            botaoDeletar.addEventListener('click', () => {
                const confirmar = confirm("Tem certeza que deseja excluir esta publicação?");
                if (confirmar) novoPostElemento.remove();
            });

            // LÓGICA DO LIKE 
            const botaoLike = novoPostElemento.querySelector('.like-btn');
            const iconeCoracao = novoPostElemento.querySelector('.icone-coracao');
            const displayLikes = novoPostElemento.querySelector('.numero-likes');

            botaoLike.addEventListener('click', () => {
                if (!jaCurtiu) {
                    totalLikes++;
                    iconeCoracao.textContent = '❤️';
                    botaoLike.classList.add('curtido');
                    jaCurtiu = true;
                } else {
                    totalLikes--;
                    iconeCoracao.textContent = '🤍';
                    botaoLike.classList.remove('curtido');
                    jaCurtiu = false;
                }
                displayLikes.textContent = totalLikes.toLocaleString('pt-BR');
            });

            // LÓGICA DOS COMENTÁRIOS
            const formComentario = novoPostElemento.querySelector('.comment-form');
            const inputComentario = novoPostElemento.querySelector('.comment-input');
            const listaComentarios = novoPostElemento.querySelector('.comments-list');

            formComentario.addEventListener('submit', (e) => {
                e.preventDefault();
                const textoComentario = inputComentario.value.trim();
                if (textoComentario === '') return;

                const novoComentario = document.createElement('p');
                novoComentario.classList.add('comment-item');
                novoComentario.innerHTML = `<strong>visitante</strong> ${textoComentario}`;

                listaComentarios.appendChild(novoComentario);
                inputComentario.value = '';
            });

            // Injeta no topo do feed
            feedContainer.prepend(novoPostElemento);
            
            // Limpa o formulário e reseta o texto do arquivo
            form.reset();
            textoNomeArquivo.textContent = "Nenhum arquivo selecionado";
        };

        leitor.readAsDataURL(arquivo);
    });
});