let csvData = [];
let filteredData = [];
let headers = [];
let currentSort = { column: null, direction: 'none' };
let currentDataSource = 'a.csv';
let currentLanguage = 'zh';

const translations = {
    zh: {
        title: '🍁 MapleDuel 🍁',
        search: '搜尋',
        searchPlaceholder: '輸入關鍵字搜尋...',
        category: '分類',
        class: '職業',
        rarity: '稀有度',
        clearFilters: '清除篩選',
        switchToKorean: '한국어로 변경',
        switchToChinese: '切為中文',
        loading: '載入中...',
        showing: '顯示',
        of: '/',
        records: '筆資料'
    },
    ko: {
        title: '🍁 MapleDuel 🍁',
        search: '검색',
        searchPlaceholder: '키워드 검색...',
        category: '분류',
        class: '직업',
        rarity: '희귀도',
        clearFilters: '필터 초기화',
        switchToKorean: '한국어로 변경',
        switchToChinese: '切為中文',
        loading: '로딩 중...',
        showing: '표시',
        of: '/',
        records: '개 데이터'
    }
};

// 根據語言映射列名
const columnMapping = {
    zh: {
        category: '分類',
        class: '職業', 
        rarity: '稀有度'
    },
    ko: {
        category: '분류',
        class: '직업',
        rarity: '희귀도'
    }
};

function parseCSV(text) {
    const result = [];
    const lines = text.split('\n');
    let headers = [];
    let currentRow = [];
    let inQuotedField = false;
    let currentField = '';
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotedField && line[i + 1] === '"') {
                    // 處理雙引號轉義
                    currentField += '"';
                    i++; // 跳過下一個引號
                } else {
                    // 切換引號狀態
                    inQuotedField = !inQuotedField;
                }
            } else if (char === ',' && !inQuotedField) {
                // 字段分隔符
                currentRow.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        // 如果在引號內，添加換行符並繼續到下一行
        if (inQuotedField) {
            currentField += '\n';
            continue;
        }
        
        // 行結束，添加最後一個字段
        if (currentField !== '' || currentRow.length > 0) {
            currentRow.push(currentField.trim());
        }
        
        // 處理完整的行
        if (currentRow.length > 0) {
            if (headers.length === 0) {
                headers = currentRow;
            } else {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = currentRow[index] || '';
                });
                result.push(rowData);
            }
            currentRow = [];
            currentField = '';
        }
    }
    
    return result;
}

document.addEventListener('DOMContentLoaded', function() {
    // 設置初始語言
    updateInterfaceLanguage();
    loadData(currentDataSource);
});

function loadData(csvFile) {
    const loadingElement = document.getElementById('loading');
    const mainContent = document.getElementById('main-content');

    // 更新界面語言
    updateInterfaceLanguage();

    // 顯示載入中訊息
    loadingElement.style.display = 'block';
    mainContent.style.display = 'none';
    loadingElement.textContent = translations[currentLanguage].loading;

    // 讀取 CSV 檔案
    fetch(csvFile)
        .then(response => response.text())
        .then(data => {
            // 解析 CSV 資料 - 正確處理包含換行的雙引號內容
            csvData = parseCSV(data);
            headers = Object.keys(csvData[0] || {});
            
            // 清除現有的過濾器
            clearExistingFilters();
            
            // 初始化表格
            initializeTable();
            populateFilters();
            if (!document.getElementById('switchLanguage').hasEventListeners) {
                setupEventListeners();
            }
            
            // 重置排序和過濾
            currentSort = { column: null, direction: 'none' };
            filteredData = [...csvData];
            renderTable();
            updateCount();
            
            // 隱藏載入中訊息，顯示主要內容
            loadingElement.style.display = 'none';
            mainContent.style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            const t = translations[currentLanguage];
            loadingElement.textContent = '載入失敗，請確認 CSV 檔案是否存在';
        });
}

function clearExistingFilters() {
    // 清除搜尋框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    // 清除現有的過濾器內容
    ['categoryFilter', 'classFilter', 'rarityFilter'].forEach(filterId => {
        const container = document.getElementById(filterId);
        if (container) container.innerHTML = '';
    });
}

function updateInterfaceLanguage() {
    const t = translations[currentLanguage];
    
    // 更新標題
    document.querySelector('h1').textContent = t.title;
    
    // 更新搜尋區域
    document.querySelector('label[for="searchInput"]').textContent = t.search;
    document.getElementById('searchInput').placeholder = t.searchPlaceholder;
    
    // 更新過濾器標籤 - 使用更精確的選擇器
    const categoryLabel = document.querySelector('#categoryFilter').previousElementSibling;
    const classLabel = document.querySelector('#classFilter').previousElementSibling;
    const rarityLabel = document.querySelector('#rarityFilter').previousElementSibling;
    
    if (categoryLabel) categoryLabel.textContent = t.category;
    if (classLabel) classLabel.textContent = t.class;
    if (rarityLabel) rarityLabel.textContent = t.rarity;
    
    // 更新按鈕
    document.getElementById('clearFilters').textContent = t.clearFilters;
    
    // 根據當前語言設置切換按鈕文字
    const switchBtn = document.getElementById('switchLanguage');
    if (currentLanguage === 'zh') {
        switchBtn.textContent = t.switchToKorean; // 중문이면 "한국어로 변경"
    } else {
        switchBtn.textContent = t.switchToChinese; // 한국어면 "切為中文"
    }
    
    // 更新載入文字
    const loadingElement = document.getElementById('loading');
    if (loadingElement.textContent.includes('載入') || loadingElement.textContent.includes('로딩')) {
        loadingElement.textContent = t.loading;
    }
}

function initializeTable() {
    const tableHeader = document.getElementById('table-header');
    tableHeader.innerHTML = '';
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.minWidth = getColumnWidth(header);
        th.className = 'sortable sort-none';
        th.dataset.column = header;
        
        // 添加排序圖標
        const sortIcon = document.createElement('span');
        sortIcon.className = 'sort-icon';
        th.appendChild(sortIcon);
        
        // 添加點擊事件
        th.addEventListener('click', () => sortTable(header));
        
        tableHeader.appendChild(th);
    });
}

function getColumnWidth(header) {
    // 根據欄位名稱設定合適的最小寬度
    const widthMap = {
        '名稱': '150px',
        '變形清單': '120px',
        '分類': '80px',
        '職業': '80px',
        '標籤': '120px',
        '費用': '60px',
        '攻擊力': '80px',
        'HP': '60px',
        '效果': '300px',
        '卡包': '80px',
        '稀有度': '80px',
        '機率(%)': '80px'
    };
    return widthMap[header] || '100px';
}

function sortTable(column) {
    // 更新排序狀態
    if (currentSort.column === column) {
        // 同一列：切換排序方向
        if (currentSort.direction === 'none') {
            currentSort.direction = 'asc';
        } else if (currentSort.direction === 'asc') {
            currentSort.direction = 'desc';
        } else {
            currentSort.direction = 'none';
        }
    } else {
        // 不同列：重置為升序
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // 更新表頭樣式
    updateSortHeaders();
    
    // 排序數據
    if (currentSort.direction === 'none') {
        // 恢復原始順序
        filteredData = csvData.filter(row => filteredData.includes(row));
    } else {
        filteredData.sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';
            
            // 數字列特殊處理
            if (['費用', '攻擊力', 'HP', '機率(%)'].includes(column)) {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            
            let result = 0;
            if (aVal < bVal) result = -1;
            else if (aVal > bVal) result = 1;
            
            return currentSort.direction === 'asc' ? result : -result;
        });
    }
    
    renderTable();
}

function updateSortHeaders() {
    const headers = document.querySelectorAll('#table-header th');
    headers.forEach(th => {
        const column = th.dataset.column;
        th.className = 'sortable';
        
        if (column === currentSort.column) {
            th.className += ` sort-${currentSort.direction}`;
        } else {
            th.className += ' sort-none';
        }
    });
}

function populateFilters() {
    const columns = columnMapping[currentLanguage];
    populateCheckboxFilter('categoryFilter', columns.category);
    populateCheckboxFilter('classFilter', columns.class);
    populateCheckboxFilter('rarityFilter', columns.rarity);
}

function populateCheckboxFilter(filterId, columnName) {
    const container = document.getElementById(filterId);
    
    // 確保容器存在且csvData有資料
    if (!container || !csvData || csvData.length === 0) {
        console.warn(`Cannot populate filter ${filterId}: container=${!!container}, csvData length=${csvData?.length || 0}`);
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    console.log(`Populating ${filterId} with column ${columnName}`);
    console.log('Available columns:', Object.keys(csvData[0] || {}));
    
    const uniqueValues = [...new Set(csvData.map(row => row[columnName]).filter(value => value))];
    uniqueValues.sort();
    
    console.log(`${filterId} unique values:`, uniqueValues);
    
    if (uniqueValues.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'filter-checkbox-item';
        noDataDiv.textContent = '無資料';
        container.appendChild(noDataDiv);
        return;
    }
    
    uniqueValues.forEach(value => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'filter-checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${filterId}_${value}`;
        checkbox.value = value;
        checkbox.addEventListener('change', filterData);
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = value;
        
        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        container.appendChild(itemDiv);
    });
}

function setupEventListeners() {
    // 搜尋輸入框
    document.getElementById('searchInput').addEventListener('input', filterData);
    
    // 清除篩選按鈕
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // 語言切換按鈕
    const switchBtn = document.getElementById('switchLanguage');
    if (!switchBtn.hasEventListeners) {
        switchBtn.addEventListener('click', switchLanguage);
        switchBtn.hasEventListeners = true;
    }
    
    // 注意：複選框的事件監聽器在 populateCheckboxFilter 中已經添加
}

function switchLanguage() {
    if (currentDataSource === 'a.csv') {
        // 切換到韓語
        currentDataSource = 'k.csv';
        currentLanguage = 'ko';
        loadData(currentDataSource);
    } else {
        // 切換到中文
        currentDataSource = 'a.csv';
        currentLanguage = 'zh';
        loadData(currentDataSource);
    }
}

function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const columns = columnMapping[currentLanguage];
    
    // 獲取選中的複選框值
    const selectedCategories = getSelectedCheckboxValues('categoryFilter');
    const selectedClasses = getSelectedCheckboxValues('classFilter');
    const selectedRarities = getSelectedCheckboxValues('rarityFilter');
    
    filteredData = csvData.filter(row => {
        // 搜尋過濾（搜尋所有欄位）
        const matchesSearch = !searchTerm || Object.values(row).some(value => 
            value.toLowerCase().includes(searchTerm)
        );
        
        // 分類過濾（如果沒有選中任何分類，則顯示全部）
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(row[columns.category]);
        
        // 職業過濾（如果沒有選中任何職業，則顯示全部）
        let matchesClass = selectedClasses.length === 0;
        if (!matchesClass) {
            const rowClass = row[columns.class] || '';
            // 如果選中了"共通"（中文）或"공통"（韓文），則空白職業也符合條件
            if (selectedClasses.includes('共通') || selectedClasses.includes('공통')) {
                matchesClass = selectedClasses.includes(rowClass) || rowClass === '';
            } else {
                matchesClass = selectedClasses.includes(rowClass);
            }
        }
        
        // 稀有度過濾（如果沒有選中任何稀有度，則顯示全部）
        const matchesRarity = selectedRarities.length === 0 || selectedRarities.includes(row[columns.rarity]);
        
        return matchesSearch && matchesCategory && matchesClass && matchesRarity;
    });
    
    // 重新應用排序
    if (currentSort.direction !== 'none' && currentSort.column) {
        sortTable(currentSort.column);
        return; // sortTable 會調用 renderTable
    }
    
    renderTable();
    updateCount();
}

function getSelectedCheckboxValues(filterId) {
    const container = document.getElementById(filterId);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function getRarityClass(rarity) {
    const rarityMap = {
        '傳說': 'rarity-legendary',
        '史詩': 'rarity-epic',
        '罕見': 'rarity-rare',
        '稀有': 'rarity-rare',
        '基本': 'rarity-common'
    };
    return rarityMap[rarity] || 'rarity-common';
}

function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    // 創建正則表達式，忽略大小寫
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    
    // 替換匹配的文本為高亮版本
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function escapeRegExp(string) {
    // 轉義正則表達式特殊字符
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderTable() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredData.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        headers.forEach(header => {
            const td = document.createElement('td');
            let content = row[header] || '';
            
            // 處理內容和高亮
            if (content) {
                if (content.includes('\n')) {
                    // 處理包含換行的內容
                    content = content.replace(/\n/g, '<br>');
                    if (searchTerm) {
                        content = highlightText(content, searchTerm);
                    }
                    td.innerHTML = content;
                } else {
                    // 處理普通文本
                    if (searchTerm) {
                        content = highlightText(content, searchTerm);
                        td.innerHTML = content;
                    } else {
                        td.textContent = content;
                    }
                }
            }
            
            // 特殊處理某些欄位
            if (header === '效果' && row[header]) {
                td.style.fontSize = '0.9em';
                td.style.lineHeight = '1.3';
            }
            
            if (header === '費用' || header === '攻擊力' || header === 'HP' || header === '機率(%)') {
                td.style.textAlign = 'center';
            }
            
            // 稀有度顏色處理
            if (header === '稀有度' && row[header]) {
                td.className = getRarityClass(row[header]);
            }
            
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
}

function updateCount() {
    const t = translations[currentLanguage];
    document.getElementById('visibleCount').textContent = filteredData.length;
    document.getElementById('totalCount').textContent = csvData.length;
    
    // 更新計數文字
    const infoText = document.querySelector('.info-text');
    infoText.innerHTML = `${t.showing} <span id="visibleCount">${filteredData.length}</span> ${t.of} <span id="totalCount">${csvData.length}</span> ${t.records}`;
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    
    // 清除所有複選框的選中狀態
    clearAllCheckboxes('categoryFilter');
    clearAllCheckboxes('classFilter');
    clearAllCheckboxes('rarityFilter');
    
    // 重置排序
    currentSort = { column: null, direction: 'none' };
    updateSortHeaders();
    
    filteredData = [...csvData];
    renderTable();
    updateCount();
}

function clearAllCheckboxes(filterId) {
    const container = document.getElementById(filterId);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
} 