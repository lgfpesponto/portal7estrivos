

## Plano: Link do Drive → QR Code na Ficha

### O que muda

1. **Formulário de pedido (`OrderPage.tsx`)**: Trocar o upload de foto por um campo de texto onde o vendedor cola o link do Google Drive. O campo `fotos` passa a guardar a URL como texto (ex: `["https://drive.google.com/..."]`).

2. **Instalar biblioteca `qrcode`**: Para gerar QR Code no browser como imagem canvas/data URL.

3. **Ficha de produção (`ReportsPage.tsx`)**: Na área onde hoje renderiza a foto (linha 373-380), gerar um QR Code a partir da URL e inserir no PDF. Abaixo do QR Code, texto "Escaneie para ver a foto".

4. **Detalhe do pedido (`OrderDetailPage.tsx`)**: Onde hoje mostra `<img>`, mostrar o link clicável e opcionalmente um QR Code visual.

5. **Página de edição (`EditOrderPage.tsx`)**: Mesmo ajuste do formulário — campo de texto em vez de upload.

### O que NÃO muda
- Nenhuma tabela ou banco de dados
- Nenhum Storage/bucket
- Estado local continua igual, só o conteúdo de `fotos[]` muda de base64 para URL texto

### Resultado
- Campo `fotos` armazena: `["https://drive.google.com/file/d/xxx/view"]`
- Ficha impressa: QR Code de ~3x3cm no lugar da foto
- Espaço economizado: de ~500KB+ (base64) para ~60 bytes (URL texto) por pedido

