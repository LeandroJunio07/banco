document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const cpfInput = document.getElementById('cpf');
    const senhaInput = document.getElementById('senha');
    const esqueciSenha = document.getElementById('esqueciSenha');
    const cadastrar = document.getElementById('cadastrar');

    // Máscara para CPF
    cpfInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        
        if (value.length > 3) value = value.replace(/^(\d{3})(\d)/g, '$1.$2');
        if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})(\d)/g, '$1.$2.$3');
        if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/g, '$1.$2.$3-$4');
        if (value.length > 14) value = value.substring(0, 14);
        
        this.value = value;
    });

    // Login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const cpf = cpfInput.value.replace(/\D/g, '');
        const senha = senhaInput.value;
        
        // Credenciais válidas
        const CPF_VALIDO = '12345678900';
        const SENHA_VALIDA = 'zentry123';
        
        if (cpf === CPF_VALIDO && senha === SENHA_VALIDA) {
            localStorage.setItem('zentry_logged_in', 'true');
            window.location.href = 'dashboard.html';
        } else {
            alert('CPF ou senha incorretos. Tente novamente.');
            senhaInput.value = '';
            senhaInput.focus();
        }
    });

    esqueciSenha.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Um link para redefinição de senha foi enviado para seu e-mail cadastrado.');
    });

    cadastrar.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Redirecionando para página de cadastro...');
    });
});