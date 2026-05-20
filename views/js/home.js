document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('form-novo-post');
    const feedContainer = document.getElementById('feed-posts');
    const inputArquivo = document.getElementById('post-imagem-arquivo');
    const textoNomeArquivo = document.getElementById('nome-arquivo-selecionado');

    if (!form || !feedContainer) return;

    // EVENTO AUXILIAR: Mostra o nome do arquivo selecionado na tela
    inputArquivo.addEventListener('change', () => {
        if (inputArquivo.files.length > 0) {
            textoNomeArquivo.textContent = inputArquivo.files[0].name;
        } else {
            textoNomeArquivo.textContent = "Nenhum arquivo selecionado";
        }
    });

    // EVENTO PRINCIPAL: Envio do Formulário
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const legendaTexto = document.getElementById('post-legenda').value;
        
        // Pega o arquivo real selecionado pelo usuário
        const arquivo = inputArquivo.files[0];

        if (!arquivo) {
            alert("Por favor, selecione uma imagem!");
            return;
        }

        // Criando o leitor de arquivos do JavaScript
        const leitor = new FileReader();

        // Essa função roda ASSIM QUE o JavaScript terminar de ler o arquivo do seu PC
        leitor.onload = function(e) {
            const urlImagemConvertida = e.target.result; // Aqui está a imagem convertida em texto/Base64

            const novoPostElemento = document.createElement('article');
            novoPostElemento.classList.add('post');

            let totalLikes = 0;
            let jaCurtiu = false;

            // Monta a estrutura usando a imagem convertida localmente
            novoPostElemento.innerHTML = `
                <header class="post-header">
                    <div class="user-info">
                        <div class="avatar-small"></div>
                        <strong>seu_usuario</strong>
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
            // LÓGICA DE EXCLUIR O POST
            // ==========================================
            const botaoDeletar = novoPostElemento.querySelector('.btn-deletar');
            botaoDeletar.addEventListener('click', () => {
                const confirmar = confirm("Tem certeza que deseja excluir esta publicação?");
                if (confirmar) novoPostElemento.remove();
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
            
            // Limpa o formulário e reseta o texto do arquivo
            form.reset();
            textoNomeArquivo.textContent = "Nenhum arquivo selecionado";
        };

        // Comando que inicia a leitura do arquivo de imagem do computador
        leitor.readAsDataURL(arquivo);
    });
});