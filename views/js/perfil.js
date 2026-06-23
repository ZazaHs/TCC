document.addEventListener('DOMContentLoaded', async () => {
    // =======================================================
    // 1. CAPTURA O ID DO USUÁRIO LOGADO
    // =======================================================
    const urlParams = new URLSearchParams(window.location.search);
    let idArtista = urlParams.get('id');

    if (!idArtista || idArtista === 'undefined' || idArtista === 'null') {
        idArtista = sessionStorage.getItem('idArtistaLogado') ||
            sessionStorage.getItem('id_artista') ||
            sessionStorage.getItem('idUsuario');
    }

    console.log("🔍 ID detectado para carregar o perfil:", idArtista);

    if (!idArtista || idArtista === 'undefined' || idArtista === 'null') {
        console.error("❌ Erro: Nenhum ID encontrado.");
        alert("Sessão expirada. Por favor, faça login novamente.");
        window.location.href = '/views/pages/login.html';
        return;
    }

    window.history.replaceState(null, '', `perfil.html?id=${idArtista}`);

    const linkHome = document.querySelector('.sidebar a[href*="home.html"]');
    if (linkHome) {
        linkHome.href = `/views/pages/home.html?id=${idArtista}`;
    }

    // Elementos do HTML
    const inputNome = document.getElementById('username');
    const inputBio = document.getElementById('bio');
    const inputFoto = document.getElementById('imageUpload');
    const previewFoto = document.getElementById('imagePreview');
    const formEditar = document.getElementById('formEditarPerfil');

    const txtSeguidores = document.getElementById('qtd-seguidores');
    const txtSeguindo = document.getElementById('qtd-seguindo');
    const gridMeuFeed = document.getElementById('grid-meu-feed');

    let fotoBase64 = null;

    // =======================================================
    // 2. BUSCA OS DADOS CADASTRAIS (NOME, BIO, FOTO)
    // =======================================================
    async function carregarDadosPerfil() {
        try {
            console.log("📡 Solicitando dados para o ID:", idArtista);

            let resposta = await fetch(`http://localhost:3000/auth/perfil/${idArtista}`);
            let textoBruto = await resposta.text();

            if (textoBruto.trim().startsWith("<!DOCTYPE html>")) {
                console.warn("⚠️ O servidor Node devolveu o HTML da página em vez de JSON. Usando contingência local...");
                const dadosLocais = localStorage.getItem('usuarioLogado');
                if (dadosLocais) {
                    const usuarioObj = JSON.parse(dadosLocais);
                    if (inputNome) inputNome.value = usuarioObj.nome || usuarioObj.username || '';
                    if (inputBio) inputBio.value = usuarioObj.biografia || '';
                }
                // Mesmo na contingência, vamos forçar a chamada dos seguidores para não zerar
                await carregarContadoresSeguidores();
                return;
            }

            let dadosArtista = JSON.parse(textoBruto);
            console.log("📦 Dados reais recebidos do banco:", dadosArtista);

            if (Array.isArray(dadosArtista)) dadosArtista = dadosArtista[0];

            if (dadosArtista) {
                if (inputNome) {
                    inputNome.value = dadosArtista.nome || dadosArtista.username || dadosArtista.nome_artista || '';
                }
                if (inputBio) {
                    const bioTexto = dadosArtista.biografia || dadosArtista.bio || '';
                    inputBio.value = (bioTexto && bioTexto !== 'NULL' && bioTexto !== 'null') ? bioTexto : '';
                }
                const urlFoto = dadosArtista.foto_perfil || dadosArtista.foto;
                if (urlFoto && urlFoto.length > 50) {
                    fotoBase64 = urlFoto;
                    if (previewFoto) {
                        previewFoto.style.backgroundImage = `url(${fotoBase64})`;
                    }
                }

                // Tenta mapear os dados caso o endpoint já traga
                if (txtSeguidores) txtSeguidores.textContent = dadosArtista.totalSeguidores || dadosArtista.seguidores || "0";
                if (txtSeguindo) txtSeguindo.textContent = dadosArtista.totalSeguindo || dadosArtista.seguindo || "0";
            }

            // Garante a execução da busca de contagem real
            await carregarContadoresSeguidores();

        } catch (error) {
            console.error("❌ Erro ao processar informações do perfil:", error);
            await carregarContadoresSeguidores(); // Tenta carregar os contadores mesmo em falha estrutural
        }
    }

    // =======================================================
    // 2.5 BUSCA OS NÚMEROS DE SEGUIDORES DINAMICAMENTE DO SEGUIDORES
    // =======================================================
    async function carregarContadoresSeguidores() {
        // Busca Seguidores
        try {
            const resSeguidores = await fetch(`http://localhost:3000/api/seguidores/contar/${idArtista}`);
            if (resSeguidores.ok) {
                const dados = await resSeguidores.json();
                if (txtSeguidores) txtSeguidores.textContent = dados.total || dados.seguidores || 0;
            }
        } catch (err) {
            console.warn("⚠️ Não foi possível consultar a API de seguidores (Rota de contagem não configurada).");
        }

        // Busca Seguindo
        try {
            const resSeguindo = await fetch(`http://localhost:3000/api/seguidores/contar-seguindo/${idArtista}`);
            if (resSeguindo.ok) {
                const dados = await resSeguindo.json();
                if (txtSeguindo) txtSeguindo.textContent = dados.total || dados.seguindo || 0;
            }
        } catch (err) {
            console.warn("⚠️ Não foi possível consultar a API de seguindo (Rota de contagem não configurada).");
        }
    }

    // =======================================================
    // 3. CARREGA AS PUBLICAÇÕES (SINCRONIZADO COM 'id_post')
    // =======================================================
    async function carregarPostagensDoArtista() {
        try {
            if (!gridMeuFeed) return;
            gridMeuFeed.innerHTML = '<p style="color: #888; grid-column: 1/-1;">Carregando publicações...</p>';

            let urlFinal = `http://localhost:3000/api/postagens/artista/${idArtista}`;

            console.log(`📡 Buscando publicações in: ${urlFinal}`);
            let resposta = await fetch(urlFinal);
            let textoBruto = await resposta.text();

            if (!resposta.ok || textoBruto.trim().startsWith("<!DOCTYPE html>")) {
                console.warn("⚠️ Rota principal não retornou JSON. Testando rotas alternativas...");
                urlFinal = `http://localhost:3000/api/postagens/${idArtista}`;
                resposta = await fetch(urlFinal);
                textoBruto = await resposta.text();
            }

            if (textoBruto.trim().startsWith("<!DOCTYPE html>") || !resposta.ok) {
                throw new Error("Nenhum endpoint de postagens retornou dados válidos em JSON.");
            }

            const posts = JSON.parse(textoBruto);
            console.log("🖼️ Postagens retornadas pelo MySQL:", posts);

            gridMeuFeed.innerHTML = '';

            if (!posts || !Array.isArray(posts) || posts.length === 0) {
                gridMeuFeed.innerHTML = '<p style="color: #666; grid-column: 1/-1; padding: 10px 0;">Você ainda não fez nenhuma publicação artística.</p>';
                return;
            }

            posts.forEach(post => {
                const card = document.createElement('div');
                card.style = "background: #1a1a1a; padding: 12px; border-radius: 10px; border: 1px solid #2c2c2c; cursor: pointer; transition: 0.2s; position: relative;";

                const urlImagem = post.imagem_post || post.imagem || post.midia || 'https://placehold.co/600x400/222/fff?text=Sem+Imagem';
                const textoLegenda = post.legenda || post.descricao || 'Sem legenda';

                const idPostagem = post.id_post || post.id || post.id_postagem;

                card.innerHTML = `
                    <div class="btn-deletar-post" data-id="${idPostagem}" style="position: absolute; top: 18px; right: 18px; background: rgba(255, 74, 74, 0.9); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; z-index: 10;">
                        <i class="fas fa-trash-alt" style="font-size: 14px;"></i>
                    </div>
                    <div class="card-clicavel" style="width: 100%; height: 180px; background-image: url('${urlImagem}'); background-size: cover; background-position: center; border-radius: 6px; margin-bottom: 8px;"></div>
                    <p style="color: #ddd; font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${textoLegenda}</p>
                `;

                card.querySelector('.card-clicavel').addEventListener('click', () => abrirModalImagem(urlImagem));

                const btnDeletar = card.querySelector('.btn-deletar-post');
                btnDeletar.addEventListener('click', async (e) => {
                    e.stopPropagation();

                    const certeza = confirm("Tem certeza absoluta de que deseja apagar esta publicação artística? Esta ação não poderá ser desfeita.");

                    if (certeza) {
                        const tentativasDelete = [
                            { url: `http://localhost:3000/api/postagens/${idPostagem}`, options: { method: 'DELETE' } },
                            { url: `http://localhost:3000/api/postagens/deletar/${idPostagem}`, options: { method: 'DELETE' } },
                            {
                                url: `http://localhost:3000/api/postagens`, options: {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id_post: idPostagem, id: idPostagem })
                                }
                            }
                        ];

                        let deletadoComSucesso = false;

                        for (const tentativa of tentativasDelete) {
                            try {
                                console.log(`🗑️ Enviando ID ${idPostagem} para: ${tentativa.url}`);
                                const respostaDelete = await fetch(tentativa.url, tentativa.options);

                                if (respostaDelete.ok) {
                                    const textoResp = await respostaDelete.text();
                                    if (!textoResp.trim().startsWith("<!DOCTYPE html>")) {
                                        deletadoComSucesso = true;
                                        break;
                                    }
                                }
                            } catch (err) {
                                console.warn("⚠️ Falha na tentativa de exclusão.", err);
                            }
                        }

                        if (deletadoComSucesso) {
                            alert("Publicação removida com sucesso!");
                            card.remove();
                        } else {
                            alert("Não foi possível apagar a postagem. Verifique se o backend está usando a coluna 'id_post' no DELETE.");
                        }
                    }
                });

                gridMeuFeed.appendChild(card);
            });

        } catch (error) {
            console.error("❌ Erro ao renderizar as postagens:", error);
            if (gridMeuFeed) gridMeuFeed.innerHTML = '<p style="color: #ff4a4a; grid-column: 1/-1;">Erro de sincronização com as colunas do banco de dados.</p>';
        }
    }

    // =======================================================
    // MODAL E EVENTOS ADICIONAIS
    // =======================================================
    function abrirModalImagem(url) {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-img');
        if (modal && modalImg) {
            modalImg.src = url;
            modal.style.display = 'flex';
        }
    }

    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    if (inputFoto) {
        inputFoto.addEventListener('change', function () {
            const arquivo = this.files[0];
            if (arquivo) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    fotoBase64 = e.target.result;
                    if (previewFoto) {
                        previewFoto.style.backgroundImage = `url(${fotoBase64})`;
                    }
                };
                reader.readAsDataURL(arquivo);
            }
        });
    }

    if (formEditar) {
        formEditar.addEventListener('submit', async (event) => {
            event.preventDefault();

            const novosDados = {
                id: idArtista,
                nome: inputNome.value,
                biografia: inputBio.value,
                foto_perfil: fotoBase64
            };

            try {
                const resposta = await fetch(`http://localhost:3000/auth/atualizar-perfil`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novosDados)
                });

                if (resposta.ok) {
                    alert('Perfil updated com sucesso!');
                    await carregarDadosPerfil();
                } else {
                    const dadosErro = await resposta.json();
                    alert('Erro ao salvar: ' + (dadosErro.error || 'Verifique as informações.'));
                }
            } catch (error) {
                console.error("Erro na requisição PUT:", error);
                alert("Erro ao conectar com o servidor.");
            }
        });
    }

    await carregarDadosPerfil();
    await carregarPostagensDoArtista();
});