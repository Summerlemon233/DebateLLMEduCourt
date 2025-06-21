import { NextApiRequest, NextApiResponse } from 'next';

/**
 * 智能体LLM调用API
 * 为各个智能体提供统一的LLM调用接口
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    const { model, prompt, temperature = 0.7, maxTokens = 2048 } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: '缺少必要参数: model, prompt' });
    }

    // 根据模型选择相应的API调用
    let apiResponse;
    switch (model.toLowerCase()) {
      case 'deepseek':
        apiResponse = await callDeepSeek(prompt, temperature, maxTokens);
        break;
      case 'qwen':
        apiResponse = await callQwen(prompt, temperature, maxTokens);
        break;
      case 'chatglm':
        apiResponse = await callChatGLM(prompt, temperature, maxTokens);
        break;
      case 'hunyuan':
        apiResponse = await callHunyuan(prompt, temperature, maxTokens);
        break;
      case 'doubao':
        apiResponse = await callDoubao(prompt, temperature, maxTokens);
        break;
      default:
        return res.status(400).json({ error: `不支持的模型: ${model}` });
    }

    res.status(200).json({
      content: apiResponse.content,
      tokensUsed: apiResponse.tokensUsed,
      model: model,
    });
  } catch (error) {
    console.error('智能体LLM调用失败:', error);
    res.status(500).json({ 
      error: '智能体LLM调用失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
}

// DeepSeek API调用
async function callDeepSeek(prompt: string, temperature: number, maxTokens: number) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_DEFAULT_MODEL || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API错误: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// Qwen API调用
async function callQwen(prompt: string, temperature: number, maxTokens: number) {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.QWEN_DEFAULT_MODEL || 'qwen-turbo-latest',
      input: { prompt },
      parameters: {
        temperature,
        max_tokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Qwen API错误: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.output.text,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// ChatGLM API调用
async function callChatGLM(prompt: string, temperature: number, maxTokens: number) {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CHATGLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.CHATGLM_DEFAULT_MODEL || 'glm-4',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`ChatGLM API错误: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// Hunyuan API调用
async function callHunyuan(prompt: string, temperature: number, maxTokens: number) {
  const response = await fetch(`${process.env.HUNYUAN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.HUNYUAN_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.HUNYUAN_DEFAULT_MODEL || 'hunyuan-lite',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Hunyuan API错误: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

// Doubao API调用
async function callDoubao(prompt: string, temperature: number, maxTokens: number) {
  const response = await fetch(`${process.env.DOUBAO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.DOUBAO_DEFAULT_MODEL || 'doubao-lite-4k',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Doubao API错误: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}
