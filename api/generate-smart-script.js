// Vercel Serverless Function for Smart Script Generation
const fetch = require('node-fetch');

// 导入知识库
const WEGIC_KNOWLEDGE = {
    positioning: "Wegic是你的AI网站团队 - 包含AI设计师、开发者和管理员。只需对话，网站就会被构建、运行并轻松更新。",
    coreFeatures: [
        "60秒对话建站 - 通过对话即可创建完全定制的网站",
        "零代码要求 - 无需任何编程技能",
        "一键发布 - 发布网站只需一次点击",
        "AI自动管理 - AI Manager确保网站自动保持更新",
        "多语言支持 - 帮助全球用户轻松沟通"
    ],
    statistics: "全球220+个国家和地区，300,000+个网站",
    buildingProcess: "第一步：对话需求 → 第二步：AI设计 → 第三步：发布上线"
};

const matchKnowledgeBase = (topic, additionalInfo = '') => {
    const content = `${topic} ${additionalInfo}`.toLowerCase();
    const wegicKeywords = ['wegic', '建站', 'website builder', '网站制作', 'ai建站', '无代码'];
    return wegicKeywords.some(keyword => content.includes(keyword)) ? ['wegic', 'seo'] : ['seo'];
};

const getKnowledgeContent = (knowledgeTypes) => {
    if (!knowledgeTypes.includes('wegic')) return '';
    
    return `
【Wegic 知识库】
产品定位：${WEGIC_KNOWLEDGE.positioning}

核心特点：
${WEGIC_KNOWLEDGE.coreFeatures.map(f => `- ${f}`).join('\n')}

关键数据：${WEGIC_KNOWLEDGE.statistics}

建站流程：${WEGIC_KNOWLEDGE.buildingProcess}
`;
};

const buildChineseScriptPrompt = (topic, duration, platform, additionalInfo, knowledgeContent) => {
    const wordCount = {
        '30-60秒': '150-300',
        '1-2分钟': '300-500',
        '2-3分钟': '500-750',
        '3-5分钟': '750-1200',
        '5-10分钟': '1200-2400'
    }[duration] || '500-750';
    
    return `为 ${platform} 平台创作一个 ${duration} 的视频配音脚本，主题是："${topic}"

${additionalInfo ? `特殊要求：${additionalInfo}\n` : ''}
${knowledgeContent ? `\n【知识库参考 - 如果与主题相关请使用这些准确信息】\n${knowledgeContent}` : ''}

脚本要求：
1. 纯配音文字，不要任何场景描述、镜头说明、括号注释、旁白标记
2. 语言自然流畅，口语化表达，适合真人朗读配音
3. 针对 ${platform} 平台优化 - 自然融入关键词
4. 结构：吸引眼球的开场（前3秒黄金法则）→ 提供价值的主要内容 → 强有力的行动召唤
5. 时长控制在 ${duration} 左右（约${wordCount}字）
6. 如果主题是 Wegic，必须使用知识库中的准确数据（如300,000+网站，60秒建站）
7. 如果主题不是 Wegic，忽略 Wegic 知识库，专注于实际主题
8. 使用对话感强的语言，多用"你"而不是"我们"

请直接输出完整的配音脚本，用自然流畅的中文。不要任何开场白、说明文字或格式标记。`;
};

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const { topic, duration, platform, additionalInfo, languages, apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '缺少 API Key' });
        }
        
        if (!topic) {
            return res.status(400).json({ success: false, error: '缺少主题' });
        }
        
        console.log(`📝 生成请求: ${topic}`);
        
        // 检测知识库
        const knowledgeTypes = matchKnowledgeBase(topic, additionalInfo);
        const knowledgeContent = getKnowledgeContent(knowledgeTypes);
        
        // 生成中文脚本
        const cnPrompt = buildChineseScriptPrompt(topic, duration, platform, additionalInfo, knowledgeContent);
        
        const cnResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://seo-script-designer.vercel.app',
                'X-Title': 'SEO Video Script Designer'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: '你是专业的 SEO 视频脚本设计师。' },
                    { role: 'user', content: cnPrompt }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });
        
        const cnData = await cnResponse.json();
        const cnScript = cnData.choices[0].message.content;
        
        let enScript = null;
        
        // 翻译英文
        if (languages && languages.includes('英文')) {
            const translatePrompt = `请将以下视频配音脚本翻译成英文，保持相同的意思、结构和语气：\n\n${cnScript}\n\n只输出翻译后的脚本。`;
            
            const enResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': req.headers.referer || 'https://seo-script-designer.vercel.app',
                    'X-Title': 'SEO Video Script Designer'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'Professional translator.' },
                        { role: 'user', content: translatePrompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })
            });
            
            const enData = await enResponse.json();
            enScript = enData.choices[0].message.content;
        }
        
        // 生成SEO
        const seoPrompt = `基于以下脚本生成SEO优化：\n${cnScript}\n\n平台：${platform}\n主题：${topic}\n\n生成JSON格式：{"title":"标题","description":"描述","tags":["标签1","标签2"]}`;
        
        const seoResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://seo-script-designer.vercel.app',
                'X-Title': 'SEO Video Script Designer'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'SEO expert.' },
                    { role: 'user', content: seoPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            })
        });
        
        let seoData = null;
        if (seoResponse.ok) {
            const seoResult = await seoResponse.json();
            seoData = JSON.parse(seoResult.choices[0].message.content);
        }
        
        res.json({
            success: true,
            cnScript,
            enScript,
            seo: seoData
        });
        
    } catch (error) {
        console.error('生成错误:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

