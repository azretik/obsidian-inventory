// main.js - inventory plugin
const { Plugin, Notice, setIcon, parseYaml } = require('obsidian')

// DEBUG - режим отладки
const DEBUG = false
function debuglog(data) {
    if (DEBUG) console.log(data)
}
// CODE_BLOCK - какой code блок отрабатывать?
const CODE_BLOCK = 'inventory'

// SYS_PARAMS - системные параметры - для визуала
const SYS_PARAMS = ['desc', 'color', 'background', 'icon']

// PWD - проверяем поле на парольность
const PWD_PARAMS = ['pwd','pass','password','pin','secret','пароль','секрет','пин','пинкод']
const PWD_REGEX = new RegExp(PWD_PARAMS.join('|'), 'i'); // создаётся один раз при загрузке модуля
function isPWD(label) {return PWD_REGEX.test(String(label))}

// LANG - языковая поддержка (переводы)
const LANG = {
    ru: {
        inventoryLoaded: "Плагин Inventory загружен.",
        inventoryUnloaded: "Плагин Inventory выгружен.",
        hello: "Привет",
        copied: "Скопировано",
        copiedError: "Ошибка копирования",
        empty: "Пусто",
        addExampleYaml: "Вставить пример YAML кода",
        exampleYamlAdded: "Пример YAML кода успешно вставлен",
        exampleYamlAddError: "Ошибка при попытке вставки YAML",
    },
    en: {
        inventoryLoaded: "Inventory plugin is loaded.",
        inventoryUnloaded: "Inventory plugin is unloaded.",
        hello: "Hello",
        copied: "Copied",
        copiedError: "Copy error",
        empty: "Empty",
        addExampleYaml: "Add YAML example",
        exampleYamlAdded: "YAML example successfully added",
        exampleYamlAddError: "Error adding YAML example",
    }
}

// YAML_DEMO - примеры yaml объекта (с языковой поддержкой)
const YAML_DEMO = {
    ru: `\`\`\`inventory
"Первая секция":
  color: red
  Описание: "описание первой секции"
  "Первый экземпляр":
    color: orange
    Описание: "Описание первого экземпляра"
    Параметр: "Первый параметр"
    "Объект":
        параметр: "значение"
        pwd: "пароль"
    "Коллекция":
        - "первое значение"
        - "второе значение"
    "Второй экземпляр":
        color: green
        Описание: "Описание второго экземпляра"
\`\`\``,
    en: `\`\`\`inventory
"First section":
  color: red
  Description: "first section description"
  "First example":
    color: orange
    Description: "First example description"
    Param: "First param"
    "Object":
        param: "value"
        pwd: "password"
    "Collection":
        - "first value"
        - "second value"
    "Second example":
        color: green
        Description: "Second example description"
\`\`\``
}

// locale - текущая локаль
let locale = 'en'

// getLocale - получаем системный язык
function getSysLocale() {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    const code = lang.split('-')[0].toLowerCase();
    // Гарантированный фоллбэк, если языка нет в словаре
    return LANG[code] ? code : 'en';
}

// lang - получить строку перевода по ключу
function lang(label) {
    if (LANG[locale][label]===undefined){
        return LANG.en[label]
    }
    return LANG[locale][label] || label
}

// getParam - получить параметр объекта или пустое значение
function getParam(data, param) {
    return data?.hasOwnProperty(param) ? data[param] : '';
}

// flattenObject - уплощить вложенные объекты
function flattenObject(obj, prefix = '') {
    const res = []
    if (!obj || typeof obj !== 'object') return res
    for (const [k, v] of Object.entries(obj)) {
        const cur = prefix ? `${prefix} ${k}` : k
        if (typeof v === 'string' || typeof v === 'number') res.push({ l: cur, v: String(v) })
        else if (Array.isArray(v)) v.forEach((item, i) => {
            if (typeof item === 'object' && item !== null) res.push(...flattenObject(item, `${cur} ${i + 1}`))
            else res.push({ l: `${cur} ${i + 1}`, v: String(item) })
        })
        else if (typeof v === 'object' && v !== null) res.push(...flattenObject(v, cur))
    }
    return res
}

// getInventory - генерация интерфейса
function getInventory(data){
    // обрабатываем пустые значения data
    let inventory = document.createElement('span')
    inventory.innerText = lang('empty')
    if (data === null || data === undefined) return inventory
    let sections = Object.keys(data)
    if (sections.length === 0) return inventory
    // генерируем базовый inventory
    inventory = document.createDocumentFragment()

    sections.forEach(section => {

        // ГЕНЕРАЦИЯ ЗАГОЛОВКА СЕКЦИИ
        // ============
        let sectionElement = document.createElement('div')
        sectionElement.classList.add('inv-section')
        sectionElement.innerHTML = `
<div class="inv-header" style="background-color: ${getParam(data[section], 'background')};">
    <div class="inv-title">
        <div class="inv-icon" style="color: ${getParam(data[section], 'color')};"></div>
        <div class="inv-text">
            <div class="inv-title" style="color: ${getParam(data[section], 'color')};">${section || lang('empty')}</div>
            <div class="inv-desc" style="color: ${getParam(data[section], 'color')};">${getParam(data[section],'desc') || ''}</div>
        </div>
    </div>
    <div class="inv-chevron" style="color: ${getParam(data[section], 'color')};"></div>
</div>
`
        setIcon(sectionElement.querySelector('.inv-icon'), getParam(data[section], 'icon') || 'info')
        setIcon(sectionElement.querySelector('.inv-chevron'), 'chevron-right')

        // Коллапс содержимого по клику на заголовке
        sectionElement.onclick = (e) => {
            // Игнорируем клики по кнопкам и значениям внутри
            if (e.target.closest('.inv-content')) {
                return
            }
            e.stopPropagation()
            sectionElement.classList.toggle('inv-collapsed')
        };

        if (data[section] !== null) {
            let items = Object.keys(data[section]).filter(item => SYS_PARAMS.indexOf(item) === -1)
            items.forEach(item => {

                // ГЕНЕРАЦИЯ ЭЛЕМЕНТОВ СЕКЦИИ
                // ============
                let contentElement = document.createElement('div')
                contentElement.classList.add('inv-content')
                contentElement.innerHTML = `
<div class="inv-item" style="border-color: ${getParam(data[section][item],'color')};">
    <div class="inv-title" style="color:${getParam(data[section][item],'color')};">${item}</div>
    <div class="inv-desc" style="color:${getParam(data[section][item],'color')};">${getParam(data[section][item],'desc') || ''}</div>
</div>
        `
                let itemParams = flattenObject(data[section][item]).filter(item => SYS_PARAMS.indexOf(item.l) === -1)
                let lastRoot
                itemParams.forEach((f, i) => {
                    const root = f.l.split(' ')[0]
                    if(i>0 && root !== lastRoot){
                        const hrElement = document.createElement('hr')
                        hrElement.classList.add('inv-hr')
                        contentElement.appendChild(hrElement)
                    }
                    lastRoot = root

                    // ГЕНЕРАЦИЯ СТРОК СОДЕРЖИМОГО ЭЛЕМЕНТОВ
                    // ============
                    const rowElement = document.createElement('div')
                    rowElement.classList.add('inv-item-row')

                    const dataValue = String(f.v ?? '')
                    const value = isPWD(f.l) ? '*'.repeat(dataValue.length) : dataValue

                    const rowLabelElement = document.createElement('span')
                    rowLabelElement.classList.add('inv-item-label')
                    rowLabelElement.textContent = `${f.l}:`

                    const rowValueElement = document.createElement('span')
                    rowValueElement.classList.add('inv-item-value')
                    rowValueElement.dataset.value = dataValue
                    rowValueElement.textContent = value

                    rowElement.appendChild(rowLabelElement)
                    rowElement.appendChild(rowValueElement)

                    // Обрабатываем пароли
                    if (isPWD(f.l)) {
                        const rowPwdBTN = document.createElement('button')
                        rowPwdBTN.classList.add('inv-item-pwd')
                        rowPwdBTN.type = 'button'
                        setIcon(rowPwdBTN, 'eye')
                        rowPwdBTN.onclick = (e) => {
                            e.stopPropagation()
                            const currentText = rowValueElement.textContent;
                            const originalValue = rowValueElement.dataset.value
                            const isHidden = currentText === '*'.repeat(originalValue.length)

                            rowValueElement.textContent = isHidden ? originalValue : '*'.repeat(originalValue.length)
                            setIcon(rowPwdBTN, isHidden ? 'eye-off' : 'eye') // переключение иконки
                        }

                        rowElement.appendChild(rowPwdBTN)
                    }

                    // Обрабатываем клик по строке
                    rowElement.onclick = async (e) => {
                        e.stopPropagation()
                        const value = rowValueElement.dataset.value
                        if (!value) return

                        try {
                            await navigator.clipboard.writeText(value)
                            rowElement.classList.add('inv-copied')
                            // new Notice(lang('copied'))

                            setTimeout(() => {
                                rowValueElement.textContent = isPWD(f.l) ? '*'.repeat(value.length) : value
                                rowElement.classList.remove('inv-copied')
                            }, 1500)
                        } catch (err) {
                            new Notice(lang('copiedError'))
                        }
                    }

                    contentElement.appendChild(rowElement)
                })

                sectionElement.appendChild(contentElement)
            })
        }
        inventory.appendChild(sectionElement)
    })
    return inventory
}

// Основной класс платгина
class InventoryPlugin extends Plugin {
    async onload(){
        // загрузить системный язык
        locale = getSysLocale()
        // debuglog(lang('inventoryLoaded'))

        // Устанавливаем параметр в консоль команд obsidian
        this.addCommand({
            id: 'insertInventoryDemoYaml',
            name: lang('addExampleYaml'),
            editorCallback: (editor, view) => {
                try {
                    // Вставляем данные YAML из примера в позицию курсора
                    editor.replaceSelection(YAML_DEMO[locale])
                    new Notice(lang('exampleYamlAdded'))
                } catch (err) {
                    new Notice(lang('exampleYamlAddError'))
                }
            }
        })

        // Регистрация и парсинг inventory блоков кода
        this.registerMarkdownCodeBlockProcessor(CODE_BLOCK, (source, el) =>{
            try {
                const raw = parseYaml(source)
                el.appendChild(getInventory(raw))
            } catch (err) {
                el.innerHTML = `<pre class="">YAML error: ${err.message || err}</pre>`
            }
        })

        // Перерендериваемся после смены локали
        this.registerDomEvent(document, 'localechange', () => {
            locale = getSysLocale();
            // Перерендер открытых блоков можно триггерить через:
            this.app.workspace.trigger('markdown-render-complete');
        })
    }
    onunload() {
        debuglog(lang('inventoryUnloaded'))
    }
}

// Экспортируем класс плагина
module.exports = InventoryPlugin