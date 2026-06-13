// views/js/chat.js
document.addEventListener('DOMContentLoaded', () => {
    let idLogadoRaw = sessionStorage.getItem('idArtistaLogado');
    
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

    // Mapeamento dos elementos de mídia
    const btnAnexarFoto = document.getElementById('btn-anexar-foto');
    const fotoInput = document.getElementById('foto-input');

    let intervaloMensagens = null; 

    if (!idLogado || idLogado === "null" || idLogado === "undefined") {
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
            if (!response.ok) throw new Error(`Erro ${response.status}`);

            const artistas = await response.json();
            if (!listaContatos) return;

            listaContatos.innerHTML = '';

            // ✅ LINHA CORRIGIDA: Mudado de artists para artistas
            if ((!artistas || artistas.length === 0) && !idConversaAtiva) {
                listaContatos.innerHTML = '<p style="color: #666; font-size: 14px; padding: 10px;">Nenhuma conversa ativa no momento.</p>';
                atualizarBolinhaGlobal(false);
                return;
            }

            let temMensagemNaoLidaGeral = false;
            let idConversaAtivaNaLista = false;

            artistas.forEach(artista => {
                if (artista.id_artista == idConversaAtiva) idConversaAtivaNaLista = true;

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
                
                if (artista.tem_novas_mensagens == 1 && artista.id_artista != idConversaAtiva) {
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

            if (idConversaAtiva && !idConversaAtivaNaLista) {
                 injetarContatoParceria(idConversaAtiva);
            }

            atualizarBolinhaGlobal(temMensagemNaoLidaGeral);

        } catch (error) {
            console.error("Erro ao carregar lista de contatos:", error);
        }
    }

    async function injetarContatoParceria(idDestino) {
        try {
            const response = await fetch(`http://localhost:3000/artistas/perfil-publico/${idDestino}/${idLogado}`);
            if (!response.ok) return;
            const artista = await response.json();

            const item = document.createElement('div');
            item.classList.add('contato-item');
            item.style = `
                display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; 
                background: #333; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-bottom: 8px;
                border-left: 3px solid #007bff;
            `;

            const fotoUrl = artista.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${fotoUrl}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                    <span style="color: #fff; font-weight: 500; font-size: 15px;">${artista.nome} (Parceria)</span>
                </div>
            `;

            item.addEventListener('click', () => {
                idConversaAtiva = artista.id_artista;
                sessionStorage.setItem('idConversaAtiva', idConversaAtiva);
                abrirConversa(artista);
            });

            if (listaContatos) {
                const textoVazio = listaContatos.querySelector('p');
                if (textoVazio) textoVazio.remove();
                listaContatos.insertBefore(item, listaContatos.firstChild);
            }

            abrirConversa(artista);

        } catch (err) {
            console.error("Erro ao injetar contato de parceria:", err);
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

                const ehImagem = msg.conteudo.startsWith('data:image/');
                
                // ✅ AGORA: O clique chama a função "abrirModalImagem" passando o Base64 dela
                const elementoConteudo = ehImagem 
                    ? `<img src="${msg.conteudo}" style="max-width: 100%; max-height: 250px; border-radius: 10px; display: block; cursor: pointer; object-fit: cover;" onclick="abrirModalImagem('${msg.conteudo}')">`
                    : msg.conteudo;

                if (msg.id_remetente == idLogado) {
                    box.style.justifyContent = 'flex-end';
                    box.innerHTML = `
                        <div style="background: #007bff; color: white; padding: ${ehImagem ? '6px' : '10px 14px'}; border-radius: 15px 15px 0 15px; max-width: 65%; word-wrap: break-word;">
                            ${elementoConteudo}
                        </div>`;
                } else {
                    box.style.justifyContent = 'flex-start';
                    box.innerHTML = `
                        <div style="background: #292929; color: white; padding: ${ehImagem ? '6px' : '10px 14px'}; border-radius: 15px 15px 15px 0; max-width: 65%; border: 1px solid #333; word-wrap: break-word;">
                            ${elementoConteudo}
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

    // ========================================================
    // LOGICA DO BOTÃO "+" (ANEXAR FOTO EM BASE64)
    // ========================================================
    if (btnAnexarFoto && fotoInput) {
        btnAnexarFoto.addEventListener('click', (e) => {
            e.preventDefault(); // Trava o reload da página
            fotoInput.click();  // Simula o clique no input de arquivo oculto
        });

        fotoInput.addEventListener('change', async (e) => {
            const arquivo = e.target.files[0];
            if (!arquivo) return;

            // Validação de tamanho: Limita em 2MB para preservar requisições HTTP rápidas
            if (arquivo.size > 2 * 1024 * 1024) {
                alert("A imagem é muito grande! Escolha um arquivo de até 2MB.");
                fotoInput.value = '';
                return;
            }

            const leitor = new FileReader();
            
            leitor.onloadend = async () => {
                const base64Imagem = leitor.result;

                try {
                    const response = await fetch('http://localhost:3000/mensagens/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_remetente: idLogado,
                            id_destinatario: idConversaAtiva,
                            conteudo: base64Imagem
                        })
                    });

                    if (response.ok) {
                        fotoInput.value = ''; 
                        carregarMensagens(); 
                    }
                } catch (error) {
                    console.error("Erro ao transmitir foto em Base64:", error);
                }
            };

            leitor.readAsDataURL(arquivo);
        });
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

    carregarContatos();
    setInterval(carregarContatos, 5000);


    // ========================================================
    // LÓGICA DO MODAL DE VISUALIZAÇÃO E DOWNLOAD DE FOTOS
    // ========================================================
    const modalImagem = document.getElementById('modal-imagem');
    const imagemExpandida = document.getElementById('imagem-expandida');
    const btnBaixarImagem = document.getElementById('btn-baixar-imagem');
    const fecharModal = document.getElementById('fechar-modal');

    // Função global dentro do DOMContentLoaded para abrir o modal
    window.abrirModalImagem = function(srcBase64) {
        if (!modalImagem || !imagemExpandida || !btnBaixarImagem) return;
        
        imagemExpandida.src = srcBase64;
        btnBaixarImagem.href = srcBase64; // O link de download recebe o Base64 direto
        modalImagem.style.display = 'flex';
    };

    // Fechar ao clicar no "X"
    if (fecharModal) {
        fecharModal.addEventListener('click', () => {
            modalImagem.style.display = 'none';
        });
    }

    // Fechar ao clicar no fundo preto do modal
    if (modalImagem) {
        modalImagem.addEventListener('click', (e) => {
            if (e.target === modalImagem) {
                modalImagem.style.display = 'none';
            }
        });
    }
});