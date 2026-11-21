'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 });
const percent = (value) => value === null ? 'не рассчитывается' : `${value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const money = (thousands) => {
  if (Math.abs(thousands) >= 1000) return `${decimal.format(thousands / 1000)} млн ₽`;
  if (Math.abs(thousands) >= 1) return `${decimal.format(thousands)} тыс. ₽`;
  return `${decimal.format(thousands * 1000)} ₽`;
};
const ratio = (value, base) => base > 0 ? value / base * 100 : null;
const parseNumber = (value) => {
  const compact = String(value).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(compact) ? Number(compact) : NaN;
};
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

const menuButton = $('#menu-button');
const nav = $('#site-nav');
const navLinks = $$('a', nav);
const chapters = navLinks.map((link) => $(link.hash));
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
navLinks.forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(max-width:850px)').addEventListener('change', closeMenu);
let frameRequested = false;
function updateNavigation() {
  const line = $('#header').getBoundingClientRect().bottom + 65;
  let active = 0;
  chapters.forEach((chapter, index) => {
    if (chapter.getBoundingClientRect().top <= line) active = index;
  });
  navLinks.forEach((link, index) => {
    if (index === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const maximum = document.documentElement.scrollHeight - innerHeight;
  $('#reading-progress').style.transform = `scaleX(${maximum > 0 ? Math.min(scrollY / maximum, 1) : 0})`;
  frameRequested = false;
}
function navFrame() {
  if (!frameRequested) { frameRequested = true; requestAnimationFrame(updateNavigation); }
}
window.addEventListener('scroll', navFrame, { passive:true });
window.addEventListener('resize', navFrame);
document.addEventListener('toggle', navFrame, true);
navFrame();

function bindTabs(list, select) {
  list.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', (event) => {
      const offsets = {ArrowRight:1, ArrowLeft:-1};
      if (!(event.key in offsets) && !['Home','End'].includes(event.key)) return;
      event.preventDefault();
      const move = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (index + offsets[event.key] + list.length) % list.length;
      select(list[move]);
      list[move].focus();
    });
  });
}
function tabSelection(list, selected) {
  list.forEach((item) => {
    item.setAttribute('aria-selected', String(item === selected));
    item.tabIndex = item === selected ? 0 : -1;
  });
}

const examples = {
  25:{title:'Первый дом', description:'Линейная кухня, высокий шкаф у входа и выдвижной стол. В одной комнате нужно оставить свободный проход и место для гостей.', quote:'Цена после обмера', note:'Не переносим смету 35 м² на меньший метраж.', alt:'Визуализация компактной кухни и обеденного уголка'},
  30:{title:'Городская студия', description:'Зону сна прикрывает деревянный экран, рабочее место у окна, а шкафы размещены ближе ко входу.', quote:'Цена после обмера', note:'Лёгкая комплектация без сложной столярки.', alt:'Визуализация студии с оливковой спальней и деревянным экраном'},
  35:{title:'Тёплая неоклассика', description:'Молочные стены, пол «ёлочкой», винные и оливковые акценты. Показываем зоны сна, работы и хранения на компактной планировке.', quote:'6,00 + 2,95 = 8,95 млн ₽', note:'Квартира + проект, ремонт и комплектация', alt:'Визуализация гостиной в тёплой неоклассике'}
};
let caseSize = 35;
const caseSizeButtons = $$('[data-case]');
const caseTabs = $$('[data-view]');
caseSizeButtons.forEach((button) => button.addEventListener('click', () => {
  caseSize = Number(button.dataset.case);
  caseSizeButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  updateCase();
}));
bindTabs(caseTabs, (button) => {
  tabSelection(caseTabs, button);
  caseTabs.forEach((tab) => { document.getElementById(tab.getAttribute('aria-controls')).hidden = tab !== button; });
});
function diagram(size, furnished) {
  const end = {25:330,30:365,35:402}[size];
  const bottom = {25:225,30:239,35:248}[size];
  const high = size === 35;
  const wash = '<rect x="66.5" y="76.5" width="96.5" height="78.5" fill="#e4d6e9" stroke="none"/>';
  const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke-width="1.25"/>`;
  const label = (x,y,t) => `<text x="${x}" y="${y}" text-anchor="middle" fill="#43334a" stroke="none" font-size="13" font-weight="750">${t}</text>`;
  const sanLabel = `${label(113,130,'Санузел')}${label(111,bottom-16,'Вход')}`;
  const partition = high ? `<path d="M251 75v106m0 33v${bottom-214}" />` : '';
  const rooms = furnished ? `
    ${rect(179,81,high ? 62 : 87,23,'#d4bfb0')}
    ${label(high ? 210 : 222,96,'Кухня')}
    ${rect(68,160,38,bottom-189,'#dfcddf')}
    ${label(127,181,'Шкаф')}
    ${high ? `
      ${rect(180,139,52,28,'#d8bfdc')}
      ${label(205,156,'Диван')}
      ${rect(275,104,74,67,'#e2c9ba')}
      ${label(312,143,'Кровать')}
      ${rect(301,205,78,24,'#e9d9c7')}
      ${label(339,221,'Стол')}
      ${label(302,93,'Спальня')}` : `
      ${rect(171,154,69,28,'#dec8b6')}
      ${label(205,172,'Стол')}
      ${rect(end-82,105,67,51,'#d8bfdc')}
      ${label(end-48,134,size === 25 ? 'Диван' : 'Кровать')}
      ${size === 30 ? `<path d="M${end-104} 104v52" stroke-dasharray="4 4"/>${rect(end-88,189,72,25,'#e9d9c7')}${label(end-52,206,'Работа')}` : ''}`}
  ` : `${label(high ? 215 : 246,119,high ? 'Кухня-гостиная' : 'Студия')}${high ? label(324,143,'Спальня') : ''}
    ${label(high ? 209 : 251,198,'White box')}`;
  return `<svg role="img" aria-label="${furnished ? 'Расстановка мебели' : 'Исходный план'} для демонстрационного примера ${size} квадратных метров" viewBox="0 0 465 285" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="${furnished ? 'grid-f' : 'grid-o'}" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" fill="none" stroke="#d8c9c3" stroke-width=".6"/></pattern></defs>
    <rect x="26" y="33" width="413" height="240" rx="3" fill="url(#${furnished ? 'grid-f' : 'grid-o'})"/>
    <text x="65" y="57" fill="#664a71" font-size="12" font-weight="800">${size} М² · ${furnished ? 'ЗОНИРОВАНИЕ' : 'ИСХОДНЫЙ ПЛАН'}</text>
    <g fill="none" stroke="#57455a" stroke-width="3" font-family="Manrope, sans-serif">
      <rect x="65" y="75" width="${end-65}" height="${bottom-75}" fill="#fdf8ef"/>
      ${wash}<path d="M163 75v54m0 19v7H65"/>${partition}
      <path d="M${end-63} 75h47M${end} 166v38" stroke="#ad91b2" stroke-width="5"/>
      <path d="M87 ${bottom}h41" stroke="#bc98c3" stroke-width="5"/>
      ${rooms}${sanLabel}
    </g></svg>`;
}
function updateCase() {
  const example = examples[caseSize];
  $('#case-title').textContent = example.title;
  $('#case-desc').textContent = example.description;
  $('#case-quote strong').textContent = example.quote;
  $('#case-quote span:last-child').textContent = example.note;
  const img = $('#case-image');
  img.src = `./assets/interior-${caseSize}.webp`;
  img.alt = example.alt;
  img.width = caseSize === 35 ? 1050 : 850;
  img.height = caseSize === 35 ? 1400 : 850;
  $('#case-before').innerHTML = diagram(caseSize, false);
  $('#case-plan').innerHTML = diagram(caseSize, true);
}
updateCase();

const packages = {
  adapt:{title:'Адаптация', price:2950, cost:2450, cac:65, mid:1500},
  custom:{title:'Близко к фото', price:4200, cost:3450, cac:65, mid:2100}
};
const analogs = {
  7290:'Краснолесья, 96', 7390:'Павла Шаманова, 5/3', 6650:'Парина, 38/3',
  6530:'де Геннина, 25к2', 6500:'Парина, 38', 6250:'Сахарова, 31Б',
  5700:'Ландау, 39', 5650:'Сахарова, 29/4', 6080:'де Геннина, 25'
};
function baseline() {
  return {
    package:'adapt', scenario:'base', area:35, property:6000, price:2950, cost:2450, cac:65, bonus:2,
    compare:'7290', comparePrice:7290, downMode:'percent', down:20, schedule:'70',
    first:70, middle:0, final:30, midcost:1500, bonusTiming:'after', active:3, completed:3,
    setup:300, monthly:50, months:5, buffer:500, flipBuy:5300, flipWorks:2385, flipOther:215, flipSale:8300
  };
}
let state = baseline();
let tab = 'deal';
const calcTabs = $$('[data-tab]');
const inputs = $('#calc-inputs');
const results = $('#calc-results');
const status = $('#calc-status');
const defaultStatus = status.textContent;
const copyButton = $('#copy-calc');
const scenarioButtons = $$('[data-scenario]');
const packageSelect = $('#package-select');
const tabNames = {buyer:'Покупатель',deal:'Одна сделка',pilot:'Пилот'};
const numberFields = {
  area:['Площадь','м²'], property:['Цена квартиры','тыс. ₽'], price:['Цена пакета','тыс. ₽'], comparePrice:['Цена стороннего аналога','тыс. ₽'],
  down:['Первоначальный взнос','%'], cost:['Прямые расходы','тыс. ₽'], bonus:['Ставка бонуса','%'],
  cac:['CAC до договора','тыс. ₽'], first:['Первый платёж','%'], middle:['Промежуточный','%'], final:['Финальный платёж','%'],
  midcost:['Расходы до второго платежа','тыс. ₽'], active:['Одновременные ремонты','шт.'], completed:['Завершённые сделки','шт.'],
  setup:['Разовые расходы','тыс. ₽'], monthly:['Расходы в месяц','тыс. ₽'], months:['Месяцы работы','мес.'], buffer:['Буфер на объект','тыс. ₽'],
  flipBuy:['Покупка под флип','тыс. ₽'], flipWorks:['Работы и меблировка','тыс. ₽'], flipOther:['Оформление, продажа и содержание','тыс. ₽'],
  flipSale:['Цена перепродажи','тыс. ₽']
};
const whole = new Set(['active','completed']);
const fieldsFor = {
  buyer:['area','property','price','down','comparePrice'],
  deal:['price','cost','cac','bonus','first','middle','final','midcost'],
  pilot:['active','completed','setup','monthly','months','buffer','flipBuy','flipWorks','flipOther','flipSale']
};
function field(key, customUnit, full = false) {
  const [label, unit] = numberFields[key];
  const val = typeof state[key] === 'number' ? decimal.format(state[key]) : state[key];
  return `<label class="field${full ? ' full' : ''}" for="p-${key}"><span>${label} <span class="input-unit">· ${customUnit || unit}</span></span>
    <input id="p-${key}" data-field="${key}" type="text" inputmode="${whole.has(key) ? 'numeric' : 'decimal'}" value="${escapeHtml(val)}" autocomplete="off" spellcheck="false" maxlength="22" aria-describedby="err-${key}">
    <span class="field-error" id="err-${key}" hidden></span></label>`;
}
function selectField(key, label, entries, full = false) {
  return `<label class="field${full ? ' full' : ''}" for="p-${key}"><span>${label}</span>
    <select id="p-${key}" data-field="${key}">${entries.map(([value, name]) =>
      `<option value="${value}"${state[key] === value ? ' selected' : ''}>${name}</option>`).join('')}</select></label>`;
}
function dealFields() {
  return `${state.schedule === 'custom' ? field('first') + field('middle') + field('final') : ''}${hasMiddle(read()) ? field('midcost') : ''}`;
}
function hasMiddle(v) { return v.middle > 0; }
function buildInputs() {
  if (tab === 'buyer') {
    inputs.innerHTML = `<h3>Два договора</h3><p>Цены можно менять. Покупатель платит за квартиру застройщику, а за интерьер отдельно.</p>
      <div class="fields">${field('area')}${field('property')}${field('price')}
      ${selectField('downMode','Единица взноса',[['percent','% от цены'],['money','Тысячи рублей']])}
      ${field('down', state.downMode === 'percent' ? '%' : 'тыс. ₽')}
      ${selectField('compare','Аналог: цена предложения',[
        ...[['7290', analogs[7290]], ...Object.entries(analogs).filter(([key]) => key !== '7290')].map(([key,name]) => [key,`${name} · ${money(+key)}`]),
        ['own','Своя цена']
      ],true)}
      ${state.compare === 'own' ? field('comparePrice', null, true) : ''}</div>`;
  } else if (tab === 'deal') {
    inputs.innerHTML = `<h3>Что приносит объект</h3><p>Расходы включают CAC. Бонус не финансирует ремонт, даже если по договору его платят раньше.</p>
      <div class="fields">${field('price')}${field('cost')}${field('cac')}${field('bonus')}
      ${selectField('schedule','График оплаты',[['70','70 / 30'],['30','30 / 40 / 30'],['custom','Свой график']])}
      ${selectField('bonusTiming','Поступление бонуса',[['after','После приёмки'],['early','По отдельной дате'],['late','С задержкой']])}
      </div><div class="fields calc-subfields" id="payment-fields">${dealFields()}</div>`;
  } else {
    inputs.innerHTML = `<h3>Капитал на запуск</h3><p>Резерв считаем по активным объектам, результат по завершённым. Без учёта налогов и окладов.</p>
      <div class="fields">${fieldsFor.pilot.slice(0,6).map((key) => field(key)).join('')}</div>
      <details class="disclosure" id="flip-inputs"><summary>Допущения по флиппингу</summary><div class="detail-body">
      <div class="fields">${fieldsFor.pilot.slice(6).map((key) => field(key)).join('')}</div>
      <button type="button" class="text-button copy-flip" id="copy-flip">Скопировать состав ремонта из «Метры»</button>
      </div></details>`;
  }
}
function read() {
  const out = { ...state };
  Object.keys(numberFields).forEach((key) => { out[key] = parseNumber(state[key]); });
  if (state.compare !== 'own') out.comparePrice = Number(state.compare);
  return out;
}
function validate(v) {
  const errors = {};
  for (const key of Object.keys(numberFields)) {
    if (key === 'midcost' && !hasMiddle(v)) continue;
    if (!Number.isFinite(v[key])) errors[key] = 'Введите неотрицательное число.';
    else if (v[key] > 1e9) errors[key] = 'Укажите меньшее значение.';
    else if (whole.has(key) && !Number.isInteger(v[key])) errors[key] = 'Укажите целое число.';
  }
  if (v.area <= 0) errors.area = 'Площадь должна быть больше нуля.';
  if (v.cac > v.cost) errors.cac = 'CAC не может превышать прямые расходы.';
  if (v.bonus > 100) errors.bonus = 'Допустимая ставка: от 0 до 100%.';
  if (state.downMode === 'percent' && v.down > 100) errors.down = 'Взнос не может превышать 100%.';
  if (state.downMode === 'money' && v.down > v.property) errors.down = 'Взнос не может превышать цену квартиры.';
  const shares = ['first','middle','final'];
  if (shares.every((key) => Number.isFinite(v[key])) && Math.abs(v.first + v.middle + v.final - 100) > 0.000001) {
    shares.forEach((key) => { errors[key] = 'Сумма трёх долей должна быть 100%.'; });
  }
  if (hasMiddle(v) && (v.midcost < v.cac || v.midcost > v.cost)) errors.midcost = 'Сумма должна быть от CAC до прямых расходов.';
  return errors;
}
function calculate(v) {
  const sum = v.property + v.price;
  const down = state.downMode === 'percent' ? v.property * v.down / 100 : v.down;
  const a = v.price * v.first / 100;
  const b = v.price * v.middle / 100;
  const c = v.price - a - b;
  const delta = sum - v.comparePrice;
  const bonus = v.property * v.bonus / 100;
  const revenue = v.price + bonus;
  const noBonus = v.price - v.cost;
  const profit = revenue - v.cost;
  const gap = Math.max(0, v.cac, v.cost - a - b, hasMiddle(v) ? v.midcost - a : 0);
  const overhead = v.setup + v.monthly * v.months;
  const reserve = v.active * Math.max(v.buffer, gap);
  const capital = overhead + reserve;
  const pilotProfit = profit * v.completed - overhead;
  const flipCost = v.flipBuy + v.flipWorks + v.flipOther;
  const flipProfit = v.flipSale - flipCost;
  return {sum, down, a, b, c, delta, bonus, revenue, noBonus, profit, gap, overhead, reserve, capital, pilotProfit, flipCost, flipProfit, flipCapital:flipCost*v.active};
}
function stateLabels() {
  const labels = {base:'Базовые допущения',nobonus:'Бонус не учтён',stress:'Стресс-сценарий',own:'Свой сценарий'};
  $('#calc-mode').textContent = labels[state.scenario];
  scenarioButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.scenario === state.scenario)));
  packageSelect.value = state.package;
}
function renderLead(items) {
  return `<div class="result-lead">${items.map(([label,amount,id]) => `<article><span>${label}</span><strong data-result="${id}">${amount}</strong></article>`).join('')}</div>`;
}
function renderList(items) {
  return `<dl class="result-list">${items.map(([label,amount,id]) => `<div><dt>${label}</dt><dd${id ? ` data-result="${id}"` : ''}>${amount}</dd></div>`).join('')}</dl>`;
}
function paymentFlow(v, m) {
  return `<div class="flow-mini"><div><span>При подписании</span><strong>${money(m.a)}</strong></div>
    ${hasMiddle(v) ? `<div><span>По промежуточному акту</span><strong>${money(m.b)}</strong></div>` : ''}
    <div><span>После приёмки</span><strong>${money(m.c)}</strong></div></div>`;
}
const contractKeys = ['price','property','cost','cac','bonus','first','middle','final','midcost'];
function relevantErrors(errors) {
  const keys = tab === 'buyer' ? [...fieldsFor.buyer,'first','middle','final'] :
    tab === 'deal' ? contractKeys : [...fieldsFor.pilot, ...contractKeys];
  return keys.filter((key) => errors[key]);
}
function render() {
  stateLabels();
  const v = read();
  const errors = validate(v);
  $$( 'input[data-field]', inputs).forEach((input) => {
    const message = errors[input.dataset.field];
    input.setAttribute('aria-invalid', String(Boolean(message)));
    const errorElement = document.getElementById(`err-${input.dataset.field}`);
    errorElement.hidden = !message;
    errorElement.textContent = message || '';
  });
  const blocked = relevantErrors(errors);
  copyButton.disabled = Object.keys(errors).length > 0;
  if (blocked.length) {
    results.innerHTML = `<h3>Проверьте исходные данные</h3><p class="result-invalid">Исправьте: ${blocked.map((key) => numberFields[key][0].toLocaleLowerCase('ru-RU')).join(', ')}. Пока не показываем результат по несогласованным данным.</p>`;
    return;
  }
  const m = calculate(v);
  if (tab === 'buyer') {
    results.innerHTML = `<h3>Бюджет покупателя</h3>${renderLead([
      ['Полный чек',money(m.sum),'total'],['Свои деньги к старту',money(m.down+m.a),'cash']
    ])}${renderList([
      ['Цена за м²',`${integer.format(m.sum*1000/v.area)} ₽`],
      ['Разница с аналогом',`${m.delta > 0 ? '+' : ''}${money(m.delta)}`,'compare'],
      ['Разница с аналогом, %',percent(ratio(m.delta,v.comparePrice))],
      ['Первоначальный взнос за квартиру',money(m.down)],
      ['Первый платёж за работы',money(m.a)],
      ...(hasMiddle(v) ? [['По промежуточному акту',money(m.b)]] : []),
      ['За работы после приёмки',money(m.c)]
    ])}<p class="result-note">Свой бюджет к старту = взнос + первый платёж за работы. Без сопутствующих расходов; не условия банка. Аналог: цена предложения, а не продажи.</p>`;
  } else if (tab === 'deal') {
    results.innerHTML = `<h3>Экономика сделки</h3>${renderLead([
      ['Результат с выбранным бонусом',money(m.profit),'profit'],['Пиковый дефицит',money(m.gap),'gap']
    ])}${renderList([
      ['Результат без бонуса',money(m.noBonus),'no-bonus'],
      ['Выручка / бонус',`${money(m.revenue)} / ${money(m.bonus)}`],
      ['Маржа до общих расходов и налогов',percent(ratio(m.profit,m.revenue))],
      ['ROI на пиковый дефицит',percent(ratio(m.profit,m.gap)),'roi'],
      ['Результат к прямым расходам',percent(ratio(m.profit,v.cost))],
      ['Мин. пакет с бонусом / без',`${money(Math.max(0,v.cost-m.bonus))} / ${money(v.cost)}`]
    ])}${paymentFlow(v,m)}<p class="result-note">Последний платёж не равен прибыли. ROI за одну сделку, не годовой. Бонус не включён в расчёт разрыва.</p>`;
  } else {
    const mismatch = Math.abs(v.flipWorks - (v.cost - v.cac)) > 0.001;
    results.innerHTML = `<h3>Финансирование пилота</h3>${renderLead([
      ['Бюджет «Метры»',money(m.capital),'pilot'],['Капитал флиппинга',money(m.flipCapital),'flip']
    ])}${renderList([
      ['Рабочий резерв «Метры»',money(m.reserve)],
      ['Запуск и общие расходы',money(m.overhead)],
      ['Результат пилота до налогов и окладов',money(m.pilotProfit),'pilot-profit'],
      ['Результат флиппинга на объект',money(m.flipProfit)],
      ['ROI флиппинга за цикл',percent(ratio(m.flipProfit,m.flipCost))],
      ['Мин. цена перепродажи флипа',money(m.flipCost)]
    ])}<p class="result-note${mismatch ? ' warning' : ''}">${mismatch ? 'Проверьте сопоставимость пакетов: расходы на ремонт различаются.' : `Одинаковое число активных объектов: ${integer.format(v.active)}. У флипа не добавлены общие расходы компании.`}</p>`;
  }
}
function switchTab(next) {
  tab = next;
  const button = calcTabs.find((item) => item.dataset.tab === tab);
  tabSelection(calcTabs, button);
  $('#calc-panel').setAttribute('aria-labelledby', button.id);
  buildInputs();
  render();
}
bindTabs(calcTabs, (button) => switchTab(button.dataset.tab));
function applyPreset(kind) {
  state.scenario = kind;
  const p = packages[state.package];
  state.cost = p.cost * (kind === 'stress' ? 110 : 100) / 100;
  state.bonus = kind === 'base' ? 2 : 0;
}
function choosePackage(name) {
  state.package = name;
  const preset = name === 'custom' ? 'nobonus' : 'base';
  const p = packages[name];
  Object.assign(state,{price:p.price, cac:p.cac, midcost:p.mid});
  applyPreset(preset);
}
packageSelect.addEventListener('change', () => { choosePackage(packageSelect.value); buildInputs(); render(); });
scenarioButtons.forEach((button) => button.addEventListener('click', () => {
  applyPreset(button.dataset.scenario);
  buildInputs();
  render();
}));
$('#reset-calc').addEventListener('click', () => {
  state = baseline();
  buildInputs();
  render();
  status.textContent = 'Базовые значения восстановлены. Вкладка сохранена.';
});
function inputChanged(event) {
  const element = event.target;
  const key = element.dataset.field;
  if (!key || (event.type === 'input' && element.tagName === 'SELECT') || (event.type === 'change' && element.tagName !== 'SELECT')) return;
  const hadMiddle = hasMiddle(read());
  if (key === 'downMode') {
    const old = read();
    if (Number.isFinite(old.down) && Number.isFinite(old.property)) {
      state.down = old.downMode === 'percent' ? old.property * old.down / 100 : old.property > 0 ? old.down / old.property * 100 : 0;
    }
  }
  state[key] = element.value;
  state.scenario = 'own';
  status.textContent = defaultStatus;
  if (key === 'schedule') {
    if (state.schedule === '70') Object.assign(state,{first:70,middle:0,final:30});
    if (state.schedule === '30') Object.assign(state,{first:30,middle:40,final:30});
  }
  if (['schedule','downMode','compare'].includes(key)) {
    buildInputs();
    document.getElementById(`p-${key}`)?.focus({preventScroll:true});
  } else if (key === 'middle' && hadMiddle !== hasMiddle(read())) {
    const container = $('#payment-fields');
    if (hasMiddle(read())) container.insertAdjacentHTML('beforeend',field('midcost'));
    else $('#p-midcost')?.closest('label').remove();
  }
  render();
}
inputs.addEventListener('input', inputChanged);
inputs.addEventListener('change', inputChanged);
inputs.addEventListener('click', (event) => {
  if (!event.target.closest('#copy-flip')) return;
  const v = read();
  if (validate(v).cac || validate(v).cost) {
    status.textContent = 'Сначала проверьте прямые расходы и CAC во вкладке «Одна сделка».';
    return;
  }
  state.flipWorks = v.cost - v.cac;
  state.scenario = 'own';
  $('#p-flipWorks').value = decimal.format(state.flipWorks);
  status.textContent = 'Перенесены прямые расходы за вычетом CAC.';
  render();
});
$$('[data-calc-tab]').forEach((link) => link.addEventListener('click', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (link.dataset.packageLink) choosePackage(link.dataset.packageLink);
  if (link.dataset.compare) state.compare = link.dataset.compare;
  switchTab(link.dataset.calcTab);
}));

const copyDialog = $('#copy-dialog');
function summary() {
  const v = read();
  const m = calculate(v);
  const parts = [
    `Метра · сценарий, не оферта · ${tabNames[tab]}`,
    `${packages[state.package].title} · ${decimal.format(v.area)} м². Квартира: ${money(v.property)}; пакет: ${money(v.price)}; полный чек: ${money(m.sum)}.`,
    `Взнос за квартиру: ${money(m.down)}. Платежи за работы: ${money(m.a)}${hasMiddle(v) ? ` / ${money(m.b)}` : ''} / ${money(m.c)}. Свои средства к старту: ${money(m.down+m.a)}.`,
    `Цена предложения аналога (${analogs[state.compare] ?? 'своя цена'}): ${money(v.comparePrice)}. Разница: ${money(m.delta)} (${percent(ratio(m.delta,v.comparePrice))}).`,
    `Прямые расходы: ${money(v.cost)}, в т. ч. CAC ${money(v.cac)}${hasMiddle(v) ? `; к промежуточному акту: ${money(v.midcost)}` : ''}. Бонус: ${decimal.format(v.bonus)}% (${money(m.bonus)}), не финансирует ремонт.`,
    `Одна сделка: без бонуса ${money(m.noBonus)}, с бонусом ${money(m.profit)}. Пиковый разрыв ${money(m.gap)}. ROI на разрыв ${percent(ratio(m.profit,m.gap))}.`,
    `Пилот: ${v.active} активных, ${v.completed} завершённых. Запуск ${money(v.setup)}; ${money(v.monthly)}/мес. × ${v.months} мес.; буфер ${money(v.buffer)}/объект.`,
    `Капитал пилота ${money(m.capital)}, результат до налогов и окладов ${money(m.pilotProfit)}. Флиппинг: капитал ${money(m.flipCapital)}, результат на объект ${money(m.flipProfit)}, ROI ${percent(ratio(m.flipProfit,m.flipCost))}.`
  ];
  return parts.join('\n');
}
copyButton.addEventListener('click', async () => {
  const body = summary();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(body);
    status.textContent = 'Расчёт скопирован. Данные не отправлены.';
  } catch {
    $('#copy-text').value = body;
    copyDialog.showModal();
    $('#copy-text').focus();
    $('#copy-text').select();
  }
});
$('#select-copy').addEventListener('click', () => { $('#copy-text').focus(); $('#copy-text').select(); });
const sourcesDialog = $('#sources-dialog');
function showSources() {
  const sourceRows = [...new Map($$('main a.source').map((link) => [link.href,link])).values()];
  $('#sources-list').replaceChildren(...sourceRows.map((link) => {
    const row = document.createElement('li');
    const label = document.createElement('label');
    label.append(link.textContent.replace('↗','').trim());
    const input = document.createElement('input');
    input.readOnly = true;
    input.value = link.href;
    input.addEventListener('focus', () => input.select());
    label.append(input);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline';
    button.textContent = 'Копировать';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(link.href);
        $('#source-status').textContent = 'Адрес скопирован.';
      } catch {
        input.focus();
        $('#source-status').textContent = 'Адрес выделен. Скопируйте его вручную.';
      }
    });
    row.append(label,button);
    return row;
  }));
  $('#source-status').textContent = '';
  sourcesDialog.showModal();
}
$$('[data-show-sources]').forEach((button) => button.addEventListener('click', showSources));
$$('dialog [data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
}));
switchTab('deal');
