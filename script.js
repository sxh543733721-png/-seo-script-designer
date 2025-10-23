// SEO视频脚本设计师 1.0 - 智能对话式UI
class ScriptDesigner {
    constructor() {
        // 自动检测是本地还是在线环境
        this.API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
        this.currentStep = 0;
        this.answers = {};
        
        // 简化的问题流程 - 只问最必要的信息
        this.questions = [
            {
                id: 'topic',
                question: '你好！我是 SEO 视频脚本设计师。',
                question2: '请告诉我，你想制作什么主题的视频？',
                questionEn: 'Hello! I\'m your SEO Video Script Designer.',
                questionEn2: 'What topic would you like to create a video about?',
                type: 'input',
                placeholder: '例如：美食教程、编程技巧、旅游攻略、产品介绍...'
            },
            {
                id: 'duration',
                question: '视频大约多长时间？',
                questionEn: 'How long will the video be?',
                type: 'select',
                options: [
                    { value: '30-60秒', label: '30-60秒', labelEn: '30-60 seconds' },
                    { value: '1-2分钟', label: '1-2分钟', labelEn: '1-2 minutes' },
                    { value: '2-3分钟', label: '2-3分钟', labelEn: '2-3 minutes' },
                    { value: '3-5分钟', label: '3-5分钟', labelEn: '3-5 minutes' },
                    { value: '5-10分钟', label: '5-10分钟', labelEn: '5-10 minutes' }
                ]
            },
            {
                id: 'platform',
                question: '视频将发布在哪个平台？',
                questionEn: 'Which platform will the video be published on?',
                type: 'select',
                options: [
                    { value: 'YouTube', label: 'YouTube', labelEn: 'YouTube' },
                    { value: '抖音', label: '抖音/TikTok', labelEn: 'Douyin/TikTok' },
                    { value: '小红书', label: '小红书', labelEn: 'Xiaohongshu' },
                    { value: 'B站', label: 'B站', labelEn: 'Bilibili' },
                    { value: 'Instagram', label: 'Instagram', labelEn: 'Instagram' }
                ]
            },
            {
                id: 'additionalInfo',
                question: '还有什么特别要求吗？（可选）',
                questionEn: 'Any special requirements? (Optional)',
                type: 'input',
                placeholder: '例如：目标受众、风格要求、必须提到的要点...',
                optional: true
            },
            {
                id: 'languages',
                question: '需要哪些语言版本？',
                questionEn: 'Which language versions do you need?',
                type: 'multiselect',
                options: [
                    { value: '中文', label: '中文', labelEn: 'Chinese' },
                    { value: '英文', label: 'English', labelEn: 'English' }
                ]
            }
        ];
        
        this.initElements();
        this.startConversation();
    }

    initElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInputArea = document.getElementById('chatInputArea');
        this.resultModal = document.getElementById('resultModal');
        this.toast = document.getElementById('toast');
        this.historyList = document.getElementById('historyList');
        
        // 绑定模态框事件
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('regenerateBtn').addEventListener('click', () => this.restart());
        
        // 绑定复制按钮
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                this.copyToClipboard(targetId);
            });
        });
        
        // 绑定历史记录按钮
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
        
        // 加载历史记录
        this.loadHistory();
    }

    startConversation() {
        // 清空欢迎消息
        this.chatMessages.innerHTML = '';
        
        setTimeout(() => {
            this.askQuestion(0);
        }, 500);
    }

    askQuestion(index) {
        if (index >= this.questions.length) {
            this.generateScript();
            return;
        }

        const q = this.questions[index];
        this.currentStep = index;
        
        // 更新进度
        this.updateProgress(index + 1);
        
        // 显示问题
        if (q.question2) {
            this.addBotMessage(q.question, q.questionEn);
            setTimeout(() => {
                this.addBotMessage(q.question2, q.questionEn2);
            }, 500);
            setTimeout(() => {
                this.showInput(q, index);
            }, 800);
        } else {
            this.addBotMessage(q.question, q.questionEn);
            setTimeout(() => {
                this.showInput(q, index);
            }, 300);
        }
    }

    addBotMessage(textCn, textEn, hint = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${textCn}</p>
                <p>${textEn}</p>
                ${hint ? `<p class="message-hint">${hint}</p>` : ''}
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showInput(question, index) {
        this.chatInputArea.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'input-container';
        
        if (question.type === 'input') {
            this.createTextInput(container, question, index);
        } else if (question.type === 'select') {
            this.createSelectInput(container, question, index);
        } else if (question.type === 'multiselect') {
            this.createMultiSelectInput(container, question, index);
        }
        
        this.chatInputArea.appendChild(container);
    }

    createTextInput(container, question, index) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-input';
        input.placeholder = question.placeholder;
        input.id = 'currentInput';
        
        const btnContainer = document.createElement('div');
        btnContainer.className = 'action-buttons';
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn-primary';
        submitBtn.textContent = '下一步 / Next';
        submitBtn.onclick = () => {
            const value = input.value.trim();
            if (value || question.optional) {
                this.saveAnswer(question.id, value || '无特殊要求');
                if (value) {
                    this.addUserMessage(value);
                } else {
                    this.addUserMessage('跳过 / Skip');
                }
                this.askQuestion(index + 1);
            } else {
                this.showToast('请输入内容 / Please enter content');
            }
        };
        
        // 回车提交
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitBtn.click();
            }
        });
        
        btnContainer.appendChild(submitBtn);
        
        // 如果是可选的，添加跳过按钮
        if (question.optional) {
            const skipBtn = document.createElement('button');
            skipBtn.className = 'btn-secondary';
            skipBtn.textContent = '跳过 / Skip';
            skipBtn.onclick = () => {
                this.saveAnswer(question.id, '');
                this.addUserMessage('跳过 / Skip');
                this.askQuestion(index + 1);
            };
            btnContainer.appendChild(skipBtn);
        }
        
        container.appendChild(input);
        container.appendChild(btnContainer);
        
        setTimeout(() => input.focus(), 100);
    }

    createSelectInput(container, question, index) {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        
        question.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `
                <span class="option-btn-cn">${option.label}</span>
                <span class="option-btn-en">${option.labelEn}</span>
            `;
            btn.onclick = () => {
                this.saveAnswer(question.id, option.value);
                this.addUserMessage(option.label);
                this.askQuestion(index + 1);
            };
            grid.appendChild(btn);
        });
        
        container.appendChild(grid);
    }

    createMultiSelectInput(container, question, index) {
        const hint = document.createElement('div');
        hint.className = 'multi-select-hint';
        hint.textContent = '可选择多个选项 / Multiple selections allowed';
        container.appendChild(hint);
        
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        
        const selected = new Set();
        
        question.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.dataset.value = option.value;
            btn.innerHTML = `
                <span class="option-btn-cn">${option.label}</span>
                <span class="option-btn-en">${option.labelEn}</span>
            `;
            btn.onclick = () => {
                if (selected.has(option.value)) {
                    selected.delete(option.value);
                    btn.classList.remove('selected');
                } else {
                    selected.add(option.value);
                    btn.classList.add('selected');
                }
            };
            grid.appendChild(btn);
        });
        
        container.appendChild(grid);
        
        const btnContainer = document.createElement('div');
        btnContainer.className = 'action-buttons';
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn-primary';
        submitBtn.textContent = '下一步 / Next';
        submitBtn.onclick = () => {
            if (selected.size > 0) {
                const values = Array.from(selected);
                this.saveAnswer(question.id, values);
                this.addUserMessage(values.join('、'));
                this.askQuestion(index + 1);
            } else {
                this.showToast('请至少选择一个选项 / Please select at least one');
            }
        };
        
        btnContainer.appendChild(submitBtn);
        container.appendChild(btnContainer);
    }

    saveAnswer(id, value) {
        this.answers[id] = value;
        console.log('已保存:', id, value);
    }

    updateProgress(step) {
        document.querySelectorAll('.progress-step').forEach((el, index) => {
            el.classList.remove('active', 'completed');
            if (index < step - 1) {
                el.classList.add('completed');
            } else if (index === step - 1) {
                el.classList.add('active');
            }
        });
    }

    async generateScript() {
        this.chatInputArea.innerHTML = '';
        
        this.addBotMessage(
            '太好了！让我根据你的主题为你量身定制专业脚本...',
            'Great! Let me create a custom professional script for your topic...',
            '这可能需要10-20秒 / This may take 10-20 seconds'
        );
        
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (!apiKey) {
            this.showToast('请配置 API Key / Please configure API Key');
            return;
        }
        
        try {
            // 一次性生成中英文 + SEO
            const response = await fetch(`${this.API_URL}/api/generate-smart-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...this.buildScriptRequest(),
                    apiKey: apiKey
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '生成失败');
            }
            
            const result = await response.json();
            
            // 显示中文脚本
            document.getElementById('cnScript').value = result.cnScript;
            
            // 显示英文脚本（如果有）
            if (result.enScript) {
                document.getElementById('enScript').value = result.enScript;
                document.getElementById('enSection').style.display = 'block';
            } else {
                document.getElementById('enSection').style.display = 'none';
            }
            
            // 显示智能SEO（如果有）
            if (result.seo) {
                this.displaySmartSEO(result.seo);
                document.getElementById('seoSection').style.display = 'block';
            } else {
                document.getElementById('seoSection').style.display = 'none';
            }
            
            // 保存到历史记录
            this.saveToHistory({
                topic: this.answers.topic,
                duration: this.answers.duration,
                platform: this.answers.platform,
                cnScript: result.cnScript,
                enScript: result.enScript,
                seo: result.seo
            });
            
            this.addBotMessage(
                '✨ 脚本生成完成！我已经根据你的主题定制了专业内容',
                '✨ Script generated! I\'ve customized professional content for your topic'
            );
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn-primary';
            viewBtn.textContent = '查看结果 / View Results';
            viewBtn.onclick = () => this.showModal();
            
            const newBtn = document.createElement('button');
            newBtn.className = 'btn-secondary';
            newBtn.textContent = '再写一个 / Write Another';
            newBtn.onclick = () => this.writeAnother();
            
            const btnContainer = document.createElement('div');
            btnContainer.className = 'action-buttons';
            btnContainer.appendChild(viewBtn);
            btnContainer.appendChild(newBtn);
            
            const container = document.createElement('div');
            container.className = 'input-container';
            container.appendChild(btnContainer);
            this.chatInputArea.appendChild(container);
            
        } catch (error) {
            console.error('生成错误:', error);
            this.addBotMessage(
                '❌ 生成失败：' + error.message,
                '❌ Generation failed: ' + error.message
            );
            
            // 添加重试按钮
            const retryBtn = document.createElement('button');
            retryBtn.className = 'btn-primary';
            retryBtn.textContent = '重试 / Retry';
            retryBtn.onclick = () => this.generateScript();
            
            const btnContainer = document.createElement('div');
            btnContainer.className = 'action-buttons';
            btnContainer.appendChild(retryBtn);
            
            const container = document.createElement('div');
            container.className = 'input-container';
            container.appendChild(btnContainer);
            this.chatInputArea.appendChild(container);
        }
    }

    buildScriptRequest() {
        return {
            topic: this.answers.topic || '',
            duration: this.answers.duration || '2-3分钟',
            platform: this.answers.platform || 'YouTube',
            additionalInfo: this.answers.additionalInfo || '',
            languages: this.answers.languages || ['中文']
        };
    }

    // 显示智能SEO（从AI生成的内容）
    displaySmartSEO(seoData) {
        const seoContent = document.getElementById('seoContent');
        
        let html = `<h4>📌 视频标题</h4><p>${seoData.title || '未生成'}</p>`;
        html += `<h4>📝 视频描述</h4><p style="white-space: pre-line;">${seoData.description || '未生成'}</p>`;
        
        if (seoData.tags && seoData.tags.length > 0) {
            html += `<h4>🏷️ 推荐标签</h4><div class="tags">`;
            seoData.tags.forEach(tag => {
                const tagText = tag.startsWith('#') ? tag : `#${tag}`;
                html += `<span class="tag">${tagText}</span>`;
            });
            html += `</div>`;
        }
        
        seoContent.innerHTML = html;
    }

    showModal() {
        this.resultModal.classList.add('show');
    }

    closeModal() {
        this.resultModal.classList.remove('show');
    }

    copyToClipboard(targetId) {
        const target = document.getElementById(targetId);
        const text = target.tagName === 'TEXTAREA' ? target.value : target.innerText;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('✅ 已复制 / Copied');
        }).catch(() => {
            target.select();
            document.execCommand('copy');
            this.showToast('✅ 已复制 / Copied');
        });
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2000);
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    // 保存到历史记录
    saveToHistory(data) {
        const history = this.getHistory();
        const item = {
            id: Date.now(),
            topic: data.topic,
            duration: data.duration,
            platform: data.platform,
            cnScript: data.cnScript,
            enScript: data.enScript,
            timestamp: new Date().toISOString()
        };
        
        history.unshift(item);
        
        // 只保留最近20条
        if (history.length > 20) {
            history.splice(20);
        }
        
        localStorage.setItem('scriptHistory', JSON.stringify(history));
        this.loadHistory();
        
        console.log('✅ 已保存到历史记录');
    }

    // 获取历史记录
    getHistory() {
        const stored = localStorage.getItem('scriptHistory');
        return stored ? JSON.parse(stored) : [];
    }

    // 加载历史记录
    loadHistory() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">暂无历史记录</p>';
            return;
        }
        
        this.historyList.innerHTML = '';
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.onclick = () => this.viewHistory(item);
            
            const date = new Date(item.timestamp);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            historyItem.innerHTML = `
                <div class="history-item-title">${item.topic}</div>
                <div class="history-item-meta">${item.platform} • ${item.duration} • ${dateStr}</div>
            `;
            
            this.historyList.appendChild(historyItem);
        });
    }

    // 查看历史记录
    viewHistory(item) {
        document.getElementById('cnScript').value = item.cnScript;
        
        if (item.enScript) {
            document.getElementById('enScript').value = item.enScript;
            document.getElementById('enSection').style.display = 'block';
        } else {
            document.getElementById('enSection').style.display = 'none';
        }
        
        // 显示SEO
        if (item.seo) {
            this.displaySmartSEO(item.seo);
            document.getElementById('seoSection').style.display = 'block';
        } else {
            // 兼容旧版历史记录
            const seoContent = document.getElementById('seoContent');
            seoContent.innerHTML = `
                <h4>📌 视频标题</h4><p>${item.topic} | ${item.platform}</p>
                <h4>📝 视频描述</h4><p>【${item.platform}】${item.topic}\\n✅ ${item.duration}</p>
            `;
            document.getElementById('seoSection').style.display = 'block';
        }
        
        this.showModal();
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？\nClear all history?')) {
            localStorage.removeItem('scriptHistory');
            this.loadHistory();
            this.showToast('✅ 历史记录已清空 / History cleared');
        }
    }

    // 再写一个
    writeAnother() {
        this.addBotMessage(
            '好的！让我们开始新的创作',
            'Great! Let\'s start a new creation'
        );
        
        setTimeout(() => {
            this.restart();
        }, 500);
    }

    restart() {
        this.closeModal();
        this.currentStep = 0;
        this.answers = {};
        this.chatMessages.innerHTML = '';
        this.chatInputArea.innerHTML = '';
        
        setTimeout(() => this.askQuestion(0), 300);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ScriptDesigner();
    console.log('🎬 SEO视频脚本设计师 1.0 已启动');
    console.log('💡 支持任意主题的视频脚本生成');
    console.log('💾 本地存储历史记录');
});
