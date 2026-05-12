const REGRAS_CULTURAS = {
    "Alface": 45,
    "Tomate": 90,
    "Cenoura": 70,
    "Morango": 100,
    "Batata": 55,
    "Repolho": 62
};

// 1. Função de navegação e geolocalização
function navegar(idPagina) {
    const paginas = document.querySelectorAll('.pagina');
    paginas.forEach(secao => secao.style.display = 'none');
    
    const paginaAlvo = document.getElementById(idPagina);
    if (paginaAlvo) {
        paginaAlvo.style.display = 'flex';
        paginaAlvo.style.flexDirection = 'column';
    }

    const botoes = document.querySelectorAll('.btn-nav');
    botoes.forEach(btn => {
        const acao = btn.getAttribute('onclick') || '';
        if (acao.includes(idPagina)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (idPagina === 'mapa') {
        const placeholder = document.getElementById('mapa-placeholder');
        placeholder.innerHTML = "<p>🔍 Localizando sua posição...</p>";

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    const lat = posicao.coords.latitude;
                    const lon = posicao.coords.longitude;
                    placeholder.innerHTML = `
                        <div class="info-geo">
                            <p>📍 <strong>Você está aqui!</strong></p>
                            <p>Latitude: ${lat.toFixed(4)} | Longitude: ${lon.toFixed(4)}</p>
                            <div class="ponto-mapa">Horta Central (Mais próxima)</div>
                            <button class="btn-acao" style="padding: 10px; font-size: 0.9rem;" onclick="window.open('google.com${lat},${lon}', '_blank')">Ver no Google Maps</button>
                        </div>`;
                },
                () => { placeholder.innerHTML = "<p>❌ Localização não permitida ou desativada.</p>"; }
            );
        } else {
            placeholder.innerHTML = "<p>❌ Seu navegador não suporta geolocalização.</p>";
        }
    }
}

window.onload = () => navegar('novo-plantio');

// 2. Lógica do formulário
const form = document.getElementById('form-plantio');
form.addEventListener('submit', function(e) {
    e.preventDefault();

    let cultura = document.getElementById('cultura').value;
    const dataInput = document.getElementById('data').value; 
    const area = parseFloat(document.getElementById('area').value);
    let diasParaColheita;

    if (cultura === 'outro') {
        cultura = document.getElementById('nova-cultura').value.trim();
        diasParaColheita = parseInt(document.getElementById('novo-tempo').value);
        
        if (!cultura || isNaN(diasParaColheita)) {
            alert("Preencha o nome e o tempo da nova cultura!");
            return;
        }
    } else {
        // Vinculação exata com base no dicionário agronômico
        diasParaColheita = REGRAS_CULTURAS[cultura] || 45;
    }
    
    // Cálculos de Sementes e Ciclo de Vida
    const sementes = Math.ceil(area * 50); 
    const dataPlantioBr = dataInput.split('-').reverse().join('/');
    
    // Tratamento estrito do ISO string para evitar atrasos de fuso horário
    let dataObjeto = new Date(dataInput + "T00:00:00"); 
    dataObjeto.setDate(dataObjeto.getDate() + diasParaColheita);
    
    // Geração da string BR padronizada
    const dataFimBr = dataObjeto.toLocaleDateString('pt-BR');

    // Gera um ID único baseado nos milissegundos atuais para a remoção reativa
    const idUnico = Date.now();

    // Envio reativo dos dados processados para a camada de visualização
    criarCardNoPainel(idUnico, cultura, dataPlantioBr, dataFimBr, sementes);

    form.reset();
    document.getElementById('campos-extras').style.display = 'none'; 
    alert("Plantio salvo com sucesso!");
    navegar('painel'); 
});

// 3. Mostrar campos extras
function verificarOutro(valor) {
    const camposExtras = document.getElementById('campos-extras');
    camposExtras.style.display = (valor === 'outro') ? 'flex' : 'none';
}

// 4. Criar card no painel
function criarCardNoPainel(id, nome, inicio, fim, sementes) {
    const lista = document.getElementById('lista-canteiros');
    const msgVazio = document.getElementById('msg-vazio');
    if (msgVazio) msgVazio.style.display = 'none';

    const card = document.createElement('div');
    card.className = 'card';
    card.id = `canteiro-${id}`;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Reconstrução segura do objeto Date a partir da string formatada DD/MM/AAAA
    const partesData = fim.split('/');
    const dia = parseInt(partesData[0], 10);
    const mes = parseInt(partesData[1], 10) - 1;
    const ano = parseInt(partesData[2], 10);
    const dataColheitaObj = new Date(ano, mes, dia, 0, 0, 0, 0);

    // Validação da regra de negócio de urgência
    const precisaColher = hoje >= dataColheitaObj;

    if (precisaColher) {
        card.classList.add('card-urgente');
    }

    card.innerHTML = `
        <h3>🌿 ${nome}</h3>
        <p><strong>Data de Plantio:</strong> ${inicio}</p>
        <p><strong>Previsão de Colheita:</strong> ${fim}</p>
        <p><strong>Insumos:</strong> ${sementes} sementes</p>
        <hr style="border: 1px dashed #ccc; margin: 12px 0;">
        <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
            <small style="font-weight: bold; color: ${precisaColher ? '#cc0000' : '#2e7d32'}">
                Status: ${precisaColher ? '⚠️ Necessita de colheita imediata!' : '🔄 Em monitoramento'}
            </small>
            <button class="btn-colheita" onclick="confirmarBaixaColheita(${id})">
                ✅ Colheita concluída!
            </button>

        </div>
    `;
    lista.appendChild(card);
}

// 5. Função de exclusão de canteiro
function confirmarBaixaColheita(idCanteiro) {
    const confirmar = confirm("Você confirma que este canteiro foi colhido e o espaço está limpo?");
    
    if (confirmar) {
        // Localiza o elemento exato na árvore do DOM e remove
        const cardParaRemover = document.getElementById(`canteiro-${idCanteiro}`);
        if (cardParaRemover) {
            cardParaRemover.remove();
        }

        // Se o painel ficar completamente vazio novamente, exibe a mensagem de aviso
        const lista = document.getElementById('lista-canteiros');
        // Filtra elementos para ignorar nós de texto e verificar se restou apenas o p de mensagem vazia escondido
        const itensAtivos = Array.from(lista.children).filter(el => el.id !== 'msg-vazio');
        
        if (itensAtivos.length === 0) {
            const msgVazio = document.getElementById('msg-vazio');
            if (msgVazio) msgVazio.style.display = 'block';
        }
    }
}


// 6. Filtro dinâmico do painel (UX de Campo)
// function filtrarCanteiros(tipo) {
//     const cards = document.querySelectorAll('#lista-canteiros .card');
//     const lista = document.getElementById('lista-canteiros');
    
//     document.getElementById('filtro-todos').classList.toggle('active-filtro', tipo === 'todos');
//     document.getElementById('filtro-urgentes').classList.toggle('active-filtro', tipo === 'urgentes');

//     const msgFiltroAnterior = document.getElementById('msg-filtro-vazio');
//     if (msgFiltroAnterior) msgFiltroAnterior.remove();

//     let contadorVisiveis = 0;

//     cards.forEach(card => {
//         if (tipo === 'todos') {
//             card.style.display = 'flex';
//             contadorVisiveis++;
//         } else if (tipo === 'urgentes') {
//             if (card.classList.contains('card-urgente')) {
//                 card.style.display = 'flex';
//                 contadorVisiveis++;
//             } else {
//                 card.style.display = 'none';
//             }
//         }
//     });

//     const msgVazioGeral = document.getElementById('msg-vazio');
//     if (contadorVisiveis === 0 && msgVazioGeral.style.display !== 'block') {
//         const msg = document.createElement('p');
//         msg.id = 'msg-filtro-vazio';
//         msg.style.fontWeight = 'bold';
//         msg.style.color = 'var(--verde-escuro)';
//         msg.innerText = '✅ Não existem canteiros necessitando de colheita no momento.';
//         lista.appendChild(msg);
//     }
// }