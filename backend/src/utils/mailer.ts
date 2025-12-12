import nodemailer from 'nodemailer';

// Configuração do transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465', // true para porta 465, false para outras
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verifica a conexão com o servidor SMTP (opcional, mas útil para debug)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erro na configuração do servidor de email:', error);
  } else {
    console.log('✅ Servidor de email está pronto para enviar mensagens');
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Função genérica para envio de emails
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  console.log('📨 Tentando enviar email...');
  console.log('   Para:', options.to);
  console.log('   Assunto:', options.subject);

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado com sucesso!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email. Verifique as configurações SMTP.');
  }
}

/**
 * Função específica para envio de código de redefinição de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<void> {
  console.log('🔐 Preparando email de redefinição de senha...');
  console.log('   Email destino:', email);
  console.log('   Código gerado:', code);

  const subject = 'Código de Redefinição de Senha';

  const text = `
Olá!

Você solicitou a redefinição de senha da sua conta.

Seu código de verificação é: ${code}

Este código expira em 10 minutos.

Se você não solicitou esta redefinição, por favor ignore este email.

Atenciosamente,
Equipe de Suporte
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #282828;
      background-color: #f6f6f6;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f6f6f6;
      padding: 40px 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .email-header {
      background: linear-gradient(135deg, #016be4 0%, #0a4296 100%);
      padding: 48px 40px;
      text-align: center;
      border-bottom: 3px solid #0a4296;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 26px;
      font-weight: 600;
      margin: 0;
      letter-spacing: 0.3px;
    }
    .email-header p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin: 8px 0 0 0;
      font-weight: 400;
    }
    .email-body {
      padding: 48px 40px;
    }
    .email-body h2 {
      color: #1e1e1e;
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 24px 0;
      letter-spacing: -0.3px;
    }
    .email-body p {
      color: #454f60;
      font-size: 16px;
      line-height: 1.7;
      margin: 0 0 16px 0;
    }
    .emphasis-text {
      color: #282828;
      font-weight: 500;
    }
    .code-section {
      margin: 36px 0;
    }
    .code-container {
      background: #f8f9fc;
      border: 2px solid #e3e7ed;
      border-radius: 8px;
      padding: 32px 24px;
      text-align: center;
    }
    .code-label {
      color: #6b7280;
      font-size: 12px;
      font-weight: 600;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .code {
      font-size: 36px;
      font-weight: 700;
      color: #016be4;
      letter-spacing: 12px;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      margin: 0;
      user-select: all;
      padding: 8px 0;
    }
    .code-meta {
      color: #9ca3af;
      font-size: 12px;
      margin: 12px 0 0 0;
      font-style: italic;
    }
    .info-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      padding: 16px 20px;
      margin: 32px 0;
    }
    .info-box-title {
      color: #92400e;
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-box-title::before {
      content: '';
      width: 18px;
      height: 18px;
      background-color: #f59e0b;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .info-box p {
      color: #78350f;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    .security-note {
      background-color: #f0f9ff;
      border: 1px solid #e0f2fe;
      border-radius: 6px;
      padding: 20px 24px;
      margin: 32px 0;
    }
    .security-note-title {
      color: #0c4a6e;
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    .security-note p {
      color: #075985;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
      margin: 36px 0;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-brand {
      color: #1e1e1e;
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    .footer-note {
      color: #6b7280;
      font-size: 13px;
      margin: 4px 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .email-header {
        padding: 36px 24px;
      }
      .email-header h1 {
        font-size: 22px;
      }
      .email-body {
        padding: 36px 24px;
      }
      .email-body h2 {
        font-size: 20px;
      }
      .code {
        font-size: 28px;
        letter-spacing: 8px;
      }
      .code-container {
        padding: 24px 16px;
      }
      .email-footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <h1>Plataforma Educacional</h1>
        <p>Sistema de Gestão Acadêmica</p>
      </div>
      
      <!-- Body -->
      <div class="email-body">
        <h2>Recuperação de Senha</h2>
        
        <p class="emphasis-text">Prezado(a) usuário(a),</p>
        
        <p>Recebemos uma solicitação para redefinir a senha associada a esta conta. Para sua segurança, criamos um código de verificação temporário.</p>
        
        <!-- Code Section -->
        <div class="code-section">
          <div class="code-container">
            <p class="code-label">Código de Verificação</p>
            <div class="code">${code}</div>
            <p class="code-meta">Válido por 10 minutos</p>
          </div>
        </div>
        
        <!-- Important Info -->
        <div class="info-box">
          <p class="info-box-title">Importante</p>
          <p>Este código expira em 10 minutos por motivos de segurança. Insira-o na tela de redefinição de senha para prosseguir.</p>
        </div>
        
        <div class="divider"></div>
        
        <!-- Security Note -->
        <div class="security-note">
          <p class="security-note-title">Medidas de Segurança</p>
          <p>Se você não solicitou esta redefinição, pode ignorar este email com segurança. Sua senha atual permanecerá inalterada. Nunca compartilhe este código com terceiros.</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="email-footer">
        <p class="footer-brand">Plataforma Educacional</p>
        <p class="footer-note">Esta é uma mensagem automática. Por favor, não responda este email.</p>
        <p class="footer-note">Em caso de dúvidas, entre em contato com o suporte técnico.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}
