// ------------------- CONFIGURAÇÃO -------------------
const PIX_KEY = "369c15dc-6018-4442-8c06-c48afc8ebad4"; // troque pela sua chave real
const RECEIVER_NAME = "CALANGO ELETRONICOS";
const CITY = "SERRINHA"; // cidade obrigatória para QR Pix válido

// ------------------- PRODUTOS -------------------
const defaultProducts = [
  { id: 1, name: 'Notebook Gamer A4', desc: 'i5, 8GB, SSD 512GB', price: 2599.00, img: 'img/note_g.jpeg' },
  { id: 2, name: 'Notebook Slim B', desc: 'i3, 8GB, SSD 256GB', price: 1799.00, img: 'img/note_s.jpeg' },
  { id: 3, name: 'PC Gamer - Ryzen 5', desc: 'Ryzen5, 16GB, RTX 1650', price: 3499.00, img: 'img/pc_g.jpg' },
  { id: 4, name: 'Monitor 24" FullHD', desc: 'IPS, 75Hz', price: 599.00, img: 'img/moni_g.jpeg' }
];
let products = [...defaultProducts];
let cart = JSON.parse(localStorage.getItem('cart') || '{}');

const el = id => document.getElementById(id);
const formatMoney = v => 'R$ ' + v.toFixed(2).replace('.', ',');

// ------------------- RENDERIZAÇÃO -------------------
function renderProducts() {
  const list = el('product-list');
  list.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="img"><img src="${p.img}" alt="${p.name}" style="max-height:100%;max-width:100%;border-radius:6px"></div>
      <div class="title">${p.name}</div>
      <div class="small">${p.desc}</div>
      <div class="price">${formatMoney(p.price)}</div>
      <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
        <button class="btn add-btn">Adicionar</button>
      </div>`;
    card.querySelector('.add-btn').onclick = () => addToCart(p.id);
    list.appendChild(card);
  });
}

// ------------------- CARRINHO -------------------
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
}
function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
}
function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}
function renderCart() {
  const cl = el('cart-list');
  cl.innerHTML = '';
  let total = 0, count = 0;
  Object.keys(cart).forEach(id => {
    const p = defaultProducts.find(x => x.id == id);
    if (!p) return;
    const qty = cart[id];
    total += p.price * qty;
    count += qty;
    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div style="flex:1">
        <b>${p.name}</b>
        <div class='small'>${p.desc}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="small">${qty}x ${formatMoney(p.price)}</div>
        <div style="display:flex;gap:6px;margin-left:8px">
          <button class="btn secondary" data-action="minus">−</button>
          <button class="btn secondary" data-action="plus">+</button>
          <button class="btn secondary" data-action="remove">Remover</button>
        </div>
      </div>`;
    item.querySelector('[data-action="minus"]').onclick = () => changeQty(p.id, -1);
    item.querySelector('[data-action="plus"]').onclick = () => changeQty(p.id, +1);
    item.querySelector('[data-action="remove"]').onclick = () => removeFromCart(p.id);
    cl.appendChild(item);
  });
  el('cart-total').textContent = formatMoney(total || 0);
  el('cart-count').textContent = count || 0;
}

// ------------------- PIX VÁLIDO -------------------
function generatePixPayload(amount) {
  const format = (id, v) => id.padStart(2, '0') + String(v.length).padStart(2, '0') + v;

  let payload = '';
  payload += format('00', '01');
  payload += format('26', format('00', 'BR.GOV.BCB.PIX') + format('01', PIX_KEY));
  payload += format('52', '0000');
  payload += format('53', '986');
  payload += format('54', amount.toFixed(2));
  payload += format('58', 'BR');
  payload += format('59', RECEIVER_NAME);
  payload += format('60', CITY);

  const txid = 'KATENDE' + Math.floor(Math.Random() + 10000);
  const field62 = format('05', txid);
  payload += format('62', field62)

  payload += '6304'

  function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++)
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
      crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  return payload + crc16(payload);
}

// ------------------- CHECKOUT -------------------
el('checkout').onclick = () => {
  const total = parseFloat(el('cart-total').textContent.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
  if (total <= 0) return alert("Carrinho vazio");

  const payload = generatePixPayload(total);
  el('modal').classList.add('open');
  el('qr-text').value = payload;

  // limpar e gerar QR Code com biblioteca qrcodejs
  const qrContainer = el('qrcode');
  qrContainer.innerHTML = '';
  const qr = new QRCode(qrContainer, {
    text: payload,
    width: 220,
    height: 220,
    correctLevel: QRCode.CorrectLevel.M
  });
};

el('close-modal').onclick = () => el('modal').classList.remove('open');
el('copy-payload').onclick = () => {
  navigator.clipboard.writeText(el('qr-text').value)
    .then(() => alert("Código Pix copiado!"))
    .catch(() => alert("Não foi possível copiar"));
};

// ------------------- BUSCA -------------------
el('search').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  products = q
    ? defaultProducts.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
    : [...defaultProducts];
  renderProducts();
});

// ------------------- RESPONSIVIDADE -------------------
const cartPanel = el('cart-panel');
const openCart = el('open-cart');
const closeCart = el('close-cart');

function openCartPanel() {
  if (window.innerWidth <= 880) {
    cartPanel.classList.add('open');
    closeCart.style.display = "block";
    document.body.style.overflow = 'hidden';
  } else {
    cartPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
function closeCartPanel() {
  cartPanel.classList.remove('open');
  closeCart.style.display = "none";
  document.body.style.overflow = '';
}
openCart.onclick = openCartPanel;
closeCart.onclick = closeCartPanel;
window.addEventListener('resize', () => { if (window.innerWidth > 880) closeCartPanel(); });

// ------------------- INICIALIZAÇÃO -------------------
renderProducts();
renderCart();
