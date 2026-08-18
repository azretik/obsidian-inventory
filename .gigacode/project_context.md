# AI Context: Obsidian Inventory Plugin

## 1. Overview
This is an Obsidian community plugin that visualizes structured data from YAML code blocks in the form of an interactive inventory with password hiding support.

## 2. Project Structure
```
obsidian-inventory/
├── main.js          # Main plugin code (260 lines)
├── styles.css       # Plugin styles (130 lines)
├── manifest.json    # Plugin metadata
├── README.md        # Documentation
└── LICENSE          # MIT License
```

## 3. Core Architecture

### 3.1 Class Structure
- `InventoryPlugin` extends `obsidian.Plugin`
- Single entry point: `main.js`
- No build system, no dependencies beyond obsidian core

### 3.2 Key Functions

#### `parseYaml(source)`
- Obsidian core utility to parse YAML from code block

#### `getInventory(data)`
- Main rendering function
- Input: parsed YAML object
- Output: DOM element tree with inventory UI
- Creates: sections → items → rows

#### `flattenObject(obj, prefix)`
- Flattens nested objects into linear array
- Returns array of `{l: label, v: value}`
- Handles arrays and nested objects recursively

#### `getParam(data, param)`
- Safe parameter getter (returns '' if undefined)

#### `isPWD(label)`
- Checks if label matches password-like fields
- Uses regex from PWD_PARAMS list

## 4. Data Flow

```
User types ```inventory block
    ↓
CodeBlockProcessor receives source
    ↓
parseYaml(source) → JavaScript object
    ↓
getInventory(data) → DOM element tree
    ↓
Appended to view element
```

## 5. UI Components

### 5.1 Section Structure
```
inv-section (outer container)
├── inv-header (clickable header)
│   ├── inv-title (title + icon)
│   │   ├── inv-icon
│   │   └── inv-text
│   │       ├── inv-title
│   │       └── inv-desc
│   └── inv-chevron
└── inv-content (collapsible body)
    ├── inv-item (section item)
    │   ├── inv-title
    │   ├── inv-desc
    │   └── inv-item-row × N
    │       ├── inv-item-label
    │       ├── inv-item-value
    │       └── inv-item-pwd (if password field)
    └── inv-hr (separator)
```

### 5.2 Key Features
- Collapse/expand on header click
- Password masking with eye toggle
- Copy on click with visual feedback
- Color customization via YAML params

## 6. Configuration

### 6.1 System Parameters (ignored in rendering)
- `desc` - section/item description
- `color` - text color
- `background` - section background
- `icon` - obsidian icon name

### 6.2 Password Parameters (auto-detected)
```javascript
const PWD_PARAMS = [
    'pwd', 'pass', 'password', 'pin', 'secret',
    'пароль', 'секрет', 'пин', 'пинкод'
];
```

### 6.3 Localization
```javascript
const LANG = {
    ru: { ... },
    en: { ... }
};
```
Auto-detected from `navigator.language`.

## 7. Known Issues

### 7.1 State Persistence
- Collapse state not preserved across renders
- Need to use `saveData()` / `loadData()` from Plugin API

### 7.2 Background Support
- `background` only works on sections
- Not applied to items or nested objects

### 7.3 Hardcoded Values
- `max-height: 2000px` in CSS for collapse animation
- PWD_PARAMS hardcoded, not customizable
- No plugin settings tab

## 8. Planned Improvements

### Priority 1: Core Fixes
1. Add collapse state persistence using `saveData()`
2. Apply `background` to items and nested objects
3. Add plugin settings via `addSettingTab()`

### Priority 2: Features
1. Manual locale switching command
2. Search/filter functionality
3. Customizable PWD field patterns
4. Improved error handling for YAML parsing

### Priority 3: Polish
1. Remove hardcoded max-height
2. Add animations for better UX
3. Support for images/media in inventory
4. Export functionality

## 9. Dependencies
- Obsidian 1.4.0+ (from manifest.json)
- No external libraries

## 10. Testing Approach
1. Manual testing in Obsidian desktop
2. YAML edge cases (empty, null, nested)
3. Password field detection
4. Copy functionality
5. Locale switching
6. Collapse state persistence (after fix)

## 11. Coding Conventions
- Single file plugin (main.js)
- No transpilation, standard ES6
- DOM manipulation without frameworks
- CSS custom properties for theming
- Comments in Russian (project language)

## 12. Obsidian API Usage

### Used APIs:
- `Plugin` base class
- `registerMarkdownCodeBlockProcessor()`
- `addCommand()`
- `Notice` for user notifications
- `setIcon()` for icon rendering
- `parseYaml()` for YAML parsing
- `app.workspace` events

### Not yet used:
- `saveData()` / `loadData()` for persistence
- `addSettingTab()` for plugin settings
- `getApiVersion()` for version checking
