# Guia de Solução de Problemas - RoyalBurger Mobile

## Erro: "compiling js failed expected buffer size"

Este erro ocorre quando o Metro bundler excede o limite de memória durante a compilação.

### Soluções Rápidas:

#### 1. Limpar Cache do Metro
```bash
# No diretório RoyalBurgerMobile
npm start -- --reset-cache
# ou
npx expo start --clear --reset-cache
```

#### 2. Limpar Cache do Node
```bash
# Limpar cache do npm
npm cache clean --force

# Limpar node_modules e reinstalar
rm -rf node_modules
npm install
```

#### 3. Aumentar Memória do Node (Windows)
```bash
# No PowerShell, antes de iniciar o projeto:
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

#### 4. Aumentar Memória do Node (Linux/Mac)
```bash
# No terminal, antes de iniciar o projeto:
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

#### 5. Usar Scripts Otimizados
```bash
# Usar o script reset que limpa tudo
npm run reset

# Ou usar start:clean
npm run start:clean
```

### Soluções Permanentes:

#### 1. Arquivo .npmrc (criar na raiz do projeto)
```
node-options=--max-old-space-size=4096
```

#### 2. Dividir Arquivos Grandes
Se o arquivo `produto.js` (1439 linhas) estiver causando problemas, considere:
- Dividir em componentes menores
- Usar lazy loading
- Separar lógica em hooks customizados

### Verificar Problemas:

1. **Arquivos muito grandes**: Verifique se há arquivos com mais de 1000 linhas
2. **Imports circulares**: Verifique dependências circulares entre arquivos
3. **Muitos arquivos**: Verifique se há muitos arquivos sendo importados

### Comandos Úteis:

```bash
# Verificar tamanho dos arquivos
find . -name "*.js" -exec wc -l {} + | sort -rn | head -10

# Limpar tudo e reiniciar
rm -rf node_modules .expo
npm install
npm start -- --reset-cache
```