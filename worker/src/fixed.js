import handler from './index.js';

export default {
  async fetch(request, env, ctx) {
    const originalAI = env.AI;
    const wrappedAI = {
      async run(...args) {
        const result = await originalAI.run(...args);
        if (typeof result?.response === 'string') return result;
        const content = result?.choices?.[0]?.message?.content ?? result?.choices?.[0]?.text;
        if (typeof content === 'string') return { response: content };
        return result;
      }
    };

    const wrappedEnv = new Proxy(env, {
      get(target, prop) {
        if (prop === 'AI') return wrappedAI;
        return Reflect.get(target, prop);
      }
    });

    return handler.fetch(request, wrappedEnv, ctx);
  }
};
