document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (localStorage.getItem('zentry_logged_in') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    // ========== ESTADO DA APLICAÇÃO ==========
    let saldo = 8742.56;
    let faturaCartao = 1245.90;
    let limiteDisponivel = 2500.00;
    let currentSection = 'inicio';
    let cartaoBloqueado = false;
    let limiteCartao = 5000.00;
    let userData = {
        nome: "Carlos Silva",
        email: "carlos.silva@email.com",
        telefone: "(11) 98765-4321",
        senha: "zentry123"
    };
    
    let notifications = [
        { id: 1, title: "Bem-vindo ao Zentry", message: "Seu login foi realizado com sucesso", read: false },
        { id: 2, title: "Atualização disponível", message: "Nova versão do app na loja", read: false },
        { id: 3, title: "Oferta especial", message: "Limite do cartão aumentado para R$ 5.000,00", read: false }
    ];

    let investments = [
        { id: 1, name: "Zentry Guard", rate: "100% CDI", minValue: 100, liquidity: "Imediata" },
        { id: 2, name: "Zentry+ CDB", rate: "110% CDI", minValue: 1000, liquidity: "2 anos" },
        { id: 3, name: "Zentry Tesouro", rate: "IPCA+5,23%", minValue: 50, liquidity: "Longo prazo" }
    ];

    // ========== FUNÇÕES AUXILIARES ==========
    function formatMoney(value) {
        return value.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 2
        });
    }

    function updateUI() {
        // Atualizar saldo
        document.querySelector('.balance-amount').textContent = formatMoney(saldo);
        
        // Atualizar limite disponível
        document.querySelector('.balance-details').textContent = `Limite disponível: ${formatMoney(limiteDisponivel)}`;
        
        // Atualizar fatura do cartão
        document.querySelector('.card-limit').textContent = `Fatura atual: ${formatMoney(faturaCartao)}`;
        
        // Atualizar notificações
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        
        // Atualizar status do cartão
        if (cartaoBloqueado) {
            document.querySelector('.card-detail').style.opacity = '0.6';
            bloquearCartaoBtn.innerHTML = '<i class="fas fa-unlock"></i> <span>Desbloquear Cartão</span>';
        } else {
            document.querySelector('.card-detail').style.opacity = '1';
            bloquearCartaoBtn.innerHTML = '<i class="fas fa-lock"></i> <span>Bloquear Cartão</span>';
        }
    }

    function showSection(sectionId) {
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        const activeSection = document.getElementById(`${sectionId}-section`);
        if (activeSection) {
            activeSection.style.display = 'block';
            currentSection = sectionId;
        }
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });
    }

    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    function addTransaction(name, amount, type, description = '') {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.innerHTML = `
            <div class="transaction-icon">
                <i class="fas fa-${type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <h3>${name}</h3>
                <span>Hoje, ${timeString}</span>
                ${description ? `<p class="transaction-description">${description}</p>` : ''}
            </div>
            <div class="transaction-amount ${type}">
                ${type === 'income' ? '+' : '-'} ${formatMoney(amount)}
            </div>
        `;
        
        transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    }

    function showNotifications() {
        const notificationPopup = document.createElement('div');
        notificationPopup.className = 'notification-popup';
        
        const unreadCount = notifications.filter(n => !n.read).length;
        notificationPopup.innerHTML = `
            <div class="notification-header">
                <h3>Notificações (${unreadCount})</h3>
                <button class="close-notifications">&times;</button>
            </div>
            <div class="notification-content">
                ${notifications.map(n => `
                    <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
                        <h4>${n.title}</h4>
                        <p>${n.message}</p>
                        <span class="notification-time">Agora há pouco</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(notificationPopup);
        
        notificationPopup.querySelector('.close-notifications').addEventListener('click', () => {
            notificationPopup.remove();
        });
        
        notificationPopup.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                notifications = notifications.map(n => 
                    n.id === id ? {...n, read: true} : n
                );
                updateUI();
                this.classList.replace('unread', 'read');
            });
        });
    }

    function applyInputMasks() {
        // Máscara para CPF
        const cpfInputs = document.querySelectorAll('input[type="text"][id*="cpf"]');
        cpfInputs.forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length > 3) value = value.replace(/^(\d{3})(\d)/, '$1.$2');
                if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
                if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
                if (value.length > 11) value = value.substring(0, 14);
                this.value = value;
            });
        });

        // Máscara para telefone
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length > 0) value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                if (value.length > 10) value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                this.value = value.substring(0, 15);
            });
        });

        // Máscara para valores monetários
        const moneyInputs = document.querySelectorAll('input[type="text"][id*="Value"]');
        moneyInputs.forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                value = (value / 100).toFixed(2);
                value = value.replace('.', ',');
                value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                this.value = 'R$ ' + value;
            });
        });
    }

    function createModals() {
        // Modal de comprovante genérico
        const receiptModal = document.createElement('div');
        receiptModal.className = 'modal';
        receiptModal.id = 'receiptModal';
        receiptModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal">&times;</span>
                <h2>Comprovante</h2>
                <div class="receipt-content" style="background: white; color: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 50px; color: var(--success-color);"></i>
                        <h3 style="margin-top: 10px; color: var(--success-color);">Operação realizada com sucesso!</h3>
                    </div>
                    <div id="receiptDetails" style="border-top: 1px dashed #ccc; padding-top: 15px;"></div>
                    <div style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                </div>
                <button class="btn-close-modal" style="width: 100%;">Fechar</button>
            </div>
        `;
        document.body.appendChild(receiptModal);

        // Modal de bloquear cartão
        const blockCardModal = document.createElement('div');
        blockCardModal.className = 'modal';
        blockCardModal.id = 'blockCardModal';
        blockCardModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>${cartaoBloqueado ? 'Desbloquear' : 'Bloquear'} Cartão</h2>
                <p>Tem certeza que deseja ${cartaoBloqueado ? 'desbloquear' : 'bloquear'} seu cartão?</p>
                <div class="modal-actions">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-confirm-block">${cartaoBloqueado ? 'Desbloquear' : 'Bloquear'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(blockCardModal);

        // Modal de ajuste de limite
        const adjustLimitModal = document.createElement('div');
        adjustLimitModal.className = 'modal';
        adjustLimitModal.id = 'adjustLimitModal';
        adjustLimitModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Ajustar Limite do Cartão</h2>
                <form id="adjustLimitForm">
                    <div class="form-group">
                        <label for="newLimit">Novo limite (R$)</label>
                        <input type="text" id="newLimit" value="${limiteCartao.toFixed(2).replace('.', ',')}" required>
                    </div>
                    <button type="submit" class="btn-confirm">Confirmar</button>
                </form>
            </div>
        `;
        document.body.appendChild(adjustLimitModal);

        // Modal de cartão virtual
        const virtualCardModal = document.createElement('div');
        virtualCardModal.className = 'modal';
        virtualCardModal.id = 'virtualCardModal';
        virtualCardModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Cartão Virtual</h2>
                <div class="virtual-card-info">
                    <p><strong>Número:</strong> •••• •••• •••• 7890</p>
                    <p><strong>CVV:</strong> 123</p>
                    <p><strong>Validade:</strong> 05/28</p>
                    <p><strong>Limite:</strong> ${formatMoney(limiteCartao)}</p>
                    <p><strong>Status:</strong> ${cartaoBloqueado ? 'Bloqueado' : 'Ativo'}</p>
                </div>
                <button class="btn-close-modal">Fechar</button>
            </div>
        `;
        document.body.appendChild(virtualCardModal);

        // Modal de alterar senha
        const changePasswordModal = document.createElement('div');
        changePasswordModal.className = 'modal';
        changePasswordModal.id = 'changePasswordModal';
        changePasswordModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Alterar Senha</h2>
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label for="currentPassword">Senha atual</label>
                        <input type="password" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="newPassword">Nova senha</label>
                        <input type="password" id="newPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmar nova senha</label>
                        <input type="password" id="confirmPassword" required>
                    </div>
                    <button type="submit" class="btn-confirm">Alterar Senha</button>
                </form>
            </div>
        `;
        document.body.appendChild(changePasswordModal);

        // Modal de alterar e-mail
        const changeEmailModal = document.createElement('div');
        changeEmailModal.className = 'modal';
        changeEmailModal.id = 'changeEmailModal';
        changeEmailModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Alterar E-mail</h2>
                <form id="changeEmailForm">
                    <div class="form-group">
                        <label for="newEmail">Novo e-mail</label>
                        <input type="email" id="newEmail" value="${userData.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmEmail">Confirmar novo e-mail</label>
                        <input type="email" id="confirmEmail" value="${userData.email}" required>
                    </div>
                    <button type="submit" class="btn-confirm">Alterar E-mail</button>
                </form>
            </div>
        `;
        document.body.appendChild(changeEmailModal);

        // Modal de alterar telefone
        const changePhoneModal = document.createElement('div');
        changePhoneModal.className = 'modal';
        changePhoneModal.id = 'changePhoneModal';
        changePhoneModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Alterar Telefone</h2>
                <form id="changePhoneForm">
                    <div class="form-group">
                        <label for="newPhone">Novo telefone</label>
                        <input type="tel" id="newPhone" placeholder="(XX) XXXXX-XXXX" value="${userData.telefone}" required>
                    </div>
                    <button type="submit" class="btn-confirm">Alterar Telefone</button>
                </form>
            </div>
        `;
        document.body.appendChild(changePhoneModal);

        // Modal de investimento
        const investModal = document.createElement('div');
        investModal.className = 'modal';
        investModal.id = 'investModal';
        investModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Investir</h2>
                <form id="investForm">
                    <div class="form-group">
                        <label for="investmentType">Tipo de investimento</label>
                        <select id="investmentType" required>
                            <option value="">Selecione...</option>
                            ${investments.map(inv => 
                                `<option value="${inv.id}">${inv.name} (${inv.rate})</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="investmentValue">Valor</label>
                        <input type="text" id="investmentValue" placeholder="R$ 0,00" required>
                    </div>
                    <button type="submit" class="btn-confirm">Investir</button>
                </form>
            </div>
        `;
        document.body.appendChild(investModal);

        // Modal de receber PIX
        const receivePixModal = document.createElement('div');
        receivePixModal.className = 'modal';
        receivePixModal.id = 'receivePixModal';
        receivePixModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Receber PIX</h2>
                <form id="receivePixForm">
                    <div class="form-group">
                        <label for="pixReceiverValue">Valor a receber</label>
                        <input type="text" id="pixReceiverValue" placeholder="R$ 0,00" required>
                    </div>
                    <div class="form-group">
                        <label for="pixReceiverDescription">Descrição (opcional)</label>
                        <input type="text" id="pixReceiverDescription" placeholder="Ex: Pagamento serviço">
                    </div>
                    <button type="submit" class="btn-confirm">Gerar QR Code</button>
                </form>
            </div>
        `;
        document.body.appendChild(receivePixModal);

        // Modal de cobrar PIX
        const chargePixModal = document.createElement('div');
        chargePixModal.className = 'modal';
        chargePixModal.id = 'chargePixModal';
        chargePixModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Cobrar via PIX</h2>
                <form id="chargePixForm">
                    <div class="form-group">
                        <label for="pixChargeValue">Valor</label>
                        <input type="text" id="pixChargeValue" placeholder="R$ 0,00" required>
                    </div>
                    <div class="form-group">
                        <label for="pixChargeKey">Chave PIX do destinatário</label>
                        <input type="text" id="pixChargeKey" placeholder="CPF, e-mail, telefone ou chave aleatória" required>
                    </div>
                    <div class="form-group">
                        <label for="pixChargeDescription">Descrição</label>
                        <input type="text" id="pixChargeDescription" placeholder="Ex: Pagamento serviço" required>
                    </div>
                    <button type="submit" class="btn-confirm">Enviar Cobrança</button>
                </form>
            </div>
        `;
        document.body.appendChild(chargePixModal);

        // Modal de minhas chaves PIX
        const pixKeysModal = document.createElement('div');
        pixKeysModal.className = 'modal';
        pixKeysModal.id = 'pixKeysModal';
        pixKeysModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Minhas Chaves PIX</h2>
                <div class="pix-keys-list">
                    <div class="pix-key-item">
                        <div class="key-info">
                            <i class="fas fa-mobile-alt"></i>
                            <div>
                                <h3>Telefone</h3>
                                <p>(61) 99358-6311</p>
                            </div>
                        </div>
                        <button class="btn-copy-key" data-key="61993586311">
                            <i class="far fa-copy"></i> Copiar
                        </button>
                    </div>
                    <div class="pix-key-item">
                        <div class="key-info">
                            <i class="fas fa-id-card"></i>
                            <div>
                                <h3>CPF</h3>
                                <p>096.208.611-83</p>
                            </div>
                        </div>
                        <button class="btn-copy-key" data-key="09620861183">
                            <i class="far fa-copy"></i> Copiar
                        </button>
                    </div>
                </div>
                <button class="btn-close-modal">Fechar</button>
            </div>
        `;
        document.body.appendChild(pixKeysModal);

        // Modal de pagar contas
        const payBillsModal = document.createElement('div');
        payBillsModal.className = 'modal';
        payBillsModal.id = 'payBillsModal';
        payBillsModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Pagar Contas</h2>
                <form id="payBillsForm">
                    <div class="form-group">
                        <label for="billType">Tipo de conta</label>
                        <select id="billType" required>
                            <option value="">Selecione...</option>
                            <option value="agua">Água</option>
                            <option value="luz">Energia Elétrica</option>
                            <option value="gas">Gás</option>
                            <option value="telefone">Telefone</option>
                            <option value="internet">Internet</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="billCode">Código de barras</label>
                        <input type="text" id="billCode" placeholder="Digite o código da conta" required>
                    </div>
                    <div class="form-group">
                        <label for="billValue">Valor</label>
                        <input type="text" id="billValue" placeholder="R$ 0,00" required>
                    </div>
                    <button type="submit" class="btn-confirm">Pagar Conta</button>
                </form>
            </div>
        `;
        document.body.appendChild(payBillsModal);

        // Modal de pagar impostos
        const payTaxesModal = document.createElement('div');
        payTaxesModal.className = 'modal';
        payTaxesModal.id = 'payTaxesModal';
        payTaxesModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Pagar Impostos</h2>
                <form id="payTaxesForm">
                    <div class="form-group">
                        <label for="taxType">Tipo de imposto</label>
                        <select id="taxType" required>
                            <option value="">Selecione...</option>
                            <option value="iptu">IPTU</option>
                            <option value="ipva">IPVA</option>
                            <option value="irpf">IRPF</option>
                            <option value="das">DAS (MEI)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="taxCode">Código de barras</label>
                        <input type="text" id="taxCode" placeholder="Digite o código do imposto" required>
                    </div>
                    <div class="form-group">
                        <label for="taxValue">Valor</label>
                        <input type="text" id="taxValue" placeholder="R$ 0,00" required>
                    </div>
                    <button type="submit" class="btn-confirm">Pagar Imposto</button>
                </form>
            </div>
        `;
        document.body.appendChild(payTaxesModal);

        // Modal de transferência
        const transferModal = document.getElementById('transferModal');
        if (transferModal) {
            transferModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(
                    this.querySelector('#transferValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );
                
                if (value <= 0) {
                    alert('Informe um valor válido para transferência!');
                    return;
                }
                
                if (value > saldo) {
                    alert('Saldo insuficiente para realizar esta transferência!');
                    return;
                }
                
                const to = this.querySelector('#transferTo').value;
                const description = this.querySelector('#transferDescription').value || 'Transferência PIX';
                const now = new Date();
                
                saldo -= value;
                addTransaction(description, value, 'outcome', `Para: ${to}`);
                
                // Mostrar comprovante com todos os detalhes
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Transferência</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--primary-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Transferência PIX</p>
                        <p><strong>Origem:</strong> ${userData.nome}</p>
                        <p><strong>Destino:</strong> ${to}</p>
                        ${description ? `<p><strong>Descrição:</strong> ${description}</p>` : ''}
                        <p><strong>Taxa:</strong> Isenta</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Transação processada instantaneamente</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Modal de depósito
        const depositModal = document.getElementById('depositModal');
        if (depositModal) {
            depositModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(
                    this.querySelector('#depositValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );
                
                if (value <= 0) {
                    alert('Informe um valor válido para depósito!');
                    return;
                }
                
                const type = this.querySelector('input[name="depositType"]:checked').value;
                const now = new Date();
                
                saldo += value;
                addTransaction(`Depósito ${type}`, value, 'income');
                
                // Mostrar comprovante detalhado
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Depósito</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--success-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Depósito ${type}</p>
                        <p><strong>Conta destino:</strong> ${userData.nome}</p>
                        <p><strong>Agência/Conta:</strong> 0001 / 123456-7</p>
                        <p><strong>Instituição:</strong> Zentry Bank (123)</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Valor disponível imediatamente</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Modal de pagamento
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) {
            paymentModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(
                    this.querySelector('#paymentValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );
                
                if (value <= 0) {
                    alert('Informe um valor válido para pagamento!');
                    return;
                }
                
                if (value > saldo) {
                    alert('Saldo insuficiente para realizar este pagamento!');
                    return;
                }
                
                const code = this.querySelector('#paymentCode').value;
                const now = new Date();
                
                saldo -= value;
                addTransaction('Pagamento', value, 'outcome', `Código: ${code}`);
                
                // Mostrar comprovante detalhado
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Pagamento</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--primary-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Pagamento de conta</p>
                        <p><strong>Código:</strong> ${code}</p>
                        <p><strong>Origem:</strong> ${userData.nome}</p>
                        <p><strong>Agência/Conta:</strong> 0001 / 123456-7</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Pagamento processado com sucesso</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Modal de fatura
        const invoiceModal = document.getElementById('invoiceModal');
        if (invoiceModal) {
            invoiceModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(
                    this.querySelector('#invoiceValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );
                
                if (value <= 0) {
                    alert('Informe um valor válido para pagamento!');
                    return;
                }
                
                if (value > saldo) {
                    alert('Saldo insuficiente para pagar esta fatura!');
                    return;
                }
                
                if (value > faturaCartao) {
                    alert('O valor informado é maior que o valor da fatura!');
                    return;
                }
                
                const now = new Date();
                
                saldo -= value;
                faturaCartao -= value;
                limiteDisponivel = limiteCartao - faturaCartao;
                addTransaction('Pagamento fatura', value, 'outcome', `Cartão •••• 7890`);
                
                // Mostrar comprovante detalhado
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Pagamento</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--primary-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Pagamento de fatura</p>
                        <p><strong>Cartão:</strong> •••• •••• •••• 7890</p>
                        <p><strong>Valor pago:</strong> ${formatMoney(value)}</p>
                        <p><strong>Fatura restante:</strong> ${formatMoney(faturaCartao)}</p>
                        <p><strong>Limite disponível:</strong> ${formatMoney(limiteDisponivel)}</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Pagamento processado com sucesso</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Modal de recarga
        const rechargeModal = document.getElementById('rechargeModal');
        if (rechargeModal) {
            rechargeModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(
                    this.querySelector('#rechargeValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );
                
                if (value <= 0) {
                    alert('Informe um valor válido para recarga!');
                    return;
                }
                
                if (value > saldo) {
                    alert('Saldo insuficiente para realizar esta recarga!');
                    return;
                }
                
                const phone = this.querySelector('#rechargePhone').value;
                const now = new Date();
                
                saldo -= value;
                addTransaction('Recarga celular', value, 'outcome', `Número: ${phone}`);
                
                // Mostrar comprovante detalhado
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Recarga</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--primary-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Recarga celular</p>
                        <p><strong>Operadora:</strong> ${document.querySelector('.operator.active')?.textContent || 'Não especificada'}</p>
                        <p><strong>Número:</strong> ${phone}</p>
                        <p><strong>Valor:</strong> ${formatMoney(value)}</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Recarga efetivada com sucesso</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Modal de investimento
        const investmodal = document.getElementById('investModal');
        if (investModal) {
            investModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const type = this.querySelector('#investmentType').value;
                const value = parseFloat(
                    this.querySelector('#investmentValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );

                if (!type) {
                    alert('Selecione um tipo de investimento!');
                    return;
                }

                const investment = investments.find(inv => inv.id == type);
                
                if (value < investment.minValue) {
                    alert(`O valor mínimo para este investimento é ${formatMoney(investment.minValue)}`);
                    return;
                }

                if (value > saldo) {
                    alert('Saldo insuficiente para este investimento!');
                    return;
                }

                const now = new Date();
                
                saldo -= value;
                addTransaction(`Investimento em ${investment.name}`, value, 'outcome', `Taxa: ${investment.rate}`);
                
                // Mostrar comprovante detalhado
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Investimento</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--primary-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Aplicação financeira</p>
                        <p><strong>Investimento:</strong> ${investment.name}</p>
                        <p><strong>Taxa:</strong> ${investment.rate}</p>
                        <p><strong>Valor aplicado:</strong> ${formatMoney(value)}</p>
                        <p><strong>Liquidez:</strong> ${investment.liquidity}</p>
                        <p><strong>Valor mínimo:</strong> ${formatMoney(investment.minValue)}</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Investimento realizado com sucesso</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Modal de pagar contas
        const paybillsmodal = document.getElementById('payBillsModal');
        if (payBillsModal) {
            payBillsModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(
                    this.querySelector('#billValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );
                
                if (value <= 0) {
                    alert('Informe um valor válido para pagamento!');
                    return;
                }
                
                if (value > saldo) {
                    alert('Saldo insuficiente para realizar este pagamento!');
                    return;
                }
                
                const billType = this.querySelector('#billType').value;
                const code = this.querySelector('#billCode').value;
                const now = new Date();
                const billTypes = {
                    'agua': 'Água',
                    'luz': 'Energia Elétrica',
                    'gas': 'Gás',
                    'telefone': 'Telefone',
                    'internet': 'Internet'
                };
                
                saldo -= value;
                addTransaction(`Pagamento ${billTypes[billType]}`, value, 'outcome', `Código: ${code}`);
                
                // Mostrar comprovante detalhado
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Pagamento</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--primary-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Pagamento de conta</p>
                        <p><strong>Serviço:</strong> ${billTypes[billType]}</p>
                        <p><strong>Código:</strong> ${code}</p>
                        <p><strong>Valor:</strong> ${formatMoney(value)}</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Pagamento processado com sucesso</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Modal de pagar impostos
        const paytaxesmodal = document.getElementById('payTaxesModal');
        if (payTaxesModal) {
            payTaxesModal.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                const value = parseFloat(
                    this.querySelector('#taxValue').value
                        .replace('R$ ', '')
                        .replace('.', '')
                        .replace(',', '.')
                );
                
                if (value <= 0) {
                    alert('Informe um valor válido para pagamento!');
                    return;
                }
                
                if (value > saldo) {
                    alert('Saldo insuficiente para realizar este pagamento!');
                    return;
                }
                
                const taxType = this.querySelector('#taxType').value;
                const code = this.querySelector('#taxCode').value;
                const now = new Date();
                const taxTypes = {
                    'iptu': 'IPTU',
                    'ipva': 'IPVA',
                    'irpf': 'IRPF',
                    'das': 'DAS (MEI)'
                };
                
                saldo -= value;
                addTransaction(`Pagamento ${taxTypes[taxType]}`, value, 'outcome', `Código: ${code}`);
                
                // Mostrar comprovante detalhado
                const receiptDetails = document.getElementById('receiptDetails');
                receiptDetails.innerHTML = `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">Comprovante de Pagamento</h3>
                        <p style="font-size: 14px; color: #666;">ID: ${Math.floor(Math.random() * 10000000000)}</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <p><strong>Valor:</strong></p>
                            <p style="font-size: 24px; color: var(--primary-color);">${formatMoney(value)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Data/Hora:</strong></p>
                            <p>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-bottom: 15px;">
                        <p><strong>Tipo:</strong> Pagamento de imposto</p>
                        <p><strong>Imposto:</strong> ${taxTypes[taxType]}</p>
                        <p><strong>Código:</strong> ${code}</p>
                        <p><strong>Valor:</strong> ${formatMoney(value)}</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        <p style="font-weight: bold;">Status da transação</p>
                        <p style="color: var(--success-color);">
                            <i class="fas fa-check-circle"></i> Concluída com sucesso
                        </p>
                        <p style="font-size: 12px;">Pagamento processado com sucesso</p>
                    </div>
                    
                    <div style="font-size: 12px; color: #666; text-align: center;">
                        <p>Este comprovante não tem valor fiscal</p>
                        <p>Comprovante gerado em: ${now.toLocaleString('pt-BR')}</p>
                        <p>Zentry Bank - CNPJ 00.000.000/0001-00</p>
                    </div>
                `;
                
                closeAllModals();
                showModal('receiptModal');
                this.reset();
                updateUI();
            });
        }

        // Aplicar máscaras aos inputs dos modais
        applyInputMasks();
    }

    function setupModalEvents() {
        // Bloquear/Desbloquear Cartão
        document.querySelector('.btn-confirm-block')?.addEventListener('click', function() {
            cartaoBloqueado = !cartaoBloqueado;
            alert(`Cartão ${cartaoBloqueado ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
            closeAllModals();
            updateUI();
        });

        // Ajustar Limite
        document.getElementById('adjustLimitForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const newLimit = parseFloat(
                this.querySelector('#newLimit').value
                    .replace('R$ ', '')
                    .replace('.', '')
                    .replace(',', '.')
            );

            if (!newLimit || newLimit < 1000) {
                alert('O limite mínimo é R$ 1.000,00');
                return;
            }

            limiteCartao = newLimit;
            limiteDisponivel = newLimit - faturaCartao;
            alert(`Limite do cartão ajustado para ${formatMoney(newLimit)}`);
            closeAllModals();
            updateUI();
        });

        // Alterar Senha
        document.getElementById('changePasswordForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const current = this.querySelector('#currentPassword').value;
            const newPass = this.querySelector('#newPassword').value;
            const confirm = this.querySelector('#confirmPassword').value;

            if (current !== userData.senha) {
                alert('Senha atual incorreta!');
                return;
            }

            if (newPass !== confirm) {
                alert('As novas senhas não coincidem!');
                return;
            }

            if (newPass.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres');
                return;
            }

            userData.senha = newPass;
            alert('Senha alterada com sucesso!');
            closeAllModals();
            this.reset();
        });

        // Alterar E-mail
        document.getElementById('changeEmailForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const newEmail = this.querySelector('#newEmail').value;
            const confirm = this.querySelector('#confirmEmail').value;

            if (newEmail !== confirm) {
                alert('Os e-mails não coincidem!');
                return;
            }

            if (!newEmail.includes('@') || !newEmail.includes('.')) {
                alert('Informe um e-mail válido!');
                return;
            }

            userData.email = newEmail;
            alert('E-mail alterado com sucesso!');
            closeAllModals();
        });

        // Alterar Telefone
        document.getElementById('changePhoneForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const newPhone = this.querySelector('#newPhone').value;

            if (newPhone.replace(/\D/g, '').length < 11) {
                alert('Informe um telefone válido!');
                return;
            }

            userData.telefone = newPhone;
            alert('Telefone alterado com sucesso!');
            closeAllModals();
        });

        // Investimento
        document.getElementById('investForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const type = this.querySelector('#investmentType').value;
            const value = parseFloat(
                this.querySelector('#investmentValue').value
                    .replace('R$ ', '')
                    .replace('.', '')
                    .replace(',', '.')
            );

            if (!type) {
                alert('Selecione um tipo de investimento!');
                return;
            }

            const investment = investments.find(inv => inv.id == type);
            
            if (value < investment.minValue) {
                alert(`O valor mínimo para este investimento é ${formatMoney(investment.minValue)}`);
                return;
            }

            if (value > saldo) {
                alert('Saldo insuficiente para este investimento!');
                return;
            }

            saldo -= value;
            addTransaction(`Investimento em ${investment.name}`, value, 'outcome', `Taxa: ${investment.rate}`);
            alert(`Investimento de ${formatMoney(value)} em ${investment.name} realizado com sucesso!`);
            closeAllModals();
            this.reset();
            updateUI();
        });

        // Receber PIX
        document.getElementById('receivePixForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const value = parseFloat(
                this.querySelector('#pixReceiverValue').value
                    .replace('R$ ', '')
                    .replace('.', '')
                    .replace(',', '.')
            );
            
            if (value <= 0) {
                alert('Informe um valor válido para receber!');
                return;
            }
            
            const description = this.querySelector('#pixReceiverDescription').value || 'Recebimento PIX';
            
            alert(`QR Code gerado para receber ${formatMoney(value)}!\nMostre este código para quem vai pagar.`);
            closeAllModals();
            this.reset();
        });

        // Cobrar PIX
        document.getElementById('chargePixForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const value = parseFloat(
                this.querySelector('#pixChargeValue').value
                    .replace('R$ ', '')
                    .replace('.', '')
                    .replace(',', '.')
            );
            
            if (value <= 0) {
                alert('Informe um valor válido para cobrar!');
                return;
            }
            
            const key = this.querySelector('#pixChargeKey').value;
            const description = this.querySelector('#pixChargeDescription').value;
            
            alert(`Cobrança de ${formatMoney(value)} enviada para ${key} com a descrição "${description}"!`);
            closeAllModals();
            this.reset();
        });

        // Copiar chave PIX
        document.querySelectorAll('.btn-copy-key')?.forEach(btn => {
            btn.addEventListener('click', function() {
                const key = this.dataset.key;
                navigator.clipboard.writeText(key);
                alert('Chave PIX copiada para a área de transferência!');
            });
        });

        // Fechar modais ao clicar no botão de fechar ou fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || 
                e.target.classList.contains('modal') ||
                e.target.classList.contains('btn-cancel') ||
                e.target.classList.contains('btn-close-modal')) {
                closeAllModals();
            }
        });
    }

    // ========== ELEMENTOS DO DOM ==========
    // Botões principais
    const pixBtn = document.querySelector('.pix-btn');
    const transferBtn = document.querySelector('.transfer-btn');
    const payBtn = document.querySelector('.pay-btn');
    const depositBtn = document.querySelector('.deposit-btn');
    const investBtn = document.querySelector('.btn-invest');
    const supportBtn = document.querySelector('.btn-support');
    const notificationBtn = document.querySelector('.btn-notification');
    const filterBtn = document.querySelector('.btn-filter');
    const showMoreBtn = document.querySelector('.btn-show-more');
    const logoutBtn = document.querySelector('.btn-logout');
    const payInvoiceBtn = document.querySelector('.btn-pay-invoice');
    const payFullBtn = document.querySelector('.btn-pay-full');
    const simulateLoanBtn = document.querySelector('.btn-simulate-loan');
    const requestLoanBtn = document.querySelector('.btn-request-loan');
    const bloquearCartaoBtn = document.querySelector('.btn-card-action[data-action="bloquear"]');

    // Atalhos
    const shortcutPix = document.querySelector('.shortcut-item[data-action="pix"]');
    const shortcutRecarga = document.querySelector('.shortcut-item[data-action="recarga"]');
    const shortcutEmprestimo = document.querySelector('.shortcut-item[data-action="emprestimo"]');
    const shortcutInvestir = document.querySelector('.shortcut-item[data-action="investir"]');
    const shortcutSeguros = document.querySelector('.shortcut-item[data-action="seguros"]');
    const shortcutMais = document.querySelector('.shortcut-item[data-action="mais"]');

    // Cartões
    const ajustarLimiteBtn = document.querySelector('.btn-card-action[data-action="ajustar"]');
    const cartaoVirtualBtn = document.querySelector('.btn-card-action[data-action="virtual"]');

    // Minha Conta
    const alterarSenhaBtn = document.querySelector('.btn-account-action:nth-child(1)');
    const alterarEmailBtn = document.querySelector('.btn-account-action:nth-child(2)');
    const alterarTelefoneBtn = document.querySelector('.btn-account-action:nth-child(3)');

    // Seções
    const sections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.main-nav li');
    const transactionsList = document.querySelector('.transactions-list');

    // PIX
    const pixReceiveBtn = document.querySelector('.pix-action[data-type="receber"]');
    const pixChargeBtn = document.querySelector('.pix-action[data-type="cobrar"]');
    const pixKeysBtn = document.querySelector('.pix-action[data-type="chaves"]');

    // Pagamentos
    const payBillsBtn = document.querySelector('.payment-method[data-method="conta"]');
    const payTaxesBtn = document.querySelector('.payment-method[data-method="imposto"]');

    // ========== EVENT LISTENERS ==========
    // Navegação principal
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(this.dataset.section);
        });
    });

    // Atalhos
    shortcutPix.addEventListener('click', () => showSection('pix'));
    shortcutRecarga.addEventListener('click', () => {
        showSection('recargas');
        document.getElementById('rechargePhone').focus();
    });
    shortcutEmprestimo.addEventListener('click', () => showSection('emprestimos'));
    shortcutInvestir.addEventListener('click', () => {
        showSection('investimentos');
        showModal('investModal');
    });
    shortcutSeguros.addEventListener('click', () => {
        alert('Redirecionando para página de seguros...');
    });
    shortcutMais.addEventListener('click', () => {
        alert('Serviço de câmbio de moedas disponível em nossas agências!');
    });

    // Cartões
    bloquearCartaoBtn.addEventListener('click', () => showModal('blockCardModal'));
    ajustarLimiteBtn.addEventListener('click', () => showModal('adjustLimitModal'));
    cartaoVirtualBtn.addEventListener('click', () => showModal('virtualCardModal'));

    // Minha Conta
    alterarSenhaBtn.addEventListener('click', () => showModal('changePasswordModal'));
    alterarEmailBtn.addEventListener('click', () => showModal('changeEmailModal'));
    alterarTelefoneBtn.addEventListener('click', () => showModal('changePhoneModal'));

    // Botões principais
    pixBtn.addEventListener('click', () => showSection('pix'));
    transferBtn.addEventListener('click', () => showModal('transferModal'));
    depositBtn.addEventListener('click', () => showModal('depositModal'));
    payBtn.addEventListener('click', () => showSection('pagamentos'));
    investBtn.addEventListener('click', () => {
        showSection('investimentos');
        showModal('investModal');
    });
    supportBtn.addEventListener('click', () => showModal('supportModal'));
    notificationBtn.addEventListener('click', showNotifications);
    filterBtn.addEventListener('click', () => {
        alert('Filtrando transações... (funcionalidade em desenvolvimento)');
    });
    showMoreBtn.addEventListener('click', loadMoreTransactions);
    logoutBtn.addEventListener('click', logout);
    payInvoiceBtn.addEventListener('click', () => showModal('invoiceModal'));
    payFullBtn.addEventListener('click', () => showModal('invoiceModal'));

    // Empréstimos
    simulateLoanBtn.addEventListener('click', showLoanSimulation);
    requestLoanBtn?.addEventListener('click', requestLoan);

    // PIX
    pixReceiveBtn?.addEventListener('click', () => showModal('receivePixModal'));
    pixChargeBtn?.addEventListener('click', () => showModal('chargePixModal'));
    pixKeysBtn?.addEventListener('click', () => showModal('pixKeysModal'));

    // Pagamentos
    payBillsBtn?.addEventListener('click', () => showModal('payBillsModal'));
    payTaxesBtn?.addEventListener('click', () => showModal('payTaxesModal'));

    // ========== FUNÇÕES ADICIONAIS ==========
    function loadMoreTransactions() {
        const moreTransactions = [
            { name: "Netflix", amount: 39.90, type: "outcome", desc: "Assinatura mensal" },
            { name: "Salário", amount: 5200.00, type: "income", desc: "Empresa XYZ" },
            { name: "Supermercado", amount: 327.45, type: "outcome", desc: "Mercado Central" }
        ];

        moreTransactions.forEach(t => {
            addTransaction(t.name, t.amount, t.type, t.desc);
        });

        showMoreBtn.textContent = "Não há mais transações";
        showMoreBtn.disabled = true;
    }

    function showLoanSimulation() {
        document.querySelector('.loan-offer').style.display = 'none';
        document.querySelector('.loan-simulation').style.display = 'block';
    }

    function requestLoan() {
        alert('Solicitação de empréstimo enviada para análise!\nVocê receberá uma resposta em até 2 dias úteis.');
        closeAllModals();
    }

    function logout() {
        localStorage.removeItem('zentry_logged_in');
        window.location.href = 'index.html';
    }

    // ========== INICIALIZAÇÃO ==========
    function init() {
        applyInputMasks();
        createModals();
        setupModalEvents();
        updateUI();
        showSection('inicio');

        // Adicionar transações iniciais
        const initialTransactions = [
            { name: "Amazon", amount: 129.90, type: "outcome", desc: "Compra online" },
            { name: "Transferência recebida", amount: 500.00, type: "income", desc: "João Silva" },
            { name: "Restaurante", amount: 87.50, type: "outcome", desc: "Jantar" }
        ];

        initialTransactions.forEach(t => {
            addTransaction(t.name, t.amount, t.type, t.desc);
        });
    }

    init();
});