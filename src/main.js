import { buildDocumentPrompt, buildEmailPrompt, formatWordLimit, hasSensitivePatterns, summarizeTextDiff } from './automation.js';
import './styles.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="hero">
    <nav class="nav">
      <a class="brand" href="#top" aria-label="Oestia Lab home">Oestia Lab</a>
      <div class="nav-links">
        <a href="#email">Email drafter</a>
        <a href="#documents">Document tracker</a>
        <a href="https://oestia.xyz">Oestia</a>
      </div>
    </nav>
    <section class="hero-content" id="top">
      <p class="eyebrow">Ferramentas práticas de IA</p>
      <h1>Pequenas automações para trabalho real.</h1>
      <p class="lead">Teste fluxos simples para emails e documentos. A versão leve mostra a ideia; a Oestia adapta o fluxo sério à sua equipa.</p>
      <div class="hero-actions">
        <a class="button primary" href="#email">Experimentar email</a>
        <a class="button secondary" href="#documents">Comparar documentos</a>
      </div>
    </section>
  </header>

  <main>
    <section class="notice">
      <strong>Nota de privacidade:</strong> estas demos geram prompts estruturados para copiar para uma ferramenta de IA. Não introduza passwords, dados de clientes, contratos reais ou informação confidencial sem anonimizar.
    </section>

    <section class="tool" id="email">
      <div class="tool-copy">
        <p class="eyebrow">Demo 01</p>
        <h2>Email Response Drafter</h2>
        <p>Transforme um email difícil em opções de resposta claras, humanas e fáceis de editar.</p>
      </div>
      <form class="panel" id="email-form">
        <label>Email ou conversa
          <textarea name="emailThread" rows="8" required placeholder="Cole aqui o email ou thread..."></textarea>
        </label>
        <div class="grid two">
          <label>Objectivo
            <select name="outcome" required>
              <option>Fazer follow-up de forma educada</option>
              <option>Dizer não sem fechar a relação</option>
              <option>Pedir informação em falta</option>
              <option>Aceitar e confirmar próximos passos</option>
              <option>Pedir desculpa e propor solução</option>
              <option>Clarificar um problema</option>
            </select>
          </label>
          <label>Tom
            <select name="tone" required>
              <option>Profissional e próximo</option>
              <option>Curto e directo</option>
              <option>Cuidadoso e caloroso</option>
              <option>Formal</option>
              <option>Firme mas educado</option>
            </select>
          </label>
        </div>
        <div class="grid two">
          <label>Idioma
            <select name="language">
              <option>Português europeu</option>
              <option>English</option>
            </select>
          </label>
          <label>Tamanho máximo (palavras)
            <input name="maxLength" type="number" min="30" max="1000" step="10" value="150" inputmode="numeric" />
          </label>
        </div>
        <label>Contexto adicional
          <input name="additionalContext" placeholder="Ex.: cliente potencial, proposta enviada, tom da marca..." />
        </label>
        <div class="form-actions">
          <button class="button secondary" type="button" id="email-example">Carregar exemplo</button>
          <button class="button primary" type="submit">Gerar prompt</button>
        </div>
      </form>
      <output class="result" id="email-result"></output>
    </section>

    <section class="tool" id="documents">
      <div class="tool-copy">
        <p class="eyebrow">Demo 02</p>
        <h2>Document Version Tracker</h2>
        <p>Compare duas versões de um documento e gere uma revisão em linguagem simples.</p>
      </div>
      <form class="panel" id="document-form">
        <div class="grid two">
          <label>Versão antiga
            <textarea name="oldText" rows="9" required placeholder="Cole a versão antiga..."></textarea>
          </label>
          <label>Versão nova
            <textarea name="newText" rows="9" required placeholder="Cole a versão nova..."></textarea>
          </label>
        </div>
        <div class="grid two">
          <label>Tipo de documento
            <select name="documentType">
              <option>Proposta</option>
              <option>Contrato ou acordo</option>
              <option>Procedimento interno</option>
              <option>Relatório</option>
              <option>Política</option>
              <option>Email/carta</option>
            </select>
          </label>
          <label>Foco da revisão
            <select name="reviewFocus">
              <option>Revisão geral</option>
              <option>Preço, prazos e responsabilidades</option>
              <option>Mudanças de âmbito</option>
              <option>Risco jurídico/compliance</option>
              <option>Impacto operacional</option>
            </select>
          </label>
        </div>
        <label>Preocupação conhecida
          <input name="knownConcern" placeholder="Ex.: confirmar se o âmbito aumentou..." />
        </label>
        <div class="form-actions">
          <button class="button secondary" type="button" id="document-example">Carregar exemplo</button>
          <button class="button primary" type="submit">Gerar prompt</button>
        </div>
      </form>
      <output class="result" id="document-result"></output>
    </section>

    <section class="cta">
      <p class="eyebrow">Da demo à implementação</p>
      <h2>Quer adaptar um destes fluxos à sua equipa?</h2>
      <p>A Oestia ajuda a transformar tarefas repetitivas em processos mais claros, seguros e fáceis de usar.</p>
      <a class="button primary" href="https://oestia.xyz">Marcar conversa de 15 minutos</a>
    </section>
  </main>
`;

function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function renderResult(container, prompt, warning = '') {
  container.innerHTML = `
    ${warning ? `<p class="warning">${warning}</p>` : ''}
    <div class="result-header">
      <strong>Prompt pronto a copiar</strong>
      <button class="button secondary copy-button" type="button">Copiar</button>
    </div>
    <pre>${escapeHtml(prompt)}</pre>
    <p class="mini-cta">Quer isto integrado nos processos reais da sua equipa? <a href="https://oestia.xyz">Fale com a Oestia</a>.</p>
  `;
  container.querySelector('.copy-button').addEventListener('click', async () => {
    await navigator.clipboard.writeText(prompt);
    container.querySelector('.copy-button').textContent = 'Copiado';
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char]));
}

document.querySelector('#email-example').addEventListener('click', () => {
  const form = document.querySelector('#email-form');
  form.emailThread.value = 'Olá Tiago,\n\nSó para confirmar se teve oportunidade de ver a proposta. Precisamos de decidir até sexta, mas ainda não sabemos se a formação é a melhor opção para a equipa.\n\nObrigada,\nAna';
  form.additionalContext.value = 'Formação prática de IA para uma pequena equipa.';
});

document.querySelector('#document-example').addEventListener('click', () => {
  const form = document.querySelector('#document-form');
  form.oldText.value = 'A formação inclui duas sessões online para até 8 participantes. Os materiais serão enviados depois da última sessão. O pagamento vence a 30 dias.';
  form.newText.value = 'A formação inclui três sessões online para até 12 participantes. Os materiais serão enviados antes da primeira sessão. O pagamento vence a 15 dias. O cliente deve enviar exemplos anonimizados antes do workshop.';
  form.knownConcern.value = 'Confirmar se o preço e a preparação reflectem o aumento de âmbito.';
});

document.querySelector('#email-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const values = getFormValues(event.currentTarget);
  const warning = hasSensitivePatterns(values.emailThread)
    ? 'Atenção: o texto parece conter dados sensíveis. Anonimize antes de usar numa ferramenta externa.'
    : '';
  const prompt = buildEmailPrompt({
    ...values,
    maxLength: formatWordLimit(values.maxLength),
    senderContext: 'Profissional ou equipa a responder em contexto de trabalho',
  });
  renderResult(document.querySelector('#email-result'), prompt, warning);
});

document.querySelector('#document-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const values = getFormValues(event.currentTarget);
  if (values.oldText.trim() === values.newText.trim()) {
    renderResult(document.querySelector('#document-result'), 'As duas versões parecem iguais. Cole textos diferentes para comparar.', 'Sem diferenças detectadas.');
    return;
  }
  const combinedText = `${values.oldText}\n${values.newText}`;
  const warning = hasSensitivePatterns(combinedText)
    ? 'Atenção: o texto parece conter dados sensíveis. Anonimize antes de usar numa ferramenta externa.'
    : '';
  const diff = summarizeTextDiff(values.oldText, values.newText);
  const prompt = buildDocumentPrompt({ ...values, language: 'Português europeu', reviewerRole: 'Pessoa responsável por rever o documento', diff });
  renderResult(document.querySelector('#document-result'), prompt, warning);
});
