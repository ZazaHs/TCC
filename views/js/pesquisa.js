// SIMULAÇÃO DE BANCO DE DADOS (Coloque as suas fotos reais aqui)
const bancoDeArtes = [
    { id: 1, url: '/views/media/Mark-Variants.avif', tipo: 'normal' },
    { id: 2, url: '/views/media/Cyberpunk.jpg', tipo: 'normal' },
    { id: 3, url: '/views/media/Bleach.jpg', tipo: 'tall' }, 
    { id: 4, url: '/views/media/Itachi.png ', tipo: 'normal' },
    { id: 5, url: '/views/media/One-piece.jpeg', tipo: 'normal' },
    { id: 6, url: '/views/media/Death-note.png', tipo: 'normal' },
    { id: 7, url: '/views/media/Samurai-cyberpunk.png', tipo: 'tall' }, 
    { id: 8, url: '/views/media/Reze.jpg', tipo: 'normal' },
    { id: 9, url: '/views/media/Naruto.jpg', tipo: 'normal' },
    { id: 10, url: '/views/media/One-piece-Ace.jpg', tipo: 'normal' },
    { id: 11, url: '/views/media/Jujutsu-Sukuna.png', tipo: 'normal' },
    { id: 12, url: '/views/media/Chainsaw-man.png', tipo: 'tall' }
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

        gridItem.appendChild(img);
        gridContainer.appendChild(gridItem);
    });
}

window.addEventListener('DOMContentLoaded', renderizarGridExplorar);