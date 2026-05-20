document.addEventListener('DOMContentLoaded', async () => {
    // 1. CAPTURA O ID DO USUÁRIO PELA URL OU MEMÓRIA DA SESSÃO
    const urlParams = new URLSearchParams(window.location.search);
    let idArtista = urlParams.get('id');

    if (!idArtista || idArtista === 'undefined' || idArtista === 'null') {
        idArtista = sessionStorage.getItem('idArtistaLogado') || "1";
    }

    // Organiza a barra de endereços para mostrar o ?id= correto
   // Ache essa linha que já existe no seu perfil.js:
window.history.replaceState(null, '', `perfil.html?id=${idArtista}`);

// ADICIONE ESTE BLOCO LOGO ABAIXO DELA:
const linkHome = document.querySelector('.sidebar a[href*="home.html"]');
if (linkHome) {
    linkHome.href = `/views/pages/home.html?id=${idArtista}`;
}

    // Mapeamento dos elementos do perfil.html
    const inputNome = document.getElementById('username');
    const inputBio = document.getElementById('bio');
    const inputFoto = document.getElementById('imageUpload');
    const previewFoto = document.getElementById('imagePreview');
    const formEditar = document.getElementById('formEditarPerfil');

    // Variável que armazena a imagem ativa (inicia vazia)
    let fotoBase64 = null;

    console.log("Gerenciando perfil e foto para o ID:", idArtista);

    // =======================================================
    // 2. BUSCA OS DADOS ATUAIS SALVOS NO BANCO DE DADOS (GET)
    // =======================================================
    try {
        const resposta = await fetch(`http://localhost:3000/auth/perfil/${idArtista}`);
        
        if (resposta.ok) {
            const dadosArtista = await resposta.json();
            console.log("Dados recebidos do MySQL:", dadosArtista);
            
            // Preenche o campo de Nome de Usuário
            if (inputNome) {
                inputNome.value = dadosArtista.nome || dadosArtista.username || '';
            }
            
            // Preenche o campo de Biografia (Tratando o 'NULL' do banco)
            if (inputBio) {
                inputBio.value = (dadosArtista.biografia && dadosArtista.biografia !== 'NULL') ? dadosArtista.biografia : '';
            }
            
            // Carrega e mantém a foto de perfil se ela já existir no MySQL
            if (dadosArtista.foto_perfil && dadosArtista.foto_perfil.length > 50) {
                fotoBase64 = dadosArtista.foto_perfil; // Salva na variável para o F5 não apagar
                if (previewFoto) {
                    previewFoto.style.backgroundImage = `url(${fotoBase64})`;
                    previewFoto.style.backgroundSize = 'cover';
                    previewFoto.style.backgroundPosition = 'center';
                }
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados iniciais do banco:", error);
    }

    // =======================================================
    // 3. CONVERTE A NOVA FOTO PARA STRING (BASE64) SE O USUÁRIO MUDAR
    // =======================================================
    if (inputFoto) {
        inputFoto.addEventListener('change', function() {
            const arquivo = this.files[0];
            if (arquivo) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    fotoBase64 = e.target.result; // Armazena a string gigante da imagem aqui
                    if (previewFoto) {
                        previewFoto.style.backgroundImage = `url(${fotoBase64})`;
                        previewFoto.style.backgroundSize = 'cover';
                        previewFoto.style.backgroundPosition = 'center';
                    }
                };
                reader.readAsDataURL(arquivo); // Executa a conversão
            }
        });
    }

    // =======================================================
    // 4. ENVIA OS DADOS ATUALIZADOS PARA O BANCO (PUT)
    // =======================================================
    if (formEditar) {
        formEditar.addEventListener('submit', async (event) => {
            event.preventDefault(); // Bloqueia o HTML de recarregar a tela

            const novosDados = {
                id: idArtista,
                nome: inputNome.value,
                biografia: inputBio.value,
                foto_perfil: fotoBase64 // Envia a foto (seja a antiga do banco ou a nova)
            };

            try {
                const resposta = await fetch(`http://localhost:3000/auth/atualizar-perfil`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novosDados)
                });

                if (resposta.ok) {
                    alert('Perfil e Foto salvos com sucesso!');
                } else {
                    const dadosErro = await resposta.json();
                    alert('Erro no servidor: ' + (dadosErro.error || 'Verifique o tamanho aceito pelo Express.'));
                }
            } catch (error) {
                console.error("Erro na requisição PUT:", error);
                alert("Erro de conexão. Certifique-se de que o backend aceita payloads grandes.");
            }
        });
    }
});