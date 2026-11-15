// Qwen model selection for the private Finance Studio.
// @cf/qwen/qwen3-30b-a3b-fp8 is deprecated by Cloudflare on 2026-11-20.
// Qwen3.8 supports text, images, long context and function calling; no financial writes.
export const QWEN_MODEL = "@cf/qwen/qwen3.8-27b" as const;
export const QWEN_OPTIONS = {reasoning_effort:"low",temperature:0.1,stream:false} as const;

export function qwenText(value:unknown):string|null {
  if(!value||typeof value!=="object")return null;
  const record=value as {response?:unknown;choices?:Array<{message?:{content?:unknown}}>};
  const direct=record.response;
  if(typeof direct==="string")return direct;
  if(direct&&typeof direct==="object")return JSON.stringify(direct);
  const body=record.choices?.[0]?.message?.content;
  return typeof body==="string"?body:null;
}

export function qwenJson(value:unknown,maxChars=8000):Record<string,unknown>|null {
  const text=qwenText(value);
  if(!text||text.length>maxChars)return null;
  const first=text.indexOf("{"),last=text.lastIndexOf("}");
  if(first<0||last<=first)return null;
  try{
    const parsed=JSON.parse(text.slice(first,last+1)) as unknown;
    return parsed && typeof parsed==="object" && !Array.isArray(parsed)?
      parsed as Record<string,unknown>:null;
  }catch{return null;}
}
