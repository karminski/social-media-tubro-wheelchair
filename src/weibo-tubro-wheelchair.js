// ==UserScript==
// @name         Weibo Tubro Wheelchair
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically like posts on Weibo with random delays
// @author       You
// @match        https://weibo.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Configuration
    const config = {
        minDelay: 2000,  // Minimum delay between likes in ms (default: 2s)
        maxDelay: 5000, // Maximum delay between likes in ms (default: 5s)
        scrollStep: 300, // Pixels to scroll each time
        scrollInterval: 2000, // Time between scrolls in ms
        skipLiked: true, // Skip already liked posts
    };

    // State variables
    let isRunning = false;
    let likeCount = 0;
    let panelExpanded = true;
    let scrollIntervalId = null;
    let isProcessing = false;  // 新增：标记是否正在处理按钮
    let lastProcessedButtonId = null;  // 新增：记录上次处理的按钮ID
    let processedButtons = new Set();  // 新增：记录已处理过的按钮

    // Create control panel
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'auto-liker-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            min-width: 200px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        `;

        updatePanelContent(panel);
        document.body.appendChild(panel);
        
        // Debug code to check if panel was created
        console.log('Panel created:', panel);
        console.log('Panel in DOM:', document.getElementById('auto-liker-panel'));
        
        return panel;
    }

    // Update panel content
    function updatePanelContent(panel) {
        if (panelExpanded) {
            panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 16px;">全自动涡轮轮椅-Powered by 微博智驾</h3>
                    <button id="auto-liker-minimize" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">−</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 16px;">自动点赞</h3>
                </div>
                <div style="margin-bottom: 15px;">
                    已点赞: <span id="auto-liker-count">${likeCount}</span> 条
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">最小延迟 (毫秒):</label>
                    <input type="number" id="min-delay-input" value="${config.minDelay}" min="100" style="width: 90%; padding: 5px; margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">最大延迟 (毫秒):</label>
                    <input type="number" id="max-delay-input" value="${config.maxDelay}" min="100" style="width: 90%; padding: 5px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <input type="checkbox" id="skip-liked-checkbox" ${config.skipLiked ? 'checked' : ''} style="margin-right: 5px;">
                        <label for="skip-liked-checkbox">跳过已点赞微博</label>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="auto-liker-start" style="padding: 5px 10px; background-color: ${isRunning ? '#555' : '#1da1f2'}; color: white; border: none; border-radius: 4px; cursor: pointer;">${isRunning ? '暂停' : '开始'}</button>
                    <button id="auto-liker-stop" style="padding: 5px 10px; background-color: #e0245e; color: white; border: none; border-radius: 4px; cursor: pointer;">停止</button>
                </div>
            `;
        } else {
            panel.innerHTML = `
                <button id="auto-liker-expand" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">+</button>
            `;
            panel.style.padding = '8px';
            panel.style.minWidth = 'auto';
        }

        // Add event listeners
        if (panelExpanded) {
            const minimizeBtn = panel.querySelector('#auto-liker-minimize');
            const startBtn = panel.querySelector('#auto-liker-start');
            const stopBtn = panel.querySelector('#auto-liker-stop');
            const minDelayInput = panel.querySelector('#min-delay-input');
            const maxDelayInput = panel.querySelector('#max-delay-input');
            const skipLikedCheckbox = panel.querySelector('#skip-liked-checkbox');
            
            if (minimizeBtn) minimizeBtn.addEventListener('click', togglePanel);
            if (startBtn) startBtn.addEventListener('click', toggleAutoLike);
            if (stopBtn) stopBtn.addEventListener('click', stopAutoLike);
            
            // Add event listeners for delay inputs
            if (minDelayInput) {
                minDelayInput.addEventListener('change', function() {
                    const value = parseInt(this.value);
                    if (!isNaN(value) && value >= 100) {
                        config.minDelay = value;
                        // Ensure min doesn't exceed max
                        if (config.minDelay > config.maxDelay) {
                            config.maxDelay = config.minDelay;
                            maxDelayInput.value = config.maxDelay;
                        }
                    } else {
                        this.value = config.minDelay;
                    }
                });
            }
            
            if (maxDelayInput) {
                maxDelayInput.addEventListener('change', function() {
                    const value = parseInt(this.value);
                    if (!isNaN(value) && value >= 100) {
                        config.maxDelay = value;
                        // Ensure max isn't less than min
                        if (config.maxDelay < config.minDelay) {
                            config.minDelay = config.maxDelay;
                            minDelayInput.value = config.minDelay;
                        }
                    } else {
                        this.value = config.maxDelay;
                    }
                });
            }
            
            if (skipLikedCheckbox) {
                skipLikedCheckbox.addEventListener('change', function() {
                    config.skipLiked = this.checked;
                });
            }
        } else {
            const expandBtn = panel.querySelector('#auto-liker-expand');
            if (expandBtn) expandBtn.addEventListener('click', togglePanel);
        }
    }

    // Toggle panel expansion
    function togglePanel() {
        panelExpanded = !panelExpanded;
        const panel = document.getElementById('auto-liker-panel');
        updatePanelContent(panel);
    }

    // Random delay function
    function randomDelay() {
        const delay = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Check if a like button has already been liked
    function isAlreadyLiked(likeButton) {
        // Check if the count span has the "liked" class
        const countSpan = likeButton.querySelector('.woo-like-count');
        if (countSpan && countSpan.classList.contains('woo-like-liked')) {
            return true;
        }
        
        // Check if the SVG has the "liked" reference
        const svgUse = likeButton.querySelector('svg use');
        if (svgUse && svgUse.getAttribute('xlink:href') === '#woo_svg_liked') {
            return true;
        }

        return false;
    }

    // Find the parent item container of a like button
    function findParentItem(element) {
        let current = element;
        while (current && !current.classList.contains('wbpro-scroller-item')) {
            current = current.parentElement;
        }
        return current;
    }

    // 新增：为按钮生成唯一ID
    function getButtonId(button) {
        if (!button.dataset.autoLikerId) {
            const parentItem = findParentItem(button);
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            button.dataset.autoLikerId = `btn-${timestamp}-${random}`;
        }
        return button.dataset.autoLikerId;
    }

    // Update countdown in like button
    function updateCountdown(likeButton, timeLeft) {
        const countSpan = likeButton.querySelector('.woo-like-count');
        if (countSpan) {
            const originalText = countSpan.getAttribute('data-original-text') || countSpan.textContent;
            if (!countSpan.getAttribute('data-original-text')) {
                countSpan.setAttribute('data-original-text', originalText);
            }
            
            if (timeLeft > 0) {
                countSpan.textContent = `${originalText} (${Math.ceil(timeLeft / 1000)}s)`;
            } else {
                countSpan.textContent = originalText;
            }
        }
    }

    // Reset countdown display
    function resetCountdown(likeButton) {
        const countSpan = likeButton.querySelector('.woo-like-count');
        if (countSpan && countSpan.getAttribute('data-original-text')) {
            countSpan.textContent = countSpan.getAttribute('data-original-text');
            countSpan.removeAttribute('data-original-text');
        }
    }

    // Scroll element into view
    function scrollIntoViewIfNeeded(element) {
        const rect = element.getBoundingClientRect();
        const isInView = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        if (!isInView) {
            // 修改：确保元素滚动到视图中的下半部分，而不是中间
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const elementTop = rect.top + scrollTop;
            const targetScrollTop = elementTop - (window.innerHeight * 0.7);
            
            window.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }

    // Process like buttons
    async function processLikeButtons() {
        if (!isRunning || isProcessing) return;
        
        isProcessing = true;
        
        try {
            // 获取所有点赞按钮并按照它们在页面中的位置排序（从上到下）
            const allLikeButtons = Array.from(document.querySelectorAll('button.woo-like-main'))
                .sort((a, b) => {
                    const rectA = a.getBoundingClientRect();
                    const rectB = b.getBoundingClientRect();
                    return rectA.top - rectB.top;
                });
                
            console.log(`Found ${allLikeButtons.length} like buttons`);
            
            // 过滤出未处理过的按钮
            const likeButtons = allLikeButtons.filter(button => {
                const buttonId = getButtonId(button);
                return !processedButtons.has(buttonId);
            });
            
            console.log(`Found ${likeButtons.length} unprocessed like buttons`);
            
            if (likeButtons.length === 0) {
                // 如果没有未处理的按钮，滚动页面加载更多内容
                console.log('No unprocessed buttons found, scrolling to load more...');
                window.scrollBy({
                    top: config.scrollStep * 2,
                    behavior: 'smooth'
                });
                
                // 等待新内容加载
                await new Promise(resolve => setTimeout(resolve, 2000));
                isProcessing = false;
                return;
            }

            // 只处理第一个未处理的按钮
            const button = likeButtons[0];
            const buttonId = getButtonId(button);
            
            // 记录这个按钮已被处理
            processedButtons.add(buttonId);
            lastProcessedButtonId = buttonId;

            // 只处理视窗内和视窗下方的按钮
            const rect = button.getBoundingClientRect();
            if (rect.top < 0) {
                isProcessing = false;
                return; // 跳过视窗上方的按钮
            }

            // 如果配置为跳过已点赞的微博，则检查是否已点赞
            if (config.skipLiked && isAlreadyLiked(button)) {
                console.log('Skipping already liked post');
                isProcessing = false;
                return;
            }

            // Find parent item and highlight it
            const parentItem = findParentItem(button);
            let originalBackground = '';
            
            if (parentItem) {
                originalBackground = parentItem.style.backgroundColor || '';
                parentItem.style.backgroundColor = '#f09199';
                scrollIntoViewIfNeeded(parentItem);
            }

            // Calculate delay
            const delay = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
            
            // Start countdown
            const startTime = Date.now();
            const endTime = startTime + delay;
            
            // Update countdown every 100ms
            while (Date.now() < endTime && isRunning) {
                const timeLeft = endTime - Date.now();
                updateCountdown(button, timeLeft);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Reset countdown display
            resetCountdown(button);
            
            // Only click if not already liked
            if (!isAlreadyLiked(button) && isRunning) {
                button.click();
                likeCount++;

                // Update counter in panel
                const countElement = document.getElementById('auto-liker-count');
                if (countElement) {
                    countElement.textContent = likeCount;
                }
            }
            
            // Reset parent item background
            if (parentItem) {
                parentItem.style.backgroundColor = originalBackground;
            }
        } finally {
            isProcessing = false;
            
            // 如果仍在运行，安排下一次处理
            if (isRunning) {
                setTimeout(processLikeButtons, 500);
            }
        }
    }

    // Auto-scroll function
    function startAutoScroll() {
        if (scrollIntervalId) {
            clearInterval(scrollIntervalId);
        }

        scrollIntervalId = setInterval(() => {
            if (!isRunning) return;
            
            // 检查是否有未处理的按钮
            const unprocessedButtons = Array.from(document.querySelectorAll('button.woo-like-main'))
                .filter(button => {
                    const buttonId = getButtonId(button);
                    return !processedButtons.has(buttonId);
                });
                
            // 如果没有未处理的按钮，且我们接近页面底部，则滚动加载更多
            if (unprocessedButtons.length === 0 || 
                ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000)) {
                
                // 检查是否有正在处理的项目
                if (!isProcessing) {
                    console.log('Scrolling to load more content...');
                    window.scrollBy({
                        top: config.scrollStep,
                        behavior: 'smooth'
                    });
                    
                    // 等待滚动完成后再处理按钮
                    setTimeout(() => {
                        if (!isProcessing) {
                            processLikeButtons();
                        }
                    }, 1500);
                }
            } else if (!isProcessing) {
                // 如果有未处理的按钮且当前没有正在处理的按钮，则处理下一个
                processLikeButtons();
            }
        }, config.scrollInterval);
    }

    // Toggle auto-like functionality
    function toggleAutoLike() {
        isRunning = !isRunning;

        const panel = document.getElementById('auto-liker-panel');
        updatePanelContent(panel);

        if (isRunning) {
            // 重置处理状态
            isProcessing = false;
            startAutoScroll();
            processLikeButtons();
        } else {
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
                scrollIntervalId = null;
            }
            
            // 重置所有标记的背景
            document.querySelectorAll('.wbpro-scroller-item[style*="background-color: rgb(240, 145, 153)"]').forEach(item => {
                item.style.backgroundColor = '';
            });
        }
    }

    // Stop auto-like functionality
    function stopAutoLike() {
        isRunning = false;
        likeCount = 0;
        isProcessing = false;
        lastProcessedButtonId = null;
        processedButtons.clear();  // 清空已处理按钮集合

        if (scrollIntervalId) {
            clearInterval(scrollIntervalId);
            scrollIntervalId = null;
        }

        // 重置所有标记的背景
        document.querySelectorAll('.wbpro-scroller-item[style*="background-color: rgb(240, 145, 153)"]').forEach(item => {
            item.style.backgroundColor = '';
        });

        const panel = document.getElementById('auto-liker-panel');
        updatePanelContent(panel);
    }

    // Initialize the script
    function init() {
        console.log('Initializing Weibo Turbo Wheelchair script...');
        createPanel();
        console.log('Panel should be visible now');
        
        // Debug: Check z-index conflicts
        const highZIndexElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            return !isNaN(zIndex) && zIndex > 9000;
        });
        
        console.log('Elements with high z-index that might overlap panel:', highZIndexElements);
    }

    // Start the script when the page is fully loaded
    window.addEventListener('load', init);
    
    // Alternative initialization method in case 'load' event already fired
    if (document.readyState === 'complete') {
        console.log('Document already loaded, initializing now...');
        setTimeout(init, 1000);
    }
})();
