# AdsCam Pro - Camuflador de Vídeos (Render Edition)

Uma plataforma autônoma para camuflar vídeos e imagens visando evitar bloqueios algorítmicos. Especialmente arquitetada para rodar no **Render.com (Plano Gratuito)**, utilizando processamento assíncrono (Job ID) para evitar timeouts durante o processamento de vídeos mais longos (2 a 4 minutos).

## Funcionalidades
- **Processamento Assíncrono (Job ID)**: A interface consulta ativamente o progresso via polling para evitar timeouts na requisição.
- **Camuflagem de Mídia**: Injeta ruído visual leve (OpenCV/FFmpeg) e altera o pitch do áudio (1.01). Remove todos os metadados e força um re-encoding com `ultrafast` preset para preservar RAM e CPU.
- **Zero Firebase**: Não há necessidade de banco de dados. Os jobs são acompanhados na memória volátil do servidor (`let jobs = {}`).
- **Design Minimalista**: Interface "Geometric Balance" usando HTML/CSS puro + Tailwind via CDN.

## Como hospedar no Render.com

### 1. Preparar o Repositório
Faça o push deste projeto para o seu GitHub, certificando-se de incluir:
- `server.js` (Express backend)
- `public/index.html` (Front-end)
- `package.json`

### 2. Configurar o Web Service no Render
1. Acesse o [Render.com](https://render.com) e conecte sua conta do GitHub.
2. Clique em **"New +"** -> **"Web Service"**.
3. Selecione o repositório deste projeto.
4. Preencha as configurações do ambiente:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Variáveis de Ambiente (Environment Variables):
   - Adicione `NODE_ENV` com o valor `production`
6. Clique em **"Create Web Service"**.

> **Nota sobre o FFmpeg**: O módulo `ffmpeg-static` baixa automaticamente o binário do FFmpeg adequado para o sistema operacional Linux do Render durante a execução, então não é necessário customizar Dockerfiles.

### Limitações do Plano Gratuito (Render)
- O plano gratuito tem RAM limitada (512MB). O processamento usa *streams* e preset `ultrafast` para evitar estourar a memória.
- Se o servidor ficar inativo, ele entrará em modo *sleep*. A primeira requisição após inatividade pode demorar um pouco mais para inicializar.
- Os arquivos processados são salvos em disco e limpos automaticamente logo após o download. Se a instância for reiniciada pelo Render, os dados na memória serão perdidos (comportamento esperado e seguro).
