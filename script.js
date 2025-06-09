document.addEventListener('DOMContentLoaded', function() {
    const loadingElement = document.getElementById('loading');
    const cardsContainer = document.getElementById('cards-container');

    // 讀取 CSV 檔案
    fetch('a.csv')
        .then(response => response.text())
        .then(data => {
            // 解析 CSV 資料
            const rows = data.split('\n');
            const headers = rows[0].split(',').map(header => header.trim());
            
            // 隱藏載入中訊息
            loadingElement.style.display = 'none';

            // 為每一行資料建立卡片
            for (let i = 1; i < rows.length; i++) {
                if (rows[i].trim() === '') continue; // 跳過空行
                
                const values = rows[i].split(',').map(value => value.trim());
                const card = createCard(headers, values);
                cardsContainer.appendChild(card);
            }
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            loadingElement.textContent = '載入失敗，請確認 CSV 檔案是否存在';
        });
});

function createCard(headers, values) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-sm-6';

    const card = document.createElement('div');
    card.className = 'card';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // 建立卡片內容
    headers.forEach((header, index) => {
        if (values[index]) {
            const row = document.createElement('div');
            row.className = 'mb-2';
            
            const label = document.createElement('strong');
            label.textContent = `${header}: `;
            
            const value = document.createElement('span');
            value.textContent = values[index];
            
            row.appendChild(label);
            row.appendChild(value);
            cardBody.appendChild(row);
        }
    });

    card.appendChild(cardBody);
    col.appendChild(card);
    return col;
} 