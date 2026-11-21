# Precificador de Obras

Calculadora de precificação para profissional autônomo da construção civil. A partir da renda
que o profissional quer ter no mês, o app calcula a **diária sugerida** e o **valor total do
serviço**, já considerando ajudantes, transporte, custos operacionais e reservas
(emergência, 13º, férias e afastamento).

**Acesse:** https://rogerio1105.github.io/precificador-obras/

## Como funciona

- **Funciona offline e é instalável** (PWA). No Android, abra o link no Chrome e use
  "Instalar app" / "Adicionar à tela inicial".
- **Seus dados ficam só no seu aparelho** (localStorage). Não há servidor, login nem envio de
  informações.
- Campos **amarelos** são para preencher; campos **cinza** são calculados automaticamente.
- Duas formas de ver: **por etapas** (Meta, Serviço, Custos, Resultado) ou **tudo numa página**.
- O gráfico de reservas mostra quanto separar de cada item **para o serviço em questão**.

## Desenvolvimento

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # gera dist/
```

Stack: [Lit](https://lit.dev), [Chart.js](https://www.chartjs.org), [Vite](https://vite.dev),
fonte [Inter](https://rsms.me/inter/) e ícones [Lucide](https://lucide.dev), todos embutidos
no pacote (sem dependência de rede em tempo de execução).

## Publicação

A cada `git push` na branch `main`, o workflow `.github/workflows/deploy.yml` gera o build e
publica no GitHub Pages. Na primeira vez, ative em **Settings → Pages → Source: GitHub Actions**.
