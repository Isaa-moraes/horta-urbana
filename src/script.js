// 1. FUNÇÃO DE NAVEGAÇÃO (SPA) E GEOLOCALIZAÇÃO
function navegar(idPagina) {
    const paginas = document.querySelectorAll('.pagina');
    paginas.forEach(secao => secao.style.display = 'none');
    
    const paginaAlvo = document.getElementById(idPagina);
    if (paginaAlvo) {
        paginaAlvo.style.display = 'flex';
        paginaAlvo.style.flexDirection = 'column';
    }

    const botoes = document.querySelectorAll('.btn-nav');
    botoes.forEach(btn => btn.classList.remove('active'));
    botoes.forEach(btn => {
        if (btn.getAttribute('onclick').includes(idPagina)) {
            btn.classList.add('active');
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
                            <button class="btn-acao" style="padding: 10px; font-size: 0.9rem;" onclick="window.open('https://google.com{lat},${lon}')">Ver no Google Maps</button>
                        </div>`;
                },
                () => { placeholder.innerHTML = "<p>❌ Localização não permitida.</p>"; }
            );
        }
    }
}

window.onload = () => navegar('novo-plantio');

// 2. LÓGICA DO FORMULÁRIO (CORRIGIDA)
const form = document.getElementById('form-plantio');
form.addEventListener('submit', function(e) {
    e.preventDefault();

    let cultura = document.getElementById('cultura').value;
    const dataInput = document.getElementById('data').value; 
    const area = parseFloat(document.getElementById('area').value);
    let diasParaColheita;

    // Lógica para cultura personalizada ou padrão
    if (cultura === 'outro') {
        cultura = document.getElementById('nova-cultura').value;
        diasParaColheita = parseInt(document.getElementById('novo-tempo').value);
        
        if (!cultura || !diasParaColheita) {
            alert("Preencha o nome e o tempo da nova cultura!");
            return;
        }
    } else {
        diasParaColheita = cultura === "Alface" ? 45 : (cultura === "Tomate" ? 90 : 70);
    }
    
    // Cálculos de Sementes e Datas
    const sementes = Math.ceil(area * 50); 
    const dataPlantioBr = dataInput.split('-').reverse().join('/');
    
    let dataObjeto = new Date(dataInput + "T00:00:00"); 
    dataObjeto.setDate(dataObjeto.getDate() + diasParaColheita);
    const dataFimBr = dataObjeto.toLocaleDateString('pt-BR');

    // Enviar para o painel
    criarCardNoPainel(cultura, dataPlantioBr, dataFimBr, sementes);

    form.reset();
    document.getElementById('campos-extras').style.display = 'none'; // Esconde campos de 'outro'
    alert("Plantio salvo com sucesso!");
    navegar('painel'); 
});

// 3. MOSTRAR CAMPOS EXTRAS
function verificarOutro(valor) {
    const camposExtras = document.getElementById('campos-extras');
    camposExtras.style.display = (valor === 'outro') ? 'flex' : 'none';
}

// 4. CRIAR CARD NO PAINEL (INTERFACE REATIVA)
function criarCardNoPainel(nome, inicio, fim, sementes) {
    const lista = document.getElementById('lista-canteiros');
    const msgVazio = document.getElementById('msg-vazio');
    if (msgVazio) msgVazio.style.display = 'none';

    const card = document.createElement('div');
    card.className = 'card';

    // Lógica de alerta pulsante
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const partesData = fim.split('/');
    const dataColheitaObj = new Date(partesData[2], partesData[1] - 1, partesData[0]);

    if (hoje >= dataColheitaObj) {
        card.classList.add('card-urgente');
    }

    card.innerHTML = `
        <h3>🌿 ${nome}</h3>
        <p><strong>Data de Plantio:</strong> ${inicio}</p>
        <p><strong>Previsão de Colheita:</strong> ${fim}</p>
        <p><strong>Insumos:</strong> ${sementes} sementes</p>
        <hr>
        <small>Status: ${hoje >= dataColheitaObj ? '⚠️ Necessita de colheita!' : 'Em monitoramento'}</small>
    `;
    lista.appendChild(card);
}
