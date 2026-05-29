document.addEventListener('DOMContentLoaded', () => {
    let idLogadoRaw = sessionStorage.getItem('idArtistaLogado');
    
    // Filtro sanitário: Corrige na hora se o ID no sessionStorage estiver corrompido com ":"
    if (idLogadoRaw && idLogadoRaw.includes(':')) {
        idLogadoRaw = idLogadoRaw.split(':')[0];
        sessionStorage.setItem('idArtistaLogado', idLogadoRaw);
    }
    
    const idLogado = idLogadoRaw;
    let idConversaAtiva = sessionStorage.getItem('idConversaAtiva');
    
    if (idConversaAtiva && idConversaAtiva.includes(':')) {
        idConversaAtiva = idConversaAtiva.split(':')[0];
        sessionStorage.setItem('idConversaAtiva', idConversaAtiva);
    }

    console.log("Chat Inicializado. Meu ID:", idLogado);
    console.log("ID da Conversa ativa:", idConversaAtiva);

    const listaContatos = document.getElementById('lista-contatos');
    const janelaChatAtiva = document.getElementById('janela-chat-ativa');
    const chatVazio = document.getElementById('chat-vazio');
    
    const conversaNome = document.getElementById('conversa-nome');
    const conversaBio = document.getElementById('conversa-bio');
    const conversaFoto = document.getElementById('conversa-foto');
    
    const chatMensagens = document.getElementById('chat-mensagens');
    const mensagemInput = document.getElementById('mensagem-input');
    const btnEnviarMensagem = document.getElementById('btn-enviar-mensagem');

    const itemMenuMensagens = document.querySelector('a[href*="chat.html"]') || document.getElementById('menu-mensagens');

    let intervaloMensagens = null; 

    if (!idLogado) {
        alert("Por favor, faça login para acessar suas mensagens.");
        window.location.href = "/index.html";
        return;
    }

    if (itemMenuMensagens) {
        itemMenuMensagens.style.position = 'relative';
    }

    async function carregarContatos() {
        try {
            const response = await fetch(`http://localhost:3000/mensagens/contatos/${idLogado}`);
            if (!response.ok) throw new Error("Erro ao buscar contatos no servidor");

            const artistas = await response.json();
            if (!listaContatos) return;

            listaContatos.innerHTML = '';

            if (!artistas || artistas.length === 0) {
                listaContatos.innerHTML = '<p style="color: #666; font-size: 14px; padding: 10px;">Você não segue nenhum artista.</p>';
                atualizarBolinhaGlobal(false);
                return;
            }

            let temMensagemNaoLidaGeral = false;

            artistas.forEach(artista => {
                const item = document.createElement('div');
                item.classList.add('contato-item');
                
                item.style = `
                    display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; 
                    background: #222; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-bottom: 8px;
                `;
                
                if (artista.id_artista == idConversaAtiva) {
                    item.style.background = '#333'; 
                }

                const fotoUrl = artista.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                const deveMostrarBolinhaLocal = artista.tem_novas_mensagens == 1 && artista.id_artista != idConversaAtiva;
                
                if (artista.tem_novas_mensagens == 1) {
                    temMensagemNaoLidaGeral = true;
                }

                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${fotoUrl}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                        <span style="color: #fff; font-weight: 500; font-size: 15px;">${artista.nome}</span>
                    </div>
                    ${deveMostrarBolinhaLocal ? `
                        <span class="bolinha-notificacao" style="
                            width: 10px; height: 10px; background-color: #ff3b30; 
                            border-radius: 50%; display: inline-block; margin-right: 5px;
                            box-shadow: 0 0 8px #ff3b30;
                        "></span>
                    ` : ''}
                `;

                item.addEventListener('click', () => {
                    idConversaAtiva = artista.id_artista;
                    sessionStorage.setItem('idConversaAtiva', idConversaAtiva);
                    
                    const bolinha = item.querySelector('.bolinha-notificacao');
                    if (bolinha) bolinha.remove();

                    abrirConversa(artista);
                });

                listaContatos.appendChild(item);
            });

            atualizarBolinhaGlobal(temMensagemNaoLidaGeral);

        } catch (error) {
            console.error("Erro ao carregar lista de contatos:", error);
            if (listaContatos) {
                listaContatos.innerHTML = '<p style="color: #ff3b30; font-size: 14px; padding: 10px;">Erro ao carregar contatos.</p>';
            }
        }
    }

    function atualizarBolinhaGlobal(mostrar) {
        if (!itemMenuMensagens) return;
        let bolinhaGlobal = itemMenuMensagens.querySelector('.bolinha-menu-global');
        
        if (mostrar) {
            if (!bolinhaGlobal) {
                bolinhaGlobal = document.createElement('span');
                bolinhaGlobal.classList.add('bolinha-menu-global');
                bolinhaGlobal.style = `
                    position: absolute; top: 0px; left: 20px; width: 8px; height: 8px; 
                    background-color: #ff3b30; border-radius: 50%; display: inline-block;
                    box-shadow: 0 0 6px #ff3b30; z-index: 10;
                `;
                itemMenuMensagens.appendChild(bolinhaGlobal);
            }
        } else {
            if (bolinhaGlobal) bolinhaGlobal.remove();
        }
    }

    function abrirConversa(artista) {
        if (chatVazio) chatVazio.style.display = 'none';
        if (janelaChatAtiva) janelaChatAtiva.style.display = 'flex';

        if (conversaNome) conversaNome.textContent = artista.nome;
        if (conversaBio) conversaBio.textContent = artista.biografia || '';
        if (conversaFoto) {
            conversaFoto.src = artista.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            conversaFoto.style.display = 'block';
        }

        if (intervaloMensagens) clearInterval(intervaloMensagens);

        carregarMensagens();

        intervaloMensagens = setInterval(() => {
            carregarMensagens();
        }, 3000);
    }

    async function carregarMensagens() {
        if (!idConversaAtiva) return;

        try {
            const response = await fetch(`http://localhost:3000/mensagens/historico/${idLogado}/${idConversaAtiva}`);
            if (!response.ok) return;

            const mensagens = await response.json();
            if (!chatMensagens) return;

            const estavaNoFinal = chatMensagens.scrollHeight - chatMensagens.scrollTop <= chatMensagens.clientHeight + 100;

            chatMensagens.innerHTML = '';

            mensagens.forEach(msg => {
                const box = document.createElement('div');
                box.style = "margin: 8px 0; display: flex;";

                if (msg.id_remetente == idLogado) {
                    box.style.justifyContent = 'flex-end';
                    box.innerHTML = `
                        <div style="background: #007bff; color: white; padding: 10px 14px; border-radius: 15px 15px 0 15px; max-width: 65%; word-wrap: break-word;">
                            ${msg.conteudo}
                        </div>`;
                } else {
                    box.style.justifyContent = 'flex-start';
                    box.innerHTML = `
                        <div style="background: #292929; color: white; padding: 10px 14px; border-radius: 15px 15px 15px 0; max-width: 65%; border: 1px solid #333; word-wrap: break-word;">
                            ${msg.conteudo}
                        </div>`;
                }
                chatMensagens.appendChild(box);
            });

            if (estavaNoFinal) {
                chatMensagens.scrollTop = chatMensagens.scrollHeight;
            }

        } catch (error) {
            console.error("Erro ao puxar histórico:", error);
        }
    }

    async function enviarMensagem() {
        const texto = mensagemInput.value.trim();
        if (!texto || !idConversaAtiva) return;

        try {
            const response = await fetch('http://localhost:3000/mensagens/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_remetente: idLogado,
                    id_destinatario: idConversaAtiva,
                    conteudo: texto
                })
            });

            if (response.ok) {
                mensagemInput.value = ''; 
                carregarMensagens();      
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
        }
    }

    if (btnEnviarMensagem) {
        btnEnviarMensagem.addEventListener('click', enviarMensagem);
    }

    if (mensagemInput) {
        mensagemInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                enviarMensagem();
            }
        });
    }

    // Inicializa carregamento lateral de contatos
    carregarContatos();

    // Loop leve para buscar novas notificações de mensagens a cada 5 segundos
    setInterval(carregarContatos, 5000);

    // Resgata o chat ativo caso a página sofra um F5 manual
    if (idConversaAtiva) {
        fetch(`http://localhost:3000/mensagens/contatos/${idLogado}`)
            .then(res => res.json())
            .then(artistas => {
                if (artistas && Array.isArray(artistas)) {
                    const selecionado = artists ? artistas.find(a => a.id_artista == idConversaAtiva) : null;
                    if (selecionado) {
                        abrirConversa(selecionado);
                    }
                }
            }).catch(err => console.error("Erro ao abrir chat automático:", err));
    }
});