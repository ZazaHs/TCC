console.log("O JS está funcionando")

// Seleciona o botão e o menu
const btn = document.getElementById('btn-menu');
const menu = document.getElementById('menu-principal');

// Adiciona o evento de clique
btn.addEventListener('click', function() {
    // Se o menu tiver a classe 'aberto', ele retira. Se não tiver, ele coloca.
    menu.classList.toggle('aberto');
});