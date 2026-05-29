// views/js/chat.js
document.addEventListener('DOMContentLoaded', () => {
    const listaContatosContainer = document.getElementById('lista-contatos');
    const chatMensagens = document.getElementById('chat-mensagens');
    const mensagemInput = document.getElementById('mensagem-input');
    const btnEnviar = document.getElementById('btn-enviar-mensagem');
    
    const janelaChatAtiva = document.getElementById('janela-chat-ativa');
    const chatVazio = document.getElementById('chat-vazio');
    
    const conversaNome = document.getElementById('conversa-nome');
    const conversaBio = document.getElementById('conversa-bio');
    const conversaFoto = document.getElementById('conversa-foto');

    // Resgata o ID do artista logado (definido lá na Home/Login)
    const idLogado = sessionStorage.getItem('idArtistaLogado');
    let idDestinatarioAtual = null;
    let intervaloChat = null; // Guardará o atualizador automático de mensagens

    if (!idLogado) {
        alert('Erro: Usuário não identificado. Faça login novamente para usar o chat.');
        return;
    }

    // ==========================================
    // 1. CARREGAR ARTISTAS NA BARRA LATERAL
    // ==========================================
    async function carregarContatos() {
        try {
            const response = await fetch(`http://localhost:3000/api/mensagens/contatos/${idLogado}`);
            const artistas = await response.json();
            
            listaContatosContainer.innerHTML = '';

            if (artistas.length === 0) {
                listaContatosContainer.innerHTML = '<p style="color: #888; font-size: 14px;">Nenhum outro artista cadastrado.</p>';
                return;
            }

            artistas.forEach(artista => {
                const foto = artista.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                const contatoDiv = document.createElement('div');
                
                // Estilização rápida via JS para manter o padrão escuro do Amnesia
                contatoDiv.style = "display: flex; align-items: center; gap: 12px; padding: 12px; background: #222; border-radius: 8px; cursor: pointer; transition: 0.2s; border: 1px solid #333;";
                contatoDiv.innerHTML = `
                    <img src="${foto}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #444;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: #fff; font-weight: bold; font-size: 15px;">${artista.nome}</span>
                        <span style="color: #888; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;">${artista.biografia || 'Clique para conversar'}</span>
                    </div>
                `;

                // Efeito hover simples
                contatoDiv.addEventListener('mouseenter', () => contatoDiv.style.background = '#2a2a2a');
                contatoDiv.addEventListener('mouseleave', () => contatoDiv.style.background = '#222');

                // Quando clicar no artista, abre o chat com ele
                contatoDiv.addEventListener('click', () => abrirConversa(artista));
                listaContatosContainer.appendChild(contatoDiv);
            });
        } catch (error) {
            console.error('Erro ao carregar lista de contatos:', error);
            listaContatosContainer.innerHTML = '<p style="color: red; font-size: 12px;">Erro ao carregar contatos.</p>';
        }
    }

    // ==========================================
    // 2. ABRIR CONVERSA SELECIONADA
    // ==========================================
    function abrirConversa(artista) {
        idDestinatarioAtual = artista.id_artista;
        
        // Altera o cabeçalho do chat ativo com as informações do contato
        conversaNome.textContent = artista.nome;
        conversaBio.textContent = artista.biografia || 'Artista Amnesia';
        conversaFoto.src = artista.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        conversaFoto.style.display = 'block';

        // Alterna os contêineres na tela
        chatVazio.style.display = 'none';
        janelaChatAtiva.style.display = 'flex';

        // Carrega o histórico imediatamente
        carregarMensagens();

        // Cria um timer para atualizar o chat a cada 2.5 segundos (Simula o tempo real)
        if (intervaloChat) clearInterval(intervaloChat);
        intervaloChat = setInterval(carregarMensagens, 2500);
    }

    // ==========================================
    // 3. BUSCAR HISTÓRICO (MANTENDO O PADRÃO 'CONTEUDO')
    // ==========================================
    async function carregarMensagens() {
        if (!idDestinatarioAtual) return;

        try {
            const response = await fetch(`http://localhost:3000/api/mensagens/historico/${idLogado}/${idDestinatarioAtual}`);
            const mensagens = await response.json();

            chatMensagens.innerHTML = '';

            mensagens.forEach(msg => {
                // Define se a mensagem foi enviada por você ou recebida do outro
                const ehMinha = msg.id_remetente == idLogado;
                const tipoClasse = ehMinha ? 'sent' : 'received';
                
                // Formata o horário da mensagem
                const hora = new Date(msg.data_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const msgElement = document.createElement('div');
                msgElement.className = `message ${tipoClasse}`;
                
                // IMPORTANTE: Aqui usamos msg.conteudo para combinar com a sua rota!
                msgElement.innerHTML = `
                    <div class="bubble">${msg.conteudo}</div>
                    <span class="timestamp">${hora}</span>
                `;
                chatMensagens.appendChild(msgElement);
            });

            // Rola o scroll do chat lá para baixo de forma suave para ver as últimas mensagens
            chatMensagens.scrollTop = chatMensagens.scrollHeight;

        } catch (error) {
            console.error('Erro ao buscar histórico de mensagens:', error);
        }
    }

    // ==========================================
    // 4. ENVIAR NOVA MENSAGEM
    // ==========================================
    async function enviarMensagem() {
        const texto = mensagemInput.value.trim();
        if (!texto || !idDestinatarioAtual) return;

        try {
            const response = await fetch('http://localhost:3000/api/mensagens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Enviamos id_remetente, id_destinatario e conteudo exatamente como pede o seu POST
                body: JSON.stringify({
                    id_remetente: idLogado,
                    id_destinatario: idDestinatarioAtual,
                    conteudo: texto
                })
            });

            if (response.ok) {
                mensagemInput.value = ''; // Limpa a caixinha de texto
                carregarMensagens();     // Atualiza a tela de mensagens na hora
            } else {
                console.error('Servidor recusou a mensagem');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem para o servidor:', error);
        }
    }

    // Escutadores de eventos para o botão Enviar e para a tecla Enter
    btnEnviar.addEventListener('click', enviarMensagem);
    mensagemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            enviarMensagem();
        }
    });

    // Inicializa a listagem de artistas ao abrir a página
    carregarContatos();
});