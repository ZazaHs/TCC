document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLogin');
    const erroContainer = document.getElementById('mensagemErro');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o recarregamento da página

        erroContainer.style.display = 'none';

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
                // --- CORREÇÃO AQUI para reconhecer o artista ---
                // Tenta pegar 'id_artista' ou 'id'. Assim não dá erro independente de como o banco retorne!
                const idArtista = resultado.user.id_artista || resultado.user.id; 

                // 2. Salva os dados completos no LocalStorage para segurança/uso interno
                localStorage.setItem('usuarioLogado', JSON.stringify(resultado.user));
                
                // 3. REDIRECIONAMENTO POR ID: Envia para o perfil passando o ID na URL
                window.location.href = `/views/pages/home.html?id=${idArtista}`; 

            } else {
                erroContainer.innerText = resultado.error || 'Erro ao realizar login.';
                erroContainer.style.display = 'block';
            }

        } catch (error) {
            console.error('Erro:', error);
            erroContainer.innerText = 'Não foi possível conectar ao servidor.';
            erroContainer.style.display = 'block';
        }
    });
});