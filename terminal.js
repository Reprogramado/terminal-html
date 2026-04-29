/* =========================================================
   NEXUS TERMINAL — engine + commands
   ========================================================= */

/* ---------------- FILESYSTEM ---------------- */
const fs = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        cliente: {
          type: 'dir',
          children: {
            'README.md': {
              type: 'file',
              content: `# Bem-vindo ao terminal NEXUS

Terminal Linux simulado, agora em modo holográfico.
Explore os diretórios, leia arquivos, brinque com os comandos.

Dicas:
  - Digite \`help\` para ver tudo que funciona.
  - Use TAB para autocompletar caminhos.
  - Setas ↑/↓ navegam pelo histórico.
  - \`clear\` limpa a tela.
  - Experimente: matrix, scan, viz, particles, theme, glitch.

Boa exploração.`,
            },
            documentos: {
              type: 'dir',
              children: {
                'receita-bolo.txt': {
                  type: 'file',
                  content: `RECEITA DE BOLO DE FUBÁ
========================

Ingredientes:
  - 3 ovos
  - 1 xícara de fubá
  - 1 xícara de farinha
  - 2 xícaras de açúcar
  - 1 xícara de leite
  - 1 colher (sopa) de fermento
  - 100g de manteiga

Modo de preparo:
  Bata tudo, asse a 180°C por 40 min.
  Saboreie com café preto.`,
                },
                'lista-compras.md': {
                  type: 'file',
                  content: `# Mercado

- [x] café
- [x] pão
- [ ] queijo
- [ ] tomate
- [ ] cebola
- [ ] azeite bom`,
                },
                'segredo.txt': {
                  type: 'file',
                  content: `Eu nunca devolvi aquele livro pra biblioteca em 2003.
Desculpa, Dona Marta.`,
                },
              },
            },
            projetos: {
              type: 'dir',
              children: {
                'oi-mundo.py': {
                  type: 'file',
                  content: `# Primeiro programa em Python
import sys

def saudacao(nome="mundo"):
    return f"Olá, {nome}!"

if __name__ == "__main__":
    nome = sys.argv[1] if len(sys.argv) > 1 else "mundo"
    print(saudacao(nome))`,
                },
                'TODO.md': {
                  type: 'file',
                  content: `# Coisas pra fazer

## Urgente
- terminar o terminal no navegador (✓ feito!)
- responder e-mail do João

## Algum dia
- aprender Rust
- plantar manjericão
- visitar Ouro Preto`,
                },
                site: {
                  type: 'dir',
                  children: {
                    'index.html': {
                      type: 'file',
                      content: `<!DOCTYPE html>
<html>
<head><title>meu site</title></head>
<body>
  <h1>Olá!</h1>
  <p>Em construção desde 2019.</p>
</body>
</html>`,
                    },
                    'estilo.css': {
                      type: 'file',
                      content: `body {
  font-family: serif;
  max-width: 600px;
  margin: 4rem auto;
  color: #222;
}`,
                    },
                  },
                },
              },
            },
            '.bashrc': {
              type: 'file',
              content: `# ~/.bashrc
export PS1='\\u@\\h:\\w\\$ '
alias ll='ls -la'
alias ..='cd ..'
alias gs='git status'

# que dia bonito pra programar`,
            },
          },
        },
        visitante: {
          type: 'dir',
          children: {
            'olá.txt': {
              type: 'file',
              content: `Oi! Você não devia estar aqui, mas tudo bem.
Aproveite a visita.`,
            },
          },
        },
      },
    },
    etc: {
      type: 'dir',
      children: {
        'hostname': { type: 'file', content: 'nexus\n' },
        'os-release': {
          type: 'file',
          content: `NAME="NexusOS"
VERSION="9.4 (Holo)"
ID=nexusos
PRETTY_NAME="NexusOS 9.4 Holo"
HOME_URL="https://lumien.com"`,
        },
        'motd': {
          type: 'file',
          content: `Lembre-se: cada bug é só um recurso mal documentado.`,
        },
      },
    },
    var: {
      type: 'dir',
      children: {
        log: {
          type: 'dir',
          children: {
            'sistema.log': {
              type: 'file',
              content: `[INFO] sistema iniciado
[INFO] usuário 'cliente' logou no tty1
[WARN] disco quase cheio (92%)
[INFO] backup diário concluído
[INFO] tudo nos conformes`,
            },
          },
        },
      },
    },
    bin: {
      type: 'dir',
      children: {
        ls: { type: 'file', content: '(binário)' },
        cat: { type: 'file', content: '(binário)' },
        echo: { type: 'file', content: '(binário)' },
        pwd: { type: 'file', content: '(binário)' },
        cd: { type: 'file', content: '(binário)' },
        mkdir: { type: 'file', content: '(binário)' },
        touch: { type: 'file', content: '(binário)' },
        rm: { type: 'file', content: '(binário)' },
        matrix: { type: 'file', content: '(binário)' },
        scan: { type: 'file', content: '(binário)' },
        viz: { type: 'file', content: '(binário)' },
        particles: { type: 'file', content: '(binário)' },
        theme: { type: 'file', content: '(binário)' },
        glitch: { type: 'file', content: '(binário)' },
      },
    },
    tmp: { type: 'dir', children: {} },
  },
};

/* ---------------- STATE ---------------- */
const state = {
  cwd: ['home', 'cliente'],
  user: 'cliente',
  host: 'nexus',
  history: [],
  histIdx: -1,
  theme: 'nexus',
  ambientGlitch: false,
};

const term = document.getElementById('terminal');
const startTime = Date.now();

/* ---------------- PATH HELPERS ---------------- */
function resolvePath(input) {
  if (!input || input === '~') return ['home', 'cliente'];
  let parts;
  if (input.startsWith('/')) parts = input.split('/').filter(Boolean);
  else if (input.startsWith('~/')) parts = ['home', 'cliente', ...input.slice(2).split('/').filter(Boolean)];
  else parts = [...state.cwd, ...input.split('/').filter(Boolean)];
  const out = [];
  for (const p of parts) {
    if (p === '.' || p === '') continue;
    if (p === '..') out.pop();
    else out.push(p);
  }
  return out;
}
function getNode(path) {
  let n = fs;
  for (const seg of path) {
    if (n.type !== 'dir' || !n.children[seg]) return null;
    n = n.children[seg];
  }
  return n;
}
function pathStr(path) {
  if (path.length === 2 && path[0] === 'home' && path[1] === state.user) return '~';
  if (path.length > 2 && path[0] === 'home' && path[1] === state.user) return '~/' + path.slice(2).join('/');
  return '/' + path.join('/');
}

/* ---------------- OUTPUT ---------------- */
function escapeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function print(html, cls = '') {
  const el = document.createElement('div');
  el.className = 'line fresh ' + cls;
  el.innerHTML = html;
  term.appendChild(el);
  scroll();
  return el;
}
function printPlain(text, cls = '') { return print(escapeHTML(text), cls); }
function scroll() { term.scrollTop = term.scrollHeight; }

/* ---------------- TYPING (animated print) ---------------- */
function typePrint(text, opts = {}) {
  return new Promise((resolve) => {
    const speed = opts.speed ?? 14;
    const cls = opts.cls ?? '';
    const el = document.createElement('div');
    el.className = 'line fresh ' + cls;
    term.appendChild(el);
    let i = 0;
    function step() {
      if (i >= text.length) { resolve(el); return; }
      el.textContent += text.charAt(i);
      i++;
      scroll();
      setTimeout(step, speed + Math.random() * 8);
    }
    step();
  });
}

/* ---------------- COMMANDS ---------------- */
const commands = {
  help() {
    const rows = [
      ['ls [-l] [path]', 'lista o conteúdo de um diretório'],
      ['cd <path>', 'muda de diretório'],
      ['pwd', 'mostra o caminho atual'],
      ['cat <arquivo>', 'mostra o conteúdo de um arquivo'],
      ['echo <texto>', 'imprime o texto na tela'],
      ['mkdir <nome>', 'cria um diretório'],
      ['touch <nome>', 'cria um arquivo vazio'],
      ['rm [-r] <alvo>', 'remove arquivo ou diretório'],
      ['tree [path]', 'mostra a árvore de diretórios'],
      ['whoami / hostname / date / uname', 'metadados do sistema'],
      ['history', 'lista os comandos digitados'],
      ['clear', 'limpa a tela'],
      ['neofetch', 'cartão do sistema com estilo'],
      ['cowsay / dragonsay <msg>', 'um bicho diz algo'],
      ['fortune', 'uma frase aleatória'],
      ['', ''],
      ['── HOLO ──', ''],
      ['matrix', 'chuva de caracteres em tela cheia'],
      ['scan', 'mapa animado de varredura de rede'],
      ['viz', 'telemetria + sparkline ao vivo'],
      ['particles [n]', 'explosão de partículas neon'],
      ['glitch', 'distorce a tela por alguns segundos'],
      ['theme [nome]', 'troca paleta — nexus, outrun, matrix, void, solar'],
      ['shake', 'sacode o painel'],
    ];
    print('<span class="bright">Comandos disponíveis:</span>');
    for (const [c, d] of rows) {
      if (!c) { print(''); continue; }
      if (c.startsWith('──')) { print(`<span class="violet">${escapeHTML(c)}</span>`); continue; }
      print(`  <span class="exec">${escapeHTML(c.padEnd(28))}</span> <span class="dim">${escapeHTML(d)}</span>`);
    }
    print('<span class="dim">Dica: TAB autocompleta · ↑↓ histórico · Ctrl+L limpa</span>');
  },

  ls(args) {
    const flags = args.filter(a => a.startsWith('-')).join('');
    const targets = args.filter(a => !a.startsWith('-'));
    const long = flags.includes('l');
    const showHidden = flags.includes('a');
    const target = targets[0] || '.';
    const path = resolvePath(target);
    const node = getNode(path);
    if (!node) return print(`<span class="err">ls: '${escapeHTML(target)}': não encontrado</span>`);
    if (node.type === 'file') return print(`<span class="file">${escapeHTML(target)}</span>`);
    let entries = Object.keys(node.children);
    if (!showHidden) entries = entries.filter(n => !n.startsWith('.'));
    entries.sort();
    if (entries.length === 0) return;
    if (long) {
      for (const name of entries) {
        const child = node.children[name];
        const isDir = child.type === 'dir';
        const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = isDir ? '4096' : String((child.content || '').length).padStart(5);
        const cls = isDir ? 'dir' : (path[0] === 'bin' ? 'exec' : 'file');
        const display = isDir ? name + '/' : name;
        print(`<span class="dim">${perms}</span>  <span class="dim">cliente</span>  <span class="dim">${size.padStart(6)}</span>  <span class="${cls}">${escapeHTML(display)}</span>`);
      }
    } else {
      const items = entries.map(name => {
        const child = node.children[name];
        const isDir = child.type === 'dir';
        const cls = isDir ? 'dir' : (path[0] === 'bin' ? 'exec' : 'file');
        const display = isDir ? name + '/' : name;
        return `<span class="${cls}">${escapeHTML(display)}</span>`;
      });
      print('<div class="ls-grid">' + items.join('') + '</div>');
    }
  },

  cd(args) {
    const target = args[0] || '~';
    const path = resolvePath(target);
    const node = getNode(path);
    if (!node) return print(`<span class="err">cd: ${escapeHTML(target)}: não encontrado</span>`);
    if (node.type !== 'dir') return print(`<span class="err">cd: ${escapeHTML(target)}: não é um diretório</span>`);
    state.cwd = path;
  },

  pwd() { print('/' + state.cwd.join('/')); },

  cat(args) {
    if (!args[0]) return print('<span class="err">cat: faltou o nome do arquivo</span>');
    for (const target of args) {
      const path = resolvePath(target);
      const node = getNode(path);
      if (!node) { print(`<span class="err">cat: ${escapeHTML(target)}: não encontrado</span>`); continue; }
      if (node.type !== 'file') { print(`<span class="err">cat: ${escapeHTML(target)}: é um diretório</span>`); continue; }
      printPlain(node.content);
    }
  },

  echo(args) { print(escapeHTML(args.join(' '))); },

  mkdir(args) {
    if (!args[0]) return print('<span class="err">mkdir: faltou o nome</span>');
    for (const target of args) {
      const path = resolvePath(target);
      if (path.length === 0) continue;
      const name = path.pop();
      const parent = getNode(path);
      if (!parent || parent.type !== 'dir') { print('<span class="err">mkdir: caminho não encontrado</span>'); continue; }
      if (parent.children[name]) { print(`<span class="err">mkdir: '${target}' já existe</span>`); continue; }
      parent.children[name] = { type: 'dir', children: {} };
    }
  },

  touch(args) {
    if (!args[0]) return print('<span class="err">touch: faltou o nome</span>');
    for (const target of args) {
      const path = resolvePath(target);
      if (path.length === 0) continue;
      const name = path.pop();
      const parent = getNode(path);
      if (!parent || parent.type !== 'dir') { print('<span class="err">touch: caminho não encontrado</span>'); continue; }
      if (!parent.children[name]) parent.children[name] = { type: 'file', content: '' };
    }
  },

  rm(args) {
    const flags = args.filter(a => a.startsWith('-')).join('');
    const targets = args.filter(a => !a.startsWith('-'));
    const recursive = flags.includes('r') || flags.includes('R');
    if (!targets[0]) return print('<span class="err">rm: faltou o alvo</span>');
    for (const target of targets) {
      const path = resolvePath(target);
      if (path.length === 0) { print(`<span class="err">rm: não posso remover '/'</span>`); continue; }
      const name = path[path.length - 1];
      const parent = getNode(path.slice(0, -1));
      if (!parent || !parent.children[name]) { print(`<span class="err">rm: ${escapeHTML(target)}: não encontrado</span>`); continue; }
      const node = parent.children[name];
      if (node.type === 'dir' && !recursive) { print(`<span class="err">rm: ${escapeHTML(target)}: é um diretório (use -r)</span>`); continue; }
      delete parent.children[name];
    }
  },

  tree(args) {
    const target = args[0] || '.';
    const path = resolvePath(target);
    const node = getNode(path);
    if (!node) return print(`<span class="err">tree: ${escapeHTML(target)}: não encontrado</span>`);
    const lines = [];
    const rootName = path.length === 0 ? '/' : path[path.length - 1];
    lines.push(`<span class="dir">${escapeHTML(rootName)}</span>`);
    function walk(n, prefix) {
      if (n.type !== 'dir') return;
      const entries = Object.keys(n.children).filter(k => !k.startsWith('.')).sort();
      entries.forEach((name, i) => {
        const last = i === entries.length - 1;
        const child = n.children[name];
        const branch = last ? '└── ' : '├── ';
        const cls = child.type === 'dir' ? 'dir' : 'file';
        const disp = child.type === 'dir' ? name + '/' : name;
        lines.push(`<span class="dim">${prefix}${branch}</span><span class="${cls}">${escapeHTML(disp)}</span>`);
        if (child.type === 'dir') walk(child, prefix + (last ? '    ' : '│   '));
      });
    }
    walk(node, '');
    print('<div class="tree">' + lines.join('\n') + '</div>');
  },

  whoami() { print(state.user); },
  hostname() { print(state.host); },

  date() {
    const d = new Date();
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const pad = n => String(n).padStart(2, '0');
    print(`${days[d.getDay()]} ${months[d.getMonth()]} ${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getFullYear()}`);
  },

  uname(args) {
    if (args.includes('-a')) print('NexusOS nexus 9.4.0-holo #1 SMP x86_64 GNU/Linux');
    else print('NexusOS');
  },

  history() {
    state.history.forEach((cmd, i) => {
      print(`<span class="dim">${String(i + 1).padStart(4)}</span>  ${escapeHTML(cmd)}`);
    });
  },

  clear() { term.innerHTML = ''; },

  neofetch() {
    const up = uptime();
    const ascii = [
      '<span class="violet">    ╭──────────╮</span>',
      '<span class="violet">   ╱</span><span class="ok">▓▓▓▓▓▓▓▓▓▓</span><span class="violet">╲</span>',
      '<span class="violet">  ╱</span><span class="ok">▓▓</span><span class="exec">◆</span><span class="ok">▓▓▓▓▓</span><span class="exec">◆</span><span class="ok">▓▓</span><span class="violet">╲</span>',
      '<span class="violet"> │</span> <span class="ok">▓▓▓▓▓▓▓▓▓▓▓▓</span> <span class="violet">│</span>',
      '<span class="violet"> │</span> <span class="ok">▓▓▓</span> <span class="bright">NEXUS</span> <span class="ok">▓▓▓</span> <span class="violet">│</span>',
      '<span class="violet"> │</span> <span class="ok">▓▓▓▓▓▓▓▓▓▓▓▓</span> <span class="violet">│</span>',
      '<span class="violet">  ╲</span><span class="ok">▓▓▓▓▓▓▓▓▓▓▓▓</span><span class="violet">╱</span>',
      '<span class="violet">   ╲</span><span class="ok">▓▓▓▓▓▓▓▓▓▓</span><span class="violet">╱</span>',
      '<span class="violet">    ╰──────────╯</span>',
    ];
    const info = [
      `<span class="exec">user</span><span class="dim">@</span><span class="ok">host</span>  <span class="bright">${state.user}</span><span class="dim">@</span><span class="bright">${state.host}</span>`,
      `<span class="dim">─────────────────────────</span>`,
      `<span class="exec">os</span>      NexusOS 9.4 Holo`,
      `<span class="exec">kernel</span>  9.4.0-holo`,
      `<span class="exec">uptime</span>  ${up}`,
      `<span class="exec">shell</span>   nx-sh 3.1`,
      `<span class="exec">term</span>    holo-tty1`,
      `<span class="exec">cpu</span>     Quantum-Z @ 4.8 THz`,
      `<span class="exec">gpu</span>     Photon-X · neural`,
      `<span class="exec">mem</span>     2.4 / 32 PB`,
      `<span class="exec">theme</span>   ${state.theme}`,
      ``,
      `<span class="exec">●</span> <span class="violet">●</span> <span class="ok">●</span> <span class="accent">●</span> <span class="warn">●</span> <span class="dim">●</span>`,
    ];
    const rows = Math.max(ascii.length, info.length);
    const out = [];
    for (let i = 0; i < rows; i++) {
      const a = ascii[i] || '';
      const b = info[i] || '';
      out.push(`<div style="display:grid;grid-template-columns:200px 1fr;gap:18px">${a}<div>${b}</div></div>`);
    }
    print(out.join(''));
  },

  cowsay(args) {
    const msg = args.join(' ') || 'mooo';
    const len = msg.length;
    const top = ' ' + '_'.repeat(len + 2);
    const bot = ' ' + '-'.repeat(len + 2);
    const cow = `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
    print(`<pre style="margin:0">${escapeHTML(top)}\n&lt; ${escapeHTML(msg)} &gt;\n${escapeHTML(bot)}${escapeHTML(cow)}</pre>`);
  },

  dragonsay(args) {
    const msg = args.join(' ') || 'rrrawr';
    const len = msg.length;
    const top = ' ' + '_'.repeat(len + 2);
    const bot = ' ' + '-'.repeat(len + 2);
    const dragon = `
       \\                     / \\  //\\
        \\    |\\___/|        /   \\//  \\\\
             /0  0  \\__    /    //  | \\ \\
            /     /  \\/_/  //   |  \\  \\
            @_^_@'/   \\/_   //    |   \\   \\`;
    print(`<pre style="margin:0">${escapeHTML(top)}\n&lt; ${escapeHTML(msg)} &gt;\n${escapeHTML(bot)}${escapeHTML(dragon)}</pre>`);
  },

  fortune() {
    const fortunes = [
      'Quem pluraliza alfaces, conjuga calhambeques.',
      'A pressa é inimiga da perfeição, mas amiga do prazo.',
      'Todo bug é só um recurso ainda não documentado.',
      'O melhor programador é aquele que sabe ler.',
      'Antes de otimizar, meça. Antes de medir, pense.',
      'Há dois tipos de gente: os que fazem backup e os que vão fazer.',
      'O código que você escreve hoje vai te assombrar daqui a um mês.',
      'Em caso de dúvida, leia a documentação.',
      'A simplicidade é o último grau da sofisticação. — Da Vinci',
      'Programar é como escrever cartas pra você do futuro. Seja gentil.',
    ];
    print('<span class="accent">"' + escapeHTML(fortunes[Math.floor(Math.random() * fortunes.length)]) + '"</span>');
  },

  exit() { print('<span class="dim">não dá pra sair de verdade. mas valeu a tentativa.</span>'); },

  sudo() { print('<span class="err">cliente não está no arquivo sudoers. Este incidente será reportado.</span>'); },

  /* ============== HOLO COMMANDS ============== */

  matrix() {
    print('<span class="violet">▚ entrando na matrix… <span class="dim">(clique pra sair)</span></span>');
    setTimeout(() => window.startMatrix(), 350);
  },

  glitch() {
    print('<span class="violet">▚ glitch <span class="dim">// reality.exe error</span></span>');
    window.triggerGlitch(900);
    window.screenShake();
  },

  shake() {
    print('<span class="violet">▚ shake</span>');
    window.screenShake();
  },

  particles(args) {
    const n = Math.max(20, Math.min(400, parseInt(args[0]) || 140));
    print(`<span class="violet">▚ liberando ${n} partículas…</span>`);
    const rect = document.querySelector('.holo').getBoundingClientRect();
    window.spawnBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: n });
    window.screenShake();
  },

  scan() {
    print('<span class="violet">▚ iniciando varredura nexus-net…</span>');
    const wrap = document.createElement('div');
    wrap.className = 'line fresh';
    term.appendChild(wrap);
    window.renderScan(wrap);
    scroll();
  },

  viz() {
    print('<span class="violet">▚ telemetria · sistema</span>');
    const wrap = document.createElement('div');
    wrap.className = 'line fresh';
    term.appendChild(wrap);
    window.renderViz(wrap);
    scroll();
  },

  theme(args) {
    const valid = ['nexus', 'outrun', 'matrix', 'void', 'solar'];
    if (!args[0]) {
      print(`<span class="dim">tema atual:</span> <span class="exec">${state.theme}</span>`);
      print(`<span class="dim">disponíveis:</span> ${valid.map(t => `<span class="${t === state.theme ? 'ok' : 'violet'}">${t}</span>`).join('  ')}`);
      return;
    }
    const t = args[0].toLowerCase();
    if (!valid.includes(t)) return print(`<span class="err">theme: '${escapeHTML(t)}' inválido. tente: ${valid.join(', ')}</span>`);
    setTheme(t);
    print(`<span class="ok">▚ tema alterado:</span> <span class="exec">${t}</span>`);
  },
};

function setTheme(t) {
  state.theme = t;
  if (t === 'nexus') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  // invalida o cache de cores dos canvases (pra evitar getComputedStyle por frame)
  if (window.refreshThemeColors) window.refreshThemeColors();
  // refresh swatch active state in tweaks
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === t);
  });
}
window.setTheme = setTheme;

/* ---------------- UPTIME ---------------- */
function uptime() {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}min`;
  if (m > 0) return `${m}min ${s % 60}s`;
  return `${s}s`;
}

/* ---------------- PROMPT ---------------- */
function ps1HTML() {
  return (
    `<span class="ps1-bracket">[</span>` +
    `<span class="ps1-user">${state.user}</span>` +
    `<span class="ps1-at">@</span>` +
    `<span class="ps1-host">${state.host}</span>` +
    `<span class="ps1-bracket">]</span>` +
    `<span class="ps1-colon">:</span>` +
    `<span class="ps1-path">${pathStr(state.cwd)}</span>` +
    `<span class="ps1-arrow">❯</span>`
  );
}

function renderPromptHTML(input = '', caretPos = 0) {
  const before = escapeHTML(input.slice(0, caretPos));
  const after = escapeHTML(input.slice(caretPos));
  return `<div class="prompt">${ps1HTML()}<span class="caret-wrap">${before}<span class="caret"></span>${after}</span></div>`;
}

let currentLine = null;
let buffer = '';
let caretPos = 0;
let inputLocked = false;

function newPrompt() {
  currentLine = document.createElement('div');
  currentLine.className = 'line';
  buffer = '';
  caretPos = 0;
  currentLine.innerHTML = renderPromptHTML('', 0);
  term.appendChild(currentLine);
  scroll();
}
function refreshPrompt() {
  if (currentLine) currentLine.innerHTML = renderPromptHTML(buffer, caretPos);
}
function commitPromptLine() {
  currentLine.innerHTML = `<div class="prompt">${ps1HTML()}<span class="bright">${escapeHTML(buffer)}</span></div>`;
}

/* ---------------- EXECUTE ---------------- */
function execute(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  state.history.push(trimmed);
  state.histIdx = state.history.length;
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);
  if (commands[cmd]) {
    try { commands[cmd](args); }
    catch (e) { print(`<span class="err">erro: ${escapeHTML(e.message)}</span>`); }
  } else {
    print(`<span class="err">${escapeHTML(cmd)}: comando não encontrado. tente <span class="exec">help</span>.</span>`);
  }
}

/* ---------------- AUTOCOMPLETE ---------------- */
function autocomplete() {
  const before = buffer.slice(0, caretPos);
  const tokens = before.split(/\s+/);
  const last = tokens[tokens.length - 1] || '';
  const isFirstToken = tokens.length === 1;
  let candidates = [];
  if (isFirstToken) candidates = Object.keys(commands).filter(c => c.startsWith(last));
  else {
    const slashIdx = last.lastIndexOf('/');
    const dirPart = slashIdx >= 0 ? last.slice(0, slashIdx + 1) : '';
    const namePart = slashIdx >= 0 ? last.slice(slashIdx + 1) : last;
    const dirPath = dirPart ? resolvePath(dirPart || '.') : state.cwd;
    const node = getNode(dirPath);
    if (node && node.type === 'dir') {
      candidates = Object.keys(node.children)
        .filter(n => n.startsWith(namePart))
        .map(n => {
          const child = node.children[n];
          return dirPart + n + (child.type === 'dir' ? '/' : '');
        });
    }
  }
  if (candidates.length === 0) return;
  if (candidates.length === 1) {
    const completion = candidates[0];
    const replaceFrom = isFirstToken ? 0 : before.length - last.length;
    buffer = buffer.slice(0, replaceFrom) + completion + buffer.slice(caretPos);
    caretPos = replaceFrom + completion.length;
    refreshPrompt();
  } else {
    let prefix = candidates[0];
    for (const c of candidates) while (!c.startsWith(prefix)) prefix = prefix.slice(0, -1);
    const replaceFrom = isFirstToken ? 0 : before.length - last.length;
    const currentTail = buffer.slice(replaceFrom, caretPos);
    if (prefix.length > currentTail.length) {
      buffer = buffer.slice(0, replaceFrom) + prefix + buffer.slice(caretPos);
      caretPos = replaceFrom + prefix.length;
      refreshPrompt();
    } else {
      commitPromptLine();
      print('<div class="ls-grid">' + candidates.map(c => `<span class="${c.endsWith('/') ? 'dir' : 'exec'}">${escapeHTML(c)}</span>`).join('') + '</div>');
      newPrompt();
      buffer = before + buffer.slice(caretPos);
      caretPos = before.length;
      refreshPrompt();
    }
  }
}

/* ---------------- KEY HANDLING ---------------- */
document.addEventListener('keydown', (e) => {
  // bypass when matrix overlay or tweaks input is focused on a slider
  if (document.getElementById('matrix-overlay').classList.contains('on')) {
    if (e.key === 'Escape') { e.preventDefault(); window.stopMatrix(); }
    return;
  }
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (inputLocked) return;
  if (e.ctrlKey && !['c', 'l', 'u', 'a', 'e'].includes(e.key.toLowerCase())) return;
  if (e.metaKey) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    commitPromptLine();
    execute(buffer);
    newPrompt();
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    if (caretPos > 0) { buffer = buffer.slice(0, caretPos - 1) + buffer.slice(caretPos); caretPos--; refreshPrompt(); }
  } else if (e.key === 'Delete') {
    e.preventDefault();
    if (caretPos < buffer.length) { buffer = buffer.slice(0, caretPos) + buffer.slice(caretPos + 1); refreshPrompt(); }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (caretPos > 0) { caretPos--; refreshPrompt(); }
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (caretPos < buffer.length) { caretPos++; refreshPrompt(); }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (state.history.length > 0 && state.histIdx > 0) {
      state.histIdx--;
      buffer = state.history[state.histIdx];
      caretPos = buffer.length;
      refreshPrompt();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (state.histIdx < state.history.length - 1) { state.histIdx++; buffer = state.history[state.histIdx]; }
    else { state.histIdx = state.history.length; buffer = ''; }
    caretPos = buffer.length;
    refreshPrompt();
  } else if (e.key === 'Home' || (e.ctrlKey && e.key.toLowerCase() === 'a')) {
    e.preventDefault(); caretPos = 0; refreshPrompt();
  } else if (e.key === 'End' || (e.ctrlKey && e.key.toLowerCase() === 'e')) {
    e.preventDefault(); caretPos = buffer.length; refreshPrompt();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    autocomplete();
  } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
    e.preventDefault(); commitPromptLine(); print('<span class="dim">^C</span>'); newPrompt();
  } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault(); commands.clear(); newPrompt();
  } else if (e.ctrlKey && e.key.toLowerCase() === 'u') {
    e.preventDefault(); buffer = buffer.slice(caretPos); caretPos = 0; refreshPrompt();
  } else if (e.key.length === 1) {
    e.preventDefault();
    buffer = buffer.slice(0, caretPos) + e.key + buffer.slice(caretPos);
    caretPos++;
    refreshPrompt();
  }
});

/* ---------------- CLOCK ---------------- */
function tickClock() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const el = document.getElementById('clock');
  if (el) el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
setInterval(tickClock, 1000);
tickClock();

/* ---------------- TWEAKS PANEL ---------------- */
function buildTweaks() {
  const themes = [
    { id: 'nexus', name: 'NEXUS', colors: ['#ff2bd6', '#00f0ff', '#b07bff'] },
    { id: 'outrun', name: 'OUTRUN', colors: ['#ff3d8a', '#ffb347', '#ff5cf0'] },
    { id: 'matrix', name: 'MATRIX', colors: ['#4dffb0', '#88ffd0', '#00ff88'] },
    { id: 'void', name: 'VOID', colors: ['#ff5470', '#4ab8ff', '#6e8cff'] },
    { id: 'solar', name: 'SOLAR', colors: ['#ff8c3a', '#ffd24a', '#ff5e2a'] },
  ];
  const grid = document.getElementById('theme-grid');
  themes.forEach(t => {
    const b = document.createElement('button');
    b.className = 'theme-btn' + (t.id === state.theme ? ' active' : '');
    b.dataset.theme = t.id;
    b.innerHTML = `<div class="swatch-stack">${t.colors.map(c => `<i style="background:${c}"></i>`).join('')}</div><div class="name">${t.name}</div>`;
    b.addEventListener('click', () => setTheme(t.id));
    grid.appendChild(b);
  });

  const glitchSwitch = document.getElementById('sw-glitch');
  glitchSwitch.addEventListener('click', () => {
    state.ambientGlitch = !state.ambientGlitch;
    glitchSwitch.classList.toggle('on', state.ambientGlitch);
    window.setAmbientGlitch(state.ambientGlitch);
  });

  document.getElementById('tw-glitch-now').addEventListener('click', () => { window.triggerGlitch(700); window.screenShake(); });
  document.getElementById('tw-particles').addEventListener('click', () => commands.particles([]));
  document.getElementById('tw-matrix').addEventListener('click', () => commands.matrix());

  const glowSlider = document.getElementById('sl-glow');
  glowSlider.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--glow-strength', e.target.value);
  });

  document.getElementById('tweaks-close').addEventListener('click', () => {
    document.getElementById('tweaks').classList.remove('on');
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  });
}

window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === '__activate_edit_mode') document.getElementById('tweaks').classList.add('on');
  if (e.data.type === '__deactivate_edit_mode') document.getElementById('tweaks').classList.remove('on');
});

/* ---------------- BOOT ---------------- */
async function boot() {
  // animated banner
  print(`<div class="banner">${escapeHTML(window.NEXUS_BANNER)}</div>`);
  print(
    '<div class="banner-sub">' +
      '<span class="pill"><span class="live-dot"></span> ONLINE</span>' +
      '<span><span class="violet">nexus</span> · holographic terminal · v9.4</span>' +
      '<span class="dim">digite <kbd>help</kbd> pra começar · <kbd>theme</kbd> troca paleta</span>' +
    '</div>'
  );
  print('<span class="dim">last login: ' + new Date().toLocaleString('pt-BR') + ' on holo-tty1</span>');

  // boot sequence — typed
  inputLocked = true;
  await new Promise(r => setTimeout(r, 180));
  await typePrint('▚ initializing nexus core…', { speed: 12, cls: 'violet' });
  await new Promise(r => setTimeout(r, 120));
  await typePrint('▚ mounting holographic filesystem… ok', { speed: 9, cls: 'violet' });
  await new Promise(r => setTimeout(r, 120));
  await typePrint('▚ neural link established · welcome back, cliente.', { speed: 11, cls: 'ok' });
  print('');
  inputLocked = false;
  newPrompt();
}

buildTweaks();
boot();
