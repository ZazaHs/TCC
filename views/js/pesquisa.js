// SIMULAÇÃO DE BANCO DE DADOS (Com as suas fotos reais e caminhos corrigidos)
const bancoDeArtes = [
    { id: 1, url: '/views/media/Art/Mark-Variants.avif', tipo: 'normal' },
    { id: 2, url: '/views/media/Art/Cyberpunk.jpg', tipo: 'normal' },
    { id: 3, url: '/views/media/Art/Bleach.jpg', tipo: 'tall' }, 
    { id: 4, url: '/views/media/Art/Itachi.png', tipo: 'normal' },
    { id: 5, url: '/views/media/Art/One-piece.jpeg', tipo: 'normal' },
    { id: 6, url: '/views/media//Art/Death-note.png', tipo: 'normal' },
    { id: 7, url: '/views/media/Art/Samurai-cyberpunk.png', tipo: 'tall' }, 
    { id: 8, url: '/views/media/Art/Reze.jpg', tipo: 'normal' },
    { id: 9, url: '/views/media/Art/Naruto.jpg', tipo: 'normal' },
    { id: 10, url: '/views/media/Art/One-piece-Ace.jpg', tipo: 'normal' },
    { id: 11, url: '/views/media/Art/Jujutsu-Sukuna.png', tipo: 'normal' },
    { id: 12, url: '/views/media/Art/Chainsaw-man.png', tipo: 'tall' }
];

// FUNÇÃO PARA CARREGAR AS IMAGENS NO GRID
function renderizarGridExplorar() {
    const gridContainer = document.querySelector('.explore-grid');
    
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    bancoDeArtes.forEach(arte => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        
        if (arte.tipo === 'tall') {
            gridItem.classList.add('tall');
        }

        const img = document.createElement('img');
        img.src = arte.url;
        img.alt = `Arte ID ${arte.id}`;
        img.classList.add('art-image');

        // EVENTO DE CLIQUE: Abre a foto em tela cheia quando o usuário clicar nela
        img.addEventListener('click', () => {
            abrirFotoEmTelaCheia(arte.url);
        });

        gridItem.appendChild(img);
        gridContainer.appendChild(gridItem);
    });
}

// FUNÇÃO PARA EXIBIR O MODAL EM TELA CHEIA
function abrirFotoEmTelaCheia(urlDaImagem) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    
    if (modal && modalImg) {
        modalImg.src = urlDaImagem; // Transfere a URL da imagem clicada para dentro do modal
        modal.style.display = 'flex'; // Torna o container do modal visível
    }
}

// FUNÇÃO PARA CONFIGURAR O FECHAMENTO DO MODAL
function configurarEventosDoModal() {
    const modal = document.getElementById('image-modal');
    const botaoFechar = document.querySelector('.modal-close');

    if (!modal) return;

    // Fecha o modal ao clicar no botão de "X"
    if (botaoFechar) {
        botaoFechar.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Fecha o modal se o usuário clicar na área preta/fundo fora da imagem
    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Inicializa a renderização e as configurações de clique ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    renderizarGridExplorar();
    configurarEventosDoModal();
});