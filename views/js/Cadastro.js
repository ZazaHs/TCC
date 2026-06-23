// Aguarda o HTML carregar completamente na tela
document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('formCadastro');

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede a página de recarregar ou mudar de tela antes da hora

            // Captura os dados digitados nos inputs
            const nomeInput = document.getElementById('inputNome');
            const emailInput = document.getElementById('inputEmail');
            const senhaInput = document.getElementById('inputSenha');

            const dados = {
                nome: nomeInput ? nomeInput.value : '',
                email: emailInput ? emailInput.value : '',
                senha: senhaInput ? senhaInput.value : ''
            };

            try {
                // Envia os dados para a API do seu backend
                const resposta = await fetch('http://localhost:3000/auth/cadastro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dados)
                });

                const resultado = await resposta.json();

                if (resposta.ok) {
                    alert('Artista cadastrado com sucesso!');
                    // Após o sucesso, redireciona o usuário para a tela de login
                    window.location.href = '/index.html'; // Ajuste o caminho da sua tela de login aqui se necessário
                } else {
                    alert(resultado.error || 'Erro ao realizar o cadastro.');
                }
            } catch (error) {
                console.error('Erro na requisição de cadastro:', error);
                alert('Não foi possível conectar ao servidor. O backend está rodando?');
            }
        });
    }
});