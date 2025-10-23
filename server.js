const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { matchKnowledgeBase, getKnowledgeContent, getPlatformSEOKnowledge } = require('./knowledge-base');

const app = express();
const PORT = 3000;

// OpenRouter API 配置
const OPENAI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// AI 生成脚本接口
app.post('/api/generate-script', async (req, res) => {
    try {
        const { 
            audience, 
            duration, 
            style, 
            platform, 
            painpoints, 
            features, 
            cta, 
            language,
            apiKey 
        } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: '缺少 API Key'
            });
        }

        console.log('📝 收到生成请求:', { audience, duration, platform, language });

        // 构建 prompt
        const prompt = buildPrompt(req.body);
        
        console.log('🤖 调用 AI API...');

        // 调用 OpenRouter API
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Wegic SEO Script Generator'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的视频脚本撰写专家，擅长创作SEO优化的营销视频文案。你的脚本自然流畅、富有吸引力，能精准打动目标受众。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ API 错误:', error);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const script = data.choices[0].message.content;

        console.log('✅ 脚本生成成功');

        // 生成 SEO 数据
        const seoData = generateSEO(req.body);

        res.json({
            success: true,
            script: script,
            seo: seoData
        });

    } catch (error) {
        console.error('❌ 生成错误:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 构建 AI prompt
function buildPrompt(data) {
    const { audience, duration, style, platform, painpoints, features, cta, language } = data;
    
    let prompt = `请为 Wegic AI 建站工具创作一个${language === '英文' ? '英文' : '中文'}视频配音脚本。

**视频参数：**
- 目标受众：${audience}
- 视频时长：${duration}
- 内容风格：${style}
- 发布平台：${platform}
- 痛点：${painpoints.join('、')}
- 功能卖点：${features.join('、')}
- 行动召唤：${cta}

**脚本要求：**
1. 纯配音文字，不要任何场景描述、镜头说明、标记符号
2. 语言自然流畅，适合人声朗读
3. 结构清晰：痛点引入 → 解决方案介绍 → 功能演示步骤 → 结尾CTA
4. 根据时长控制字数：
   - 30-60秒：约150-300字
   - 1-2分钟：约300-500字
   - 2-3分钟：约500-750字
   - 3-5分钟：约750-1200字
5. 必须包含 Wegic 的核心价值：3分钟建站、无需代码、AI对话式、30万用户
6. 语气要符合${style}风格
7. 适配${platform}平台特点
8. ${language === '英文' ? '使用地道的英文表达' : '使用口语化的中文表达'}

**示例开场（仅供参考风格）：**
${getExampleOpening(audience, style, language)}

请直接输出脚本正文，不要有任何额外的说明文字。`;

    return prompt;
}

// 示例开场
function getExampleOpening(audience, style, language) {
    if (language === '英文') {
        const examples = {
            '专业严谨': `As a business owner, you know that having a professional website is essential. But the traditional process is expensive, time-consuming, and complicated.`,
            '轻松幽默': `Okay, let's be honest. Building a website usually means one of three things: spending thousands on an agency, learning to code, or settling for a terrible template.`,
            '问题解决': `Want to build a website but don't know where to start? Today I'll show you a solution that takes just 3 minutes.`
        };
        return examples[style] || examples['问题解决'];
    } else {
        const examples = {
            '专业严谨': `作为${audience === '企业主' ? '企业老板' : audience}，您一定知道官网对业务的重要性。但传统建站流程复杂、费用高昂、周期漫长。`,
            '轻松幽默': `说实话，想做个网站，要么花几万找外包，要么自己学代码学到秃头，要么用那些千篇一律的模板。`,
            '问题解决': `想做网站但不知道从哪开始？今天分享一个方法，3分钟就能搞定。`
        };
        return examples[style] || examples['问题解决'];
    }
}

// 生成 SEO 数据
function generateSEO(data) {
    const { audience, platform, duration, language } = data;
    
    if (language === '英文') {
        return {
            title: `Build a Website in 3 Minutes | Wegic AI for ${audience}`,
            description: `Learn how to create a professional website in just 3 minutes using Wegic AI. No coding required. Perfect for ${audience}.`,
            tags: ['#Wegic', '#AIWebBuilder', '#NoCode', '#WebDesign', `#${platform}`, '#Tutorial'],
            timestamps: generateTimestamps(duration, 'en')
        };
    } else {
        return {
            title: `3分钟建网站？Wegic AI让${audience}秒变建站高手！`,
            description: `【${platform}建站教程】教你用Wegic快速搭建专业网站\n✅ 适合${audience}\n✅ ${duration}完整教程\n✅ 无需代码\n\n🔗 Wegic官网：https://wegic.ai`,
            tags: ['#Wegic', '#AI建站', '#无代码', '#网站制作', `#${platform}`, '#教程'],
            timestamps: generateTimestamps(duration, 'zh')
        };
    }
}

// 生成时间戳
function generateTimestamps(duration, lang) {
    if (lang === 'en') {
        if (duration.includes('30') || duration.includes('60')) {
            return '0:00 The Problem\n0:15 Wegic Solution\n0:40 Quick Demo';
        } else if (duration.includes('1-2')) {
            return '0:00 Introduction\n0:20 Step 1: Chat with AI\n0:50 Step 2: Customize\n1:20 Step 3: Publish';
        } else {
            return '0:00 Pain Points\n0:30 Wegic Overview\n1:00 Step 1: AI Chat\n1:40 Step 2: Edit & Customize\n2:20 Step 3: Publish Live\n2:50 Conclusion & CTA';
        }
    } else {
        if (duration.includes('30') || duration.includes('60')) {
            return '0:00 建站痛点\n0:15 Wegic介绍\n0:40 快速演示';
        } else if (duration.includes('1-2')) {
            return '0:00 开场\n0:20 步骤一：AI对话\n0:50 步骤二：修改调整\n1:20 步骤三：发布上线';
        } else {
            return '0:00 建站痛点\n0:30 Wegic介绍\n1:00 步骤一：AI对话建站\n1:40 步骤二：实时编辑\n2:20 步骤三：一键发布\n2:50 总结与福利';
        }
    }
}

// 智能脚本生成接口 - 一次生成中英双语 + SEO
app.post('/api/generate-smart-script', async (req, res) => {
    try {
        const { topic, duration, platform, additionalInfo, languages, apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ success: false, error: '缺少 API Key' });
        }
        
        if (!topic) {
            return res.status(400).json({ success: false, error: '缺少主题' });
        }
        
        console.log(`📝 智能生成请求: ${topic} (${duration}, ${platform})`);
        
        // 检测知识库
        const knowledgeTypes = matchKnowledgeBase(topic, additionalInfo);
        const knowledgeContent = getKnowledgeContent(knowledgeTypes);
        const platformSEO = getPlatformSEOKnowledge(platform);
        
        console.log(`📚 加载知识库: ${knowledgeTypes.join(', ')}`);
        
        // 第一步：生成中文脚本
        const cnPrompt = buildChineseScriptPrompt(topic, duration, platform, additionalInfo, knowledgeContent, platformSEO);
        
        console.log('🤖 步骤1: 生成中文脚本...');
        
        const cnResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'SEO Video Script Designer'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: '你是专业的 SEO 视频脚本设计师。创作自然流畅、吸引人的配音脚本。'
                    },
                    {
                        role: 'user',
                        content: cnPrompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });
        
        if (!cnResponse.ok) {
            throw new Error(`中文脚本生成失败: ${cnResponse.status}`);
        }
        
        const cnData = await cnResponse.json();
        const cnScript = cnData.choices[0].message.content;
        
        console.log('✅ 中文脚本生成成功');
        
        let enScript = null;
        let seoData = null;
        
        // 第二步：如果需要英文，翻译中文脚本
        if (languages && languages.includes('英文')) {
            console.log('🤖 步骤2: 翻译为英文...');
            
            const translatePrompt = `请将以下视频配音脚本翻译成英文，保持相同的意思、结构和语气：

${cnScript}

要求：
1. 自然流畅的英文表达
2. 保持相同的段落结构
3. 保持相同的语气和情感
4. 适合英文配音朗读
5. 只输出翻译后的脚本，不要任何说明文字`;
            
            const enResponse = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'SEO Video Script Designer'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional translator. Translate Chinese video scripts to natural, fluent English.'
                        },
                        {
                            role: 'user',
                            content: translatePrompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })
            });
            
            if (enResponse.ok) {
                const enData = await enResponse.json();
                enScript = enData.choices[0].message.content;
                console.log('✅ 英文翻译完成');
            }
        }
        
        // 第三步：生成智能SEO
        console.log('🤖 步骤3: 生成智能SEO优化...');
        
        const seoPrompt = `基于以下视频脚本，生成专业的 SEO 优化内容：

脚本内容：
${cnScript}

平台：${platform}
主题：${topic}

请生成：
1. 吸引人的视频标题（60字符内，包含核心关键词）
2. 详细的视频描述（200字左右，包含关键信息和价值点）
3. 10-15个相关标签（从脚本内容中提炼，包括主题词、相关词、长尾词）

要求：
- 标题要吸引点击，但不要标题党
- 描述要包含脚本的核心价值和亮点
- 标签要精准相关，有搜索量
- 针对 ${platform} 平台优化

请用JSON格式输出：
{
  "title": "视频标题",
  "description": "视频描述",
  "tags": ["标签1", "标签2", ...]
}`;
        
        const seoResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'SEO Video Script Designer'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: '你是 SEO 专家，擅长从内容中提炼关键词和优化元数据。'
                    },
                    {
                        role: 'user',
                        content: seoPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            })
        });
        
        if (seoResponse.ok) {
            const seoResult = await seoResponse.json();
            try {
                seoData = JSON.parse(seoResult.choices[0].message.content);
                console.log('✅ SEO 优化生成成功');
            } catch (e) {
                console.log('⚠️ SEO 解析失败，使用默认');
            }
        }
        
        res.json({
            success: true,
            cnScript: cnScript,
            enScript: enScript,
            seo: seoData
        });
        
    } catch (error) {
        console.error('❌ 生成错误:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 构建中文脚本 prompt
function buildChineseScriptPrompt(topic, duration, platform, additionalInfo, knowledgeContent, platformSEO) {
    return `为 ${platform} 平台创作一个 ${duration} 的视频配音脚本，主题是："${topic}"

${additionalInfo ? `特殊要求：${additionalInfo}\n` : ''}
${knowledgeContent ? `\n【知识库参考 - 如果与主题相关请使用这些准确信息】\n${knowledgeContent}` : ''}
${platformSEO ? `\n【${platform} 平台特点】\n${platformSEO}` : ''}

脚本要求：
1. 纯配音文字，不要任何场景描述、镜头说明、括号注释、旁白标记
2. 语言自然流畅，口语化表达，适合真人朗读配音
3. 针对 ${platform} 平台优化 - 自然融入关键词
4. 结构：吸引眼球的开场（前3秒黄金法则）→ 提供价值的主要内容 → 强有力的行动召唤
5. 时长控制在 ${duration} 左右（约${getWordCount(duration)}字）
6. 符合 ${platform} 平台的风格特点和用户习惯
7. 如果主题是 Wegic，必须使用知识库中的准确数据（如300,000+网站，60秒建站）
8. 如果主题不是 Wegic，忽略 Wegic 知识库，专注于实际主题
9. 使用对话感强的语言，多用"你"而不是"我们"

请直接输出完整的配音脚本，用自然流畅的中文。不要任何开场白、说明文字或格式标记。`;
}

// 根据时长估算字数
function getWordCount(duration) {
    const durations = {
        '30-60秒': '150-300',
        '1-2分钟': '300-500',
        '2-3分钟': '500-750',
        '3-5分钟': '750-1200',
        '5-10分钟': '1200-2400'
    };
    return durations[duration] || '500-750';
}

app.listen(PORT, () => {
    console.log('🚀 SEO视频脚本设计师 1.0 服务器已启动');
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🤖 AI 模式: 智能主题识别`);
    console.log(`💡 支持: 任意主题的视频脚本生成`);
    console.log('─────────────────────────────────────');
});

