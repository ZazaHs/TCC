// views/js/perfil-publico.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. CAPTURAR OS IDS DA URL E DA SESSÃO
    const urlParams = new URLSearchParams(window.location.search);
    const idVisitado = urlParams.get('id');
    const idLogado = sessionStorage.getItem('idArtistaLogado');

    console.log("ID do artista visitado:", idVisitado);
    console.log("ID do artista logado (você):", idLogado);

    // Elementos da tela
    const artistaNome = document.getElementById('artista-nome');
    const artistaBio = document.getElementById('artista-bio');
    const artistaFoto = document.getElementById('artista-foto');
    const btnSeguir = document.getElementById('btn-seguir');
    const btnMensagem = document.getElementById('btn-mensagem');
    const feedArtista = document.getElementById('feed-artista');

    // Validação básica para evitar erros
    if (!idVisitado) {
        alert('Erro: Nenhum artista foi selecionado.');
        window.location.href = '/views/pages/home.html';
        return;
    }

    if (idVisitado == idLogado) {
        // Se o usuário tentar ver o próprio perfil por aqui, joga ele para o perfil pessoal dele
        window.location.href = '/views/pages/perfil.html';
        return;
    }

})