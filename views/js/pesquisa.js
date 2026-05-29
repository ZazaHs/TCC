// SIMULAÇÃO DE BANCO DE DADOS (Substitua pelos caminhos das suas fotos reais)
const bancoDeArtes = [
    { id: 1, url: '/views/assets/arte1.jpg', tipo: 'normal' },
    { id: 2, url: '/views/assets/arte2.png', tipo: 'normal' },
    { id: 3, url: '/views/assets/arte_vertical1.jpg', tipo: 'tall' }, // Ocupará 2 espaços de altura
    { id: 4, url: '/views/assets/arte3.jpg', tipo: 'normal' },
    { id: 5, url: '/views/assets/arte4.jpg', tipo: 'normal' },
    { id: 6, url: '/views/assets/arte5.png', tipo: 'normal' },
    { id: 7, url: '/views/assets/arte_vertical2.jpg', tipo: 'tall' }, // Outro destaque vertical
    { id: 8, url: '/views/assets/arte6.jpg', tipo: 'normal' },
];

// FUNÇÃO PARA CARREGAR AS IMAGENS NO GRID
function renderizarGridExplorar() {
    const gridContainer = document.querySelector('.explore-grid');
    
    // Certifica-se de que o container existe na página antes de rodar
    if (!gridContainer) return;

    // Limpa qualquer conteúdo antigo
    gridContainer.innerHTML = '';

    // Loop para ler cada item do nosso "Banco de Dados"
    bancoDeArtes.forEach(arte => {
        // 1. Cria a div interna do item (.grid-item)
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        
        // Se a propriedade 'tipo' for 'tall', adiciona a classe CSS correspondente
        if (arte.tipo === 'tall') {
            gridItem.classList.add('tall');
        }

        // 2. Cria o elemento da imagem (<img>)
        const img = document.createElement('img');
        img.src = arte.url;
        img.alt = `Arte ID ${arte.id}`;
        img.classList.add('art-image'); // Aplica a estilização que impede distorções

        // 3. Monta a estrutura injetando a imagem no bloco e o bloco na tela
        gridItem.appendChild(img);
        gridContainer.appendChild(gridItem);
    });
}

// Executa a renderização assim que o documento HTML estiver totalmente carregado
window.addEventListener('DOMContentLoaded', renderizarGridExplorar);