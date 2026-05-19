document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('form-novo-post');
    const feedContainer = document.getElementById('feed-posts');

    if (!form || !feedContainer) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const legendaTexto = document.getElementById('post-legenda').value;
        const urlImagem = document.getElementById('post-url-imagem').value;

        const novoPostElemento = document.createElement('article');
        novoPostElemento.classList.add('post');

        let totalLikes = 0;
        let jaCurtiu = false;

        // Monta a estrutura, incluindo o botão de excluir (×) no cabeçalho
        novoPostElemento.innerHTML = `
            <header class="post-header">
                <div class="user-info">
                    <div class="avatar-small"></div>
                    <strong>seu_usuario</strong>
                </div>
                <button class="btn-deletar" title="Excluir publicação">&times;</button>
            </header>
            
            <div class="post-image">
                <img src="${urlImagem}" alt="Foto postada">
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
                <p><strong>seu_usuario</strong> ${legendaTexto}</p>
            </div>

            <div class="comments-section">
                <div class="comments-list"></div>
                <form class="comment-form">
                    <input type="text" class="comment-input" placeholder="Adicione um comentário..." required>
                    <button type="submit" class="btn-comment-post">Publicar</button>
                </form>
            </div>
        `;

        // ==========================================
        // LÓGICA DE EXCLUIR O POST (NOVA)
        // ==========================================
        const botaoDeletar = novoPostElemento.querySelector('.btn-deletar');
        
        botaoDeletar.addEventListener('click', () => {
            // Exibe uma caixinha de confirmação antes de apagar (ótimo para evitar cliques por erro)
            const confirmar = confirm("Tem certeza que deseja excluir esta publicação?");
            if (confirmar) {
                novoPostElemento.remove(); // Remove o post inteiro do HTML
            }
        });

        // ==========================================
        // LÓGICA DO LIKE 
        // ==========================================
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

        // ==========================================
        // LÓGICA DOS COMENTÁRIOS
        // ==========================================
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
        form.reset();
    });
});