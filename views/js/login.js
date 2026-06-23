document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLogin');
    const erroContainer = document.getElementById('mensagemErro');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o recarregamento da página
        if (erroContainer) erroContainer.style.display = 'none';

        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;

        try {
            const resposta = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                // Extrai com segurança o ID do artista independente de vir como id_artista ou id
                const idArtista = resultado.user.id_artista || resultado.user.id;

                // 1. SALVA NA SESSÃO: Alimenta todas as variáveis usadas pelas outras páginas do site
                sessionStorage.setItem('idArtistaLogado', idArtista);
                sessionStorage.setItem('id_artista', idArtista);
                sessionStorage.setItem('idUsuario', idArtista);

                // 2. Salva os dados completos no LocalStorage como você já fazia
                localStorage.setItem('usuarioLogado', JSON.stringify(resultado.user));

                console.log("Sessão iniciada com sucesso para o ID:", idArtista);

                // 3. REDIRECIONAMENTO: Envia para a home passando o ID na URL
                window.location.href = `/views/pages/home.html?id=${idArtista}`;

            } else {
                if (erroContainer) {
                    erroContainer.innerText = resultado.error || 'Erro ao realizar login.';
                    erroContainer.style.display = 'block';
                }
            }

        } catch (error) {
            console.error('Erro crítico no Login:', error);
            if (erroContainer) {
                erroContainer.innerText = 'Não foi possível conectar ao servidor.';
                erroContainer.style.display = 'block';
            }
        }
    });
});