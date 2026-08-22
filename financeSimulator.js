/**
 * Renders the Finance Simulator widget.
 * @param {Number} vehiclePrice - Price of the vehicle
 */
export function renderFinanceSimulator(vehiclePrice) {
    const defaultDownPayment = Math.round(vehiclePrice * 0.3); // 30% padrão
    const minDownPayment = Math.round(vehiclePrice * 0.1); // Mínimo 10%
    const maxDownPayment = Math.round(vehiclePrice * 0.9); // Máximo 90%

    return `
    <div class="detail-card">
        <h3 style="font-size:1.3rem; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
            <i class="fa-solid fa-calculator" style="color:var(--primary-color);"></i> Simulação de Financiamento
        </h3>
        
        <div class="sim-grid">
            <!-- Valor da Entrada Slider -->
            <div class="sim-slider-container">
                <div class="sim-slider-header">
                    <span>Valor da Entrada</span>
                    <span id="sim-down-payment-label">R$ ${defaultDownPayment.toLocaleString('pt-BR')}</span>
                </div>
                <input type="range" class="sim-slider" id="sim-down-payment-slider" 
                       min="${minDownPayment}" max="${maxDownPayment}" step="1000" value="${defaultDownPayment}">
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted);">
                    <span>Min: R$ ${minDownPayment.toLocaleString('pt-BR')}</span>
                    <span>Max: R$ ${maxDownPayment.toLocaleString('pt-BR')}</span>
                </div>
            </div>

            <!-- Parcelas Select -->
            <div class="form-group" style="margin-bottom:0;">
                <label for="sim-installments-select" style="font-weight:600; font-size:0.9rem;">Número de Parcelas</label>
                <select class="filter-control" id="sim-installments-select">
                    <option value="12">12 meses</option>
                    <option value="24">24 meses</option>
                    <option value="36">36 meses</option>
                    <option value="48" selected>48 meses</option>
                    <option value="60">60 meses</option>
                </select>
            </div>

            <!-- Taxa de Juros Informativa -->
            <div style="font-size:0.75rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                <span>Taxa de juros aproximada:</span>
                <span style="font-weight:600;">1,49% a.m.</span>
            </div>

            <!-- Resultados da Simulação -->
            <div class="sim-results">
                <div class="sim-result-row">
                    <span>Valor a financiar:</span>
                    <span id="sim-financed-val">R$ 0,00</span>
                </div>
                <div class="sim-result-row">
                    <span>Valor da entrada:</span>
                    <span id="sim-entry-val">R$ 0,00</span>
                </div>
                <div class="sim-result-row">
                    <span>Valor da Parcela:</span>
                    <span id="sim-installment-val" style="font-size:1.2rem; font-weight:800; color:var(--primary-color);">R$ 0,00</span>
                </div>
            </div>

            <button class="btn btn-primary" id="sim-interest-btn" style="width:100%;">
                <i class="fa-solid fa-paper-plane"></i> Enviar Proposta de Financiamento
            </button>
        </div>
    </div>
    `;
}

/**
 * Binds events and runs the simulator calculations.
 */
export function initFinanceSimulatorEvents(vehiclePrice, onSubmitProposal) {
    const slider = document.getElementById('sim-down-payment-slider');
    const label = document.getElementById('sim-down-payment-label');
    const select = document.getElementById('sim-installments-select');
    
    const financedValText = document.getElementById('sim-financed-val');
    const entryValText = document.getElementById('sim-entry-val');
    const installmentText = document.getElementById('sim-installment-val');
    const submitBtn = document.getElementById('sim-interest-btn');

    const monthlyInterestRate = 0.0149; // 1.49% a.m.

    function calculate() {
        if (!slider || !select) return;
        const downPayment = parseInt(slider.value);
        const months = parseInt(select.value);
        
        const financedAmount = vehiclePrice - downPayment;
        
        // Fórmulas de juros compostos franceses (Tabela Price)
        // PMT = PV * (i * (1+i)^n) / (((1+i)^n) - 1)
        let monthlyPayment = 0;
        if (financedAmount > 0) {
            const compoundInterestFactor = Math.pow(1 + monthlyInterestRate, months);
            monthlyPayment = financedAmount * (monthlyInterestRate * compoundInterestFactor) / (compoundInterestFactor - 1);
        }

        // Atualiza textos
        label.innerText = `R$ ${downPayment.toLocaleString('pt-BR')}`;
        entryValText.innerText = `R$ ${downPayment.toLocaleString('pt-BR')}`;
        financedValText.innerText = `R$ ${financedAmount.toLocaleString('pt-BR')}`;
        installmentText.innerText = `${months}x de R$ ${monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (slider) slider.addEventListener('input', calculate);
    if (select) select.addEventListener('change', calculate);

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const downVal = parseInt(slider.value);
            const months = parseInt(select.value);
            const instVal = installmentText.innerText;
            if (onSubmitProposal) {
                onSubmitProposal(downVal, months, instVal);
            }
        });
    }

    // Executa a primeira vez
    calculate();
}
